import { NextResponse } from "next/server";
import { getUserTenantContext, isTenantAdmin, requireWamaUser } from "../../../../src/lib/server/wamaAdmin";

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
    const body = await request.json() as { email?: string; fullName?: string; moduleRoles?: Record<string,string> };
    const email = body.email?.trim().toLowerCase(); const fullName = body.fullName?.trim();
    if (!email || !fullName) return NextResponse.json({ error: "Nombre y correo son obligatorios." }, { status: 400 });
    const moduleRoles = body.moduleRoles || {};
    const requestedModules = [...new Set(Object.keys(moduleRoles))];
    if (!requestedModules.length) return NextResponse.json({ error: "Selecciona al menos un módulo." }, { status: 400 });
    const validRoles:Record<string,string[]> = { expense:["member","approver","finance","viewer"], sales:["sales_executive","sales_manager","sales_admin","viewer"] };
    for (const moduleKey of requestedModules) {
      const allowed = validRoles[moduleKey] || ["member","viewer"];
      if (!allowed.includes(moduleRoles[moduleKey])) return NextResponse.json({ error: `El perfil seleccionado para ${moduleKey} no es válido.` }, { status: 400 });
    }
    const { data: licenses } = await admin.from("wama_tenant_module_licenses").select("id,included_seats,extra_seat_blocks,extra_block_size,status,wama_module_catalog!inner(module_key,name)").eq("tenant_id", membership.tenant_id).in("status", ["trial","active","pending"]);
    const selected = (licenses || []).filter((license) => requestedModules.includes((license.wama_module_catalog as unknown as {module_key:string}).module_key));
    if (selected.length !== requestedModules.length) return NextResponse.json({ error: "Uno de los módulos seleccionados no está activo para esta empresa." }, { status: 400 });
    for (const license of selected) { const { count } = await admin.from("wama_module_user_assignments").select("id", { count: "exact", head: true }).eq("tenant_module_license_id", license.id).eq("status", "active"); const capacity = license.included_seats + license.extra_seat_blocks * license.extra_block_size; if ((count || 0) >= capacity) return NextResponse.json({ error: `No quedan cupos en ${(license.wama_module_catalog as unknown as {name:string}).name}. Capacidad: ${capacity}.` }, { status: 409 }); }

    const origin = new URL(request.url).origin;
    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/invitacion/aceptar`, data: { full_name: fullName } });
    if (inviteError || !invite.user) return NextResponse.json({ error: inviteError?.message || "No se pudo enviar la invitación." }, { status: 400 });
    const { data: invitedProfile, error: profileError } = await admin.from("wama_profiles").upsert({ auth_user_id: invite.user.id, full_name: fullName, email, status: "invited" }, { onConflict: "auth_user_id" }).select("id").single();
    if (profileError || !invitedProfile) throw profileError;
    await admin.from("wama_tenant_memberships").upsert({ tenant_id: membership.tenant_id, profile_id: invitedProfile.id, role: "member", status: "invited" }, { onConflict: "tenant_id,profile_id" });
    const assignments = selected.map(license => { const moduleKey=(license.wama_module_catalog as unknown as {module_key:string}).module_key; return { tenant_module_license_id:license.id, profile_id:invitedProfile.id, assigned_by:profile.id, status:"active", module_role:moduleRoles[moduleKey] }; });
    const { error: assignmentError } = await admin.from("wama_module_user_assignments").upsert(assignments, { onConflict: "tenant_module_license_id,profile_id" });
    if (assignmentError) throw assignmentError;
    await admin.from("wama_invitations").upsert({ tenant_id: membership.tenant_id, email, full_name: fullName, role: "member", invited_by: profile.id, auth_user_id: invite.user.id, status: "pending" }, { onConflict: "tenant_id,email" });
    return NextResponse.json({ ok: true, email, modules: requestedModules });
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
    const validRoles:Record<string,string[]>={expense:["member","approver","finance","viewer"],sales:["sales_executive","sales_manager","sales_admin","viewer"]};
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
    const { data:targetMembership,error:membershipError }=await admin.from("wama_tenant_memberships").select("status,wama_profiles!inner(email)").eq("tenant_id",membership.tenant_id).eq("profile_id",body.profileId).maybeSingle();
    if(membershipError||!targetMembership) return NextResponse.json({error:"El usuario no pertenece a esta empresa."},{status:404});
    if(targetMembership.status!=="invited") return NextResponse.json({error:"La invitación ya fue aceptada y no necesita reenvío."},{status:409});
    const email=(targetMembership.wama_profiles as unknown as {email:string}).email;
    const origin=new URL(request.url).origin;
    const { error:resendError }=await admin.auth.resend({type:"signup",email,options:{emailRedirectTo:`${origin}/invitacion/aceptar`}});
    if(resendError) return NextResponse.json({error:resendError.message||"No se pudo reenviar la invitación."},{status:400});
    await admin.from("wama_invitations").update({status:"pending"}).eq("tenant_id",membership.tenant_id).eq("email",email);
    return NextResponse.json({ok:true,email});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Error inesperado."},{status:500});
  }
}
