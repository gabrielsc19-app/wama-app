import { NextResponse } from "next/server";
import { sendWamaEmail } from "../../../../src/lib/server/googleGmail";
import { getUserTenantContext, isTenantAdmin, requireWamaUser } from "../../../../src/lib/server/wamaAdmin";
import { buildWamaInvitationEmail, getOperationsRoleCopy } from "../../../../src/lib/server/wamaInvitationEmail";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] ?? char);
}

export async function GET(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, membership } = await getUserTenantContext(user.id);
    const { data: memberships, error } = await admin.from("wama_tenant_memberships")
      .select("id,role,status,profile_id,joined_at")
      .eq("tenant_id", membership.tenant_id).order("joined_at");
    if (error) throw error;
    const profileIds = (memberships || []).map((item) => item.profile_id);
    const { data: profiles, error: profilesError } = profileIds.length
      ? await admin.from("wama_profiles").select("id,full_name,email,status").in("id", profileIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const { data: invitations, error: invitationsError } = await admin.from("wama_invitations")
      .select("email,status,sent_at,send_attempts,last_error,provider_message_id")
      .eq("tenant_id", membership.tenant_id);
    if (invitationsError) throw invitationsError;
    const invitedMemberships = (memberships || []).filter((item) => item.status === "invited");
    const { data: authUsers } = invitedMemberships.length
      ? await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      : { data: null };
    for (const invitedMembership of invitedMemberships) {
      const invitedProfile = (profiles || []).find((item) => item.id === invitedMembership.profile_id);
      if (!invitedProfile) continue;
      const authUser = authUsers?.users.find((item) => item.email?.toLowerCase() === invitedProfile.email?.toLowerCase());
      if (!authUser?.last_sign_in_at) continue;
      const activatedAt = authUser.last_sign_in_at;
      const { error: membershipActivationError } = await admin.from("wama_tenant_memberships").update({ status: "active" }).eq("id", invitedMembership.id);
      if (membershipActivationError) throw membershipActivationError;
      const { error: profileActivationError } = await admin.from("wama_profiles").update({ status: "active" }).eq("id", invitedProfile.id);
      if (profileActivationError) throw profileActivationError;
      const { error: invitationActivationError } = await admin.from("wama_invitations").update({ status: "accepted", accepted_at: activatedAt }).eq("tenant_id", membership.tenant_id).eq("email", invitedProfile.email.toLowerCase());
      if (invitationActivationError && !invitationActivationError.message.includes("accepted_at")) throw invitationActivationError;
      invitedMembership.status = "active";
      invitedProfile.status = "active";
    }
    const { data: licenses, error: licensesError } = await admin.from("wama_tenant_module_licenses").select("id,included_seats,extra_seat_blocks,extra_block_size,wama_module_catalog(module_key,name),wama_module_user_assignments(profile_id,status,module_role)").eq("tenant_id", membership.tenant_id);
    if (licensesError) throw licensesError;
    const assignmentRows = (licenses || []).flatMap((license) => {
      const moduleKey = (license.wama_module_catalog as unknown as { module_key: string } | null)?.module_key;
      const moduleName = (license.wama_module_catalog as unknown as { name: string } | null)?.name;
      return (license.wama_module_user_assignments || []).filter((item:{status:string})=>item.status==="active").map((item:{profile_id:string;module_role:string})=>({profileId:item.profile_id,moduleKey,moduleName,licenseId:license.id,role:item.module_role}));
    });
    const owner = (memberships || []).find((item) => item.role === "owner" && item.status === "active");
    if (owner) {
      const missing = (licenses || []).filter((license) =>
        !(license.wama_module_user_assignments || []).some((item:{profile_id:string;status:string}) => item.profile_id === owner.profile_id && item.status === "active")
      );
      if (missing.length) {
        const { error: repairError } = await admin.from("wama_module_user_assignments").upsert(
          missing.map((license) => ({ tenant_module_license_id: license.id, profile_id: owner.profile_id, assigned_by: owner.profile_id, status: "active", module_role: "module_admin" })),
          { onConflict: "tenant_module_license_id,profile_id" },
        );
        if (repairError) throw repairError;
        missing.forEach((license) => license.wama_module_user_assignments.push({ profile_id: owner.profile_id, status: "active", module_role: "module_admin" }));
        assignmentRows.push(...missing.map((license) => ({
          profileId: owner.profile_id,
          moduleKey: (license.wama_module_catalog as unknown as { module_key: string } | null)?.module_key,
          moduleName: (license.wama_module_catalog as unknown as { name: string } | null)?.name,
          licenseId: license.id,
          role: "module_admin",
        })));
      }
    }
    const users = (memberships || []).map((item) => ({
      ...item,
      wama_profiles: (profiles || []).find((profile) => profile.id === item.profile_id) || null,
      invitation: (invitations || []).find((invitation) => invitation.email.toLowerCase() === (profiles || []).find((profile) => profile.id === item.profile_id)?.email?.toLowerCase()) || null,
      module_assignments: assignmentRows.filter(a=>a.profileId===item.profile_id).map(a=>({ license_id:a.licenseId, module_key:a.moduleKey, module_name:a.moduleName, role:item.role === "owner" ? "module_admin" : a.role, status:"active" })),
    }));
    return NextResponse.json({ users, licenses: licenses || [], currentRole: membership.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el equipo.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, profile, membership } = await getUserTenantContext(user.id);
    if (!isTenantAdmin(membership.role)) return NextResponse.json({ error: "Solo owner o admin puede invitar usuarios." }, { status: 403 });
    const body = await request.json() as {
      email?: string;
      fullName?: string;
      moduleRoles?: Record<string,string>;
      invitationContext?: {
        moduleName?: string;
        projectName?: string;
        teamNames?: string[];
        roleLabel?: string;
        roleDescription?: string;
      };
    };
    const email = body.email?.trim().toLowerCase(); const fullName = body.fullName?.trim();
    if (!email || !fullName) return NextResponse.json({ error: "Nombre y correo son obligatorios." }, { status: 400 });
    const moduleRoles = body.moduleRoles || {};
    const requestedModules = [...new Set(Object.keys(moduleRoles))];
    if (!requestedModules.length) return NextResponse.json({ error: "Selecciona al menos un módulo." }, { status: 400 });
    const validRoles:Record<string,string[]> = { expense:["expense_submitter","expense_reviewer","expense_approver","expense_treasurer","expense_manager","expense_admin","expense_auditor"], sales:["sales_executive","sales_supervisor","sales_manager","sales_financial_evaluator","sales_admin","sales_auditor"], operations:["operations_admin","operations_coordinator","operations_operator","operations_reporter","operations_observer"] };
    for (const moduleKey of requestedModules) {
      const allowed = validRoles[moduleKey] || ["member","viewer"];
      if (!allowed.includes(moduleRoles[moduleKey])) return NextResponse.json({ error: `El perfil seleccionado para ${moduleKey} no es válido.` }, { status: 400 });
    }
    const { data: licenses } = await admin.from("wama_tenant_module_licenses").select("id,included_seats,extra_seat_blocks,extra_block_size,status,wama_module_catalog!inner(module_key,name)").eq("tenant_id", membership.tenant_id).in("status", ["trial","active","pending"]);
    const selected = (licenses || []).filter((license) => requestedModules.includes((license.wama_module_catalog as unknown as {module_key:string}).module_key));
    if (selected.length !== requestedModules.length) return NextResponse.json({ error: "Uno de los módulos seleccionados no está activo para esta empresa." }, { status: 400 });
    const { data: existingProfile, error: existingProfileError } = await admin
      .from("wama_profiles")
      .select("id,auth_user_id,status")
      .ilike("email", email)
      .maybeSingle();
    if (existingProfileError) throw existingProfileError;

    let targetProfile = existingProfile;
    let authUserId = existingProfile?.auth_user_id || null;
    let reusedExistingUser = Boolean(existingProfile);
    let invitationUrlForNewUser: string | null = null;

    if (!targetProfile) {
      const origin = new URL(request.url).origin;
      // generateLink crea el usuario invitado sin depender del correo SMTP de
      // Supabase. El envío real se realiza y confirma más abajo mediante Resend.
      const { data: invite, error: inviteError } = await admin.auth.admin.generateLink({
        type:"invite",email,options:{redirectTo:`${origin}/invitacion/aceptar`,data:{full_name:fullName}},
      });

      if (inviteError || !invite.user) {
        if (!inviteError?.message.toLowerCase().includes("already been registered")) {
          return NextResponse.json({ error: "No se pudo enviar la invitación. Inténtalo nuevamente." }, { status: 400 });
        }
        const { data: authUsers, error: authUsersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (authUsersError) throw authUsersError;
        const registeredUser = authUsers.users.find((item) => item.email?.trim().toLowerCase() === email);
        if (!registeredUser) return NextResponse.json({ error: "El correo ya está registrado, pero no fue posible vincularlo automáticamente." }, { status: 409 });
        authUserId = registeredUser.id;
        reusedExistingUser = true;
      } else {
        authUserId = invite.user.id;
        invitationUrlForNewUser = invite.properties?.action_link || null;
      }

      const { data: createdProfile, error: profileError } = await admin
        .from("wama_profiles")
        .upsert({ auth_user_id: authUserId, full_name: fullName, email, status: reusedExistingUser ? "active" : "invited" }, { onConflict: "auth_user_id" })
        .select("id,auth_user_id,status")
        .single();
      if (profileError || !createdProfile) throw profileError;
      targetProfile = createdProfile;
    }

    const { data: existingAssignments, error: existingAssignmentsError } = await admin
      .from("wama_module_user_assignments")
      .select("tenant_module_license_id,status")
      .eq("profile_id", targetProfile.id)
      .in("tenant_module_license_id", selected.map((license) => license.id));
    if (existingAssignmentsError) throw existingAssignmentsError;
    const alreadyLicensed = new Set((existingAssignments || []).filter((item) => item.status === "active").map((item) => item.tenant_module_license_id));

    for (const license of selected) {
      if (alreadyLicensed.has(license.id)) continue;
      const { count } = await admin.from("wama_module_user_assignments").select("id", { count: "exact", head: true }).eq("tenant_module_license_id", license.id).eq("status", "active");
      const capacity = license.included_seats + license.extra_seat_blocks * license.extra_block_size;
      if ((count || 0) >= capacity) return NextResponse.json({ error: `No quedan cupos en ${(license.wama_module_catalog as unknown as {name:string}).name}. Capacidad: ${capacity}.` }, { status: 409 });
    }

    const membershipStatus = reusedExistingUser || targetProfile.status === "active" ? "active" : "invited";
    const { error: targetMembershipError } = await admin.from("wama_tenant_memberships").upsert({ tenant_id: membership.tenant_id, profile_id: targetProfile.id, role: "member", status: membershipStatus }, { onConflict: "tenant_id,profile_id" });
    if (targetMembershipError) throw targetMembershipError;
    const assignments = selected.map(license => { const moduleKey=(license.wama_module_catalog as unknown as {module_key:string}).module_key; return { tenant_module_license_id:license.id, profile_id:targetProfile.id, assigned_by:profile.id, status:"active", module_role:moduleRoles[moduleKey] }; });
    const { error: assignmentError } = await admin.from("wama_module_user_assignments").upsert(assignments, { onConflict: "tenant_module_license_id,profile_id" });
    if (assignmentError) throw assignmentError;
    const { error: invitationError } = await admin.from("wama_invitations").upsert({ tenant_id: membership.tenant_id, email, full_name: fullName, role: "member", invited_by: profile.id, auth_user_id: authUserId, status: reusedExistingUser ? "accepted" : "pending", last_error:null }, { onConflict: "tenant_id,email" });
    if (invitationError && !invitationError.message.includes("accepted_at")) throw invitationError;
    let emailStatus:"not_required"|"sent"="not_required";
    if(!reusedExistingUser){
      try{
        const invitationUrl=invitationUrlForNewUser;
        if(!invitationUrl)throw new Error("No se pudo recuperar el enlace de acceso generado para la invitación.");
        const{data:tenant}=await admin.from("wama_tenants").select("name,logo_url").eq("id",membership.tenant_id).maybeSingle();
        const operationsRole =
          requestedModules.includes("operations")
            ? getOperationsRoleCopy(moduleRoles.operations)
            : null;
        const invitationEmail = buildWamaInvitationEmail({
          recipientName: fullName,
          companyName: tenant?.name || "Tu empresa",
          companyLogoUrl: tenant?.logo_url || null,
          invitationUrl,
          moduleName:
            body.invitationContext?.moduleName ||
            (requestedModules.includes("operations") ? "WAMA Operations" : "WAMA"),
          projectName: body.invitationContext?.projectName || null,
          teamNames: body.invitationContext?.teamNames || [],
          roleLabel: body.invitationContext?.roleLabel || operationsRole?.label || null,
          roleDescription:
            body.invitationContext?.roleDescription ||
            operationsRole?.description ||
            null,
        });
        const sent=await sendWamaEmail({
          to:email,
          subject:invitationEmail.subject,
          text:invitationEmail.text,
          html:invitationEmail.html,
        });
        await admin.from("wama_invitations").update({status:"sent",provider_message_id:sent.id,sent_at:new Date().toISOString(),last_error:null,send_attempts:1}).eq("tenant_id",membership.tenant_id).eq("email",email);
        emailStatus="sent";
      }catch(mailError){
        const message=mailError instanceof Error?mailError.message:"El proveedor no confirmó el correo.";
        await admin.from("wama_invitations").update({status:"failed",last_error:message,send_attempts:1}).eq("tenant_id",membership.tenant_id).eq("email",email);
        return NextResponse.json({error:`El usuario y su licencia quedaron creados, pero el correo no fue entregado: ${message}. Puedes reenviarlo desde Usuarios.`,emailStatus:"failed"},{status:502});
      }
    }
    return NextResponse.json({ ok: true, email, modules: requestedModules, reusedExistingUser, emailStatus });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, membership } = await getUserTenantContext(user.id);
    if (!isTenantAdmin(membership.role)) return NextResponse.json({ error:"Solo el propietario o un administrador puede modificar perfiles." },{status:403});
    const body = await request.json() as { profileId?:string; moduleKey?:string; moduleRole?:string };
    if (!body.profileId || !body.moduleKey || !body.moduleRole) return NextResponse.json({error:"Faltan datos para actualizar el perfil."},{status:400});
    const validRoles:Record<string,string[]>={expense:["expense_submitter","expense_reviewer","expense_approver","expense_treasurer","expense_manager","expense_admin","expense_auditor"],sales:["sales_executive","sales_supervisor","sales_manager","sales_financial_evaluator","sales_admin","sales_auditor"],operations:["operations_admin","operations_coordinator","operations_operator","operations_reporter","operations_observer"]};
    const allowed=validRoles[body.moduleKey]||["member","viewer"];
    if(!allowed.includes(body.moduleRole)) return NextResponse.json({error:"El perfil seleccionado no es válido para este módulo."},{status:400});
    const { data:targetMembership,error:membershipError }=await admin.from("wama_tenant_memberships").select("role").eq("tenant_id",membership.tenant_id).eq("profile_id",body.profileId).maybeSingle();
    if(membershipError||!targetMembership) return NextResponse.json({error:"El usuario no pertenece a esta empresa."},{status:404});
    if(targetMembership.role==="owner") return NextResponse.json({error:"El propietario conserva acceso total en todos los módulos."},{status:400});
    const { data:license,error:licenseError }=await admin.from("wama_tenant_module_licenses").select("id,wama_module_catalog!inner(module_key,name)").eq("tenant_id",membership.tenant_id).eq("wama_module_catalog.module_key",body.moduleKey).maybeSingle();
    if(licenseError||!license) return NextResponse.json({error:"El módulo no está contratado por esta empresa."},{status:404});
    const { data:assignment,error:assignmentLookupError }=await admin.from("wama_module_user_assignments").select("id").eq("tenant_module_license_id",license.id).eq("profile_id",body.profileId).eq("status","active").maybeSingle();
    if(assignmentLookupError||!assignment) return NextResponse.json({error:"El usuario no tiene una licencia activa en este módulo."},{status:404});
    const { error:updateError }=await admin.from("wama_module_user_assignments").update({module_role:body.moduleRole}).eq("id",assignment.id);
    if(updateError) throw updateError;
    return NextResponse.json({ok:true,moduleName:(license.wama_module_catalog as unknown as {name:string}).name,moduleRole:body.moduleRole});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Error inesperado."},{status:500});
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, membership } = await getUserTenantContext(user.id);
    if (!isTenantAdmin(membership.role)) return NextResponse.json({ error:"Solo el propietario o un administrador puede reenviar invitaciones." },{status:403});
    const body = await request.json() as { profileId?:string };
    if (!body.profileId) return NextResponse.json({error:"Falta identificar la invitación pendiente."},{status:400});
    const { data:targetMembership,error:membershipError }=await admin.from("wama_tenant_memberships").select("status,wama_profiles!inner(full_name,email)").eq("tenant_id",membership.tenant_id).eq("profile_id",body.profileId).maybeSingle();
    if(membershipError||!targetMembership) return NextResponse.json({error:"El usuario no pertenece a esta empresa."},{status:404});
    if(targetMembership.status!=="invited") return NextResponse.json({error:"La invitación ya fue aceptada y no necesita reenvío."},{status:409});
    const targetProfile=targetMembership.wama_profiles as unknown as {full_name:string;email:string};
    const email=targetProfile.email.trim().toLowerCase();
    const origin=new URL(request.url).origin;
    const redirectTo=`${origin}/invitacion/aceptar`;
    const { data:linkData,error:linkError }=await admin.auth.admin.generateLink({
      type:"invite",
      email,
      options:{redirectTo,data:{full_name:targetProfile.full_name}},
    });
    const invitationUrl=linkData?.properties?.action_link;
    if(linkError||!invitationUrl) return NextResponse.json({error:linkError?.message||"No se pudo generar un nuevo enlace de invitación."},{status:400});

    const { data:tenant }=await admin.from("wama_tenants").select("name,logo_url").eq("id",membership.tenant_id).maybeSingle();

    let operationsRole: ReturnType<typeof getOperationsRoleCopy> = null;
    let projectName: string | null = null;
    let teamNames: string[] = [];

    try {
      const { data:opsLicense }=await admin
        .from("wama_tenant_module_licenses")
        .select("id,wama_module_catalog!inner(module_key)")
        .eq("tenant_id",membership.tenant_id)
        .eq("wama_module_catalog.module_key","operations")
        .maybeSingle();

      if(opsLicense){
        const { data:assignment }=await admin
          .from("wama_module_user_assignments")
          .select("module_role")
          .eq("tenant_module_license_id",opsLicense.id)
          .eq("profile_id",body.profileId)
          .maybeSingle();

        operationsRole=getOperationsRoleCopy(assignment?.module_role||null);

        const { data:teamMemberships }=await admin
          .from("wama_operations_team_members")
          .select("team_id,wama_operations_teams!inner(name)")
          .eq("profile_id",body.profileId);

        teamNames=(teamMemberships||[])
          .map((item)=>
            (item.wama_operations_teams as unknown as {name?:string}|null)?.name||""
          )
          .filter(Boolean);

        const { data:projectMembership }=await admin
          .from("wama_project_members")
          .select("wama_projects!inner(name)")
          .eq("profile_id",body.profileId)
          .limit(1)
          .maybeSingle();

        projectName=
          (projectMembership?.wama_projects as unknown as {name?:string}|null)?.name||
          null;
      }
    }catch{
      // El reenvío sigue funcionando aunque no exista contexto de proyecto/equipo.
    }

    const invitationEmail=buildWamaInvitationEmail({
      recipientName:targetProfile.full_name||"Usuario",
      companyName:tenant?.name||"Tu empresa",
      companyLogoUrl:tenant?.logo_url||null,
      invitationUrl,
      moduleName:"WAMA Operations",
      projectName,
      teamNames,
      roleLabel:operationsRole?.label||null,
      roleDescription:operationsRole?.description||null,
      isResend:true,
    });

    const sent=await sendWamaEmail({
      to:email,
      subject:invitationEmail.subject,
      text:invitationEmail.text,
      html:invitationEmail.html,
    });
    const{data:existingInvite}=await admin.from("wama_invitations").select("send_attempts").eq("tenant_id",membership.tenant_id).eq("email",email).maybeSingle();
    await admin.from("wama_invitations").update({status:"sent",provider_message_id:sent.id,sent_at:new Date().toISOString(),last_error:null,send_attempts:Number(existingInvite?.send_attempts||0)+1}).eq("tenant_id",membership.tenant_id).eq("email",email);
    return NextResponse.json({ok:true,email,emailStatus:"sent"});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Error inesperado."},{status:500});
  }
}
