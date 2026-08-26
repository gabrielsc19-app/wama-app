import { NextResponse } from "next/server";
import {
  PATCH as resendEnterpriseInvite,
  POST as inviteEnterpriseUser,
  PUT as updateEnterpriseRole,
} from "../../enterprise/users/route";
import {
  getOperationsContext,
  operationsError,
} from "../../../../src/lib/server/operationsAccess";

const fail = (error: unknown) => {
  const result = operationsError(error);
  const supabaseMessage =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message || "")
      : "";

  return NextResponse.json(
    { error: supabaseMessage || result.message },
    { status: result.status },
  );
};

function forward(request: Request, method: string, body: unknown) {
  return new Request(
    request.url.replace("/api/operations/users", "/api/enterprise/users"),
    {
      method,
      headers: request.headers,
      body: JSON.stringify(body),
    },
  );
}

type TeamRow = { id: string; name: string };
type ProjectRow = { id: string; name: string };
type TeamMemberRow = {
  team_id: string;
  profile_id: string;
  team_role: string;
};

export async function GET(request: Request) {
  try {
    const context = await getOperationsContext(request);

    if (!context.canAdmin) {
      return NextResponse.json(
        { error: "Solo el administrador puede gestionar usuarios." },
        { status: 403 },
      );
    }

    const { data: assignments, error: assignmentsError } = await context.admin
      .from("wama_module_user_assignments")
      .select("profile_id,module_role,status")
      .eq("tenant_module_license_id", context.license.id)
      .in("status", ["active", "invited", "suspended"]);

    if (assignmentsError) throw assignmentsError;

    const profileIds = [
      ...new Set((assignments || []).map((item) => item.profile_id)),
    ];

    const { data: profiles, error: profilesError } = profileIds.length
      ? await context.admin
          .from("wama_profiles")
          .select("id,full_name,email,status")
          .in("id", profileIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    const { data: memberships, error: membershipsError } = profileIds.length
      ? await context.admin
          .from("wama_tenant_memberships")
          .select("profile_id,role,status")
          .eq("tenant_id", context.tenantId)
          .in("profile_id", profileIds)
      : { data: [], error: null };

    if (membershipsError) throw membershipsError;

    const { data: invitations, error: invitationsError } = await context.admin
      .from("wama_invitations")
      .select(
        "email,status,sent_at,send_attempts,last_error,provider_message_id,expires_at",
      )
      .eq("tenant_id", context.tenantId);

    if (invitationsError) throw invitationsError;

    const { data: teamsData, error: teamsError } = await context.admin
      .from("wama_operations_teams")
      .select("id,name")
      .eq("tenant_id", context.tenantId)
      .eq("status", "active")
      .order("name");

    if (teamsError) throw teamsError;

    const teams = (teamsData || []) as TeamRow[];

    const { data: projectsData, error: projectsError } = await context.admin
      .from("wama_projects")
      .select("id,name")
      .eq("tenant_id", context.tenantId)
      .eq("status", "active")
      .order("name");

    if (projectsError) throw projectsError;
    const projects = (projectsData || []) as ProjectRow[];

    const teamIds = teams.map((team) => team.id);

    let teamMembers: TeamMemberRow[] = [];

    if (teamIds.length) {
      const { data: membersData, error: membersError } = await context.admin
        .from("wama_operations_team_members")
        .select("team_id,profile_id,team_role")
        .in("team_id", teamIds);

      if (membersError) throw membersError;
      teamMembers = (membersData || []) as TeamMemberRow[];
    }

    const invitesByEmail = new Map(
      (invitations || []).map((item) => [
        String(item.email || "").toLowerCase(),
        item,
      ]),
    );

    const membershipByProfile = new Map(
      (memberships || []).map((item) => [item.profile_id, item]),
    );

    const users = (assignments || []).map((assignment) => {
      const profile = (profiles || []).find(
        (item) => item.id === assignment.profile_id,
      );
      const membership = membershipByProfile.get(assignment.profile_id);

      const invitation = profile
        ? invitesByEmail.get(String(profile.email || "").toLowerCase()) || null
        : null;

      const userTeams = teams
        .map((team) => {
          const teamMembership = teamMembers.find(
            (member) =>
              member.team_id === team.id &&
              member.profile_id === assignment.profile_id,
          );

          if (!teamMembership) return null;

          return {
            id: team.id,
            name: team.name,
            role: teamMembership.team_role,
          };
        })
        .filter(Boolean);

      return {
        id: assignment.profile_id,
        full_name: profile?.full_name || "Usuario",
        email: profile?.email || "",
        profile_status: profile?.status || "invited",
        license_status: assignment.status,
        enterprise_role: membership?.role || "member",
        module_role:
          membership?.role === "owner"
            ? "module_admin"
            : assignment.module_role,
        invitation,
        teams: userTeams,
      };
    });

    const capacity =
      Number(context.license.included_seats || 0) +
      Number(context.license.extra_seat_blocks || 0) *
        Number(context.license.extra_block_size || 0);

    const used = users.filter(
      (item) => item.license_status !== "suspended",
    ).length;

    return NextResponse.json({
      users,
      teams,
      projects,
      license: {
        id: context.license.id,
        used,
        capacity,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      moduleRole?: string;
      teamIds?: string[];
      coordinatorTeamIds?: string[];
      projectId?: string;
    };

    const inviteContext = await getOperationsContext(request);

    let projectName: string | null = null;
    if (body.projectId) {
      const { data:project }=await inviteContext.admin
        .from("wama_projects")
        .select("id,name")
        .eq("tenant_id",inviteContext.tenantId)
        .eq("id",body.projectId)
        .maybeSingle();

      if(!project){
        return NextResponse.json(
          {error:"El proyecto seleccionado no pertenece a tu empresa."},
          {status:400},
        );
      }
      projectName=project.name;
    }

    let teamNames:string[]=[];
    if(body.teamIds?.length){
      const {data:teamRows,error:teamRowsError}=await inviteContext.admin
        .from("wama_operations_teams")
        .select("id,name")
        .eq("tenant_id",inviteContext.tenantId)
        .eq("status","active")
        .in("id",body.teamIds);

      if(teamRowsError)throw teamRowsError;
      teamNames=(teamRows||[]).map((team)=>team.name);
    }

    const roleCopy:Record<string,{label:string;description:string}>={
      operations_admin:{
        label:"Administrador de Operations",
        description:"Administra proyectos, equipos, usuarios y puede gestionar todos los casos del módulo.",
      },
      operations_coordinator:{
        label:"Coordinador",
        description:"Supervisa los casos de sus equipos, asigna responsables, controla avances y puede cerrar trabajos.",
      },
      operations_operator:{
        label:"Operativo",
        description:"Ejecuta los trabajos asignados, registra avances, actualiza estados y adjunta fotografías o evidencias.",
      },
      operations_reporter:{
        label:"Reportante",
        description:"Puede crear casos, adjuntar evidencias y seguir el avance de los casos que reportó.",
      },
      operations_observer:{
        label:"Observador",
        description:"Puede consultar la información autorizada, sin modificar casos ni configuraciones.",
      },
    };

    const selectedRole=roleCopy[body.moduleRole||"operations_operator"]||roleCopy.operations_operator;

    const enterpriseResponse = await inviteEnterpriseUser(
      forward(request, "POST", {
        fullName: body.fullName,
        email: body.email,
        moduleRoles: {
          operations: body.moduleRole || "operations_operator",
        },
        invitationContext:{
          moduleName:"WAMA Operations",
          projectName,
          teamNames,
          roleLabel:selectedRole.label,
          roleDescription:selectedRole.description,
        },
      }),
    );

    const result = await enterpriseResponse.json();

    if (!enterpriseResponse.ok) {
      return NextResponse.json(result, {
        status: enterpriseResponse.status,
      });
    }

    const context = await getOperationsContext(request);

    const { data: profile, error: profileError } = await context.admin
      .from("wama_profiles")
      .select("id")
      .ilike("email", String(body.email || "").trim())
      .maybeSingle();

    if (profileError) throw profileError;

    if(profile&&body.projectId){
      const {error:projectMemberError}=await context.admin
        .from("wama_project_members")
        .upsert(
          {
            project_id:body.projectId,
            profile_id:profile.id,
            role:"member",
          },
          {onConflict:"project_id,profile_id"},
        );
      if(projectMemberError)throw projectMemberError;
    }

    if (profile && body.teamIds?.length) {
      const { data: validTeams, error: validTeamsError } = await context.admin
        .from("wama_operations_teams")
        .select("id")
        .eq("tenant_id", context.tenantId)
        .eq("status", "active")
        .in("id", body.teamIds);

      if (validTeamsError) throw validTeamsError;

      const validIds = new Set((validTeams || []).map((team) => team.id));
      const coordinatorIds = new Set(body.coordinatorTeamIds || []);

      const rows = body.teamIds
        .filter((id) => validIds.has(id))
        .map((team_id) => ({
          team_id,
          profile_id: profile.id,
          team_role: coordinatorIds.has(team_id)
            ? "coordinator"
            : "operator",
        }));

      if (rows.length) {
        const { error } = await context.admin
          .from("wama_operations_team_members")
          .upsert(rows, { onConflict: "team_id,profile_id" });

        if (error) throw error;
      }
    }

    return NextResponse.json(result, {
      status: enterpriseResponse.status,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "resend" | "role" | "enterpriseRole" | "teams";
      profileId?: string;
      moduleRole?: string;
      enterpriseRole?: "admin" | "member";
      teamIds?: string[];
      coordinatorTeamIds?: string[];
    };

    if (body.action === "resend") {
      return resendEnterpriseInvite(
        forward(request, "PATCH", { profileId: body.profileId }),
      );
    }

    if (body.action === "enterpriseRole") {
      const context = await getOperationsContext(request);

      if (context.membership.role !== "owner") {
        return NextResponse.json(
          { error: "Solo el propietario puede cambiar administradores empresariales." },
          { status: 403 },
        );
      }

      if (!body.profileId || !body.enterpriseRole) {
        return NextResponse.json(
          { error: "Faltan datos para actualizar el nivel empresarial." },
          { status: 400 },
        );
      }

      const { data: targetMembership, error: targetMembershipError } =
        await context.admin
          .from("wama_tenant_memberships")
          .select("id,role,status")
          .eq("tenant_id", context.tenantId)
          .eq("profile_id", body.profileId)
          .maybeSingle();

      if (targetMembershipError) throw targetMembershipError;
      if (!targetMembership) {
        return NextResponse.json(
          { error: "El usuario no pertenece a esta empresa." },
          { status: 404 },
        );
      }

      if (targetMembership.role === "owner") {
        return NextResponse.json(
          { error: "El propietario principal no puede ser modificado desde aquí." },
          { status: 400 },
        );
      }

      const newEnterpriseRole =
        body.enterpriseRole === "admin" ? "admin" : "member";

      const { error: membershipUpdateError } = await context.admin
        .from("wama_tenant_memberships")
        .update({ role: newEnterpriseRole })
        .eq("id", targetMembership.id);

      if (membershipUpdateError) throw membershipUpdateError;

      // Mantener coherencia del rol de Operations.
      const desiredModuleRole =
        newEnterpriseRole === "admin"
          ? "operations_admin"
          : "operations_operator";

      const { error: assignmentUpdateError } = await context.admin
        .from("wama_module_user_assignments")
        .update({ module_role: desiredModuleRole })
        .eq("tenant_module_license_id", context.license.id)
        .eq("profile_id", body.profileId);

      if (assignmentUpdateError) throw assignmentUpdateError;

      return NextResponse.json({
        ok: true,
        enterpriseRole: newEnterpriseRole,
        moduleRole: desiredModuleRole,
      });
    }

    if (body.action === "role") {
      const context = await getOperationsContext(request);

      if (!body.profileId || !body.moduleRole) {
        return NextResponse.json(
          { error: "Faltan datos para actualizar el perfil." },
          { status: 400 },
        );
      }

      const { data: targetMembership, error: targetMembershipError } =
        await context.admin
          .from("wama_tenant_memberships")
          .select("id,role")
          .eq("tenant_id", context.tenantId)
          .eq("profile_id", body.profileId)
          .maybeSingle();

      if (targetMembershipError) throw targetMembershipError;
      if (!targetMembership) {
        return NextResponse.json(
          { error: "El usuario no pertenece a esta empresa." },
          { status: 404 },
        );
      }

      if (targetMembership.role === "owner") {
        return NextResponse.json(
          { error: "El propietario conserva acceso total." },
          { status: 400 },
        );
      }

      // Si era administrador empresarial y se elige un perfil operacional,
      // se baja a member para que el selector represente el nivel real.
      if (targetMembership.role === "admin") {
        const { error: membershipUpdateError } = await context.admin
          .from("wama_tenant_memberships")
          .update({ role: "member" })
          .eq("id", targetMembership.id);

        if (membershipUpdateError) throw membershipUpdateError;
      }

      return updateEnterpriseRole(
        forward(request, "PUT", {
          profileId: body.profileId,
          moduleKey: "operations",
          moduleRole: body.moduleRole,
        }),
      );
    }

    if (body.action === "teams") {
      const context = await getOperationsContext(request);

      if (!context.canAdmin) {
        return NextResponse.json(
          { error: "Solo el administrador puede gestionar equipos." },
          { status: 403 },
        );
      }

      if (!body.profileId) {
        return NextResponse.json(
          { error: "Falta identificar al usuario." },
          { status: 400 },
        );
      }

      const { data: assignment, error: assignmentError } =
        await context.admin
          .from("wama_module_user_assignments")
          .select("profile_id")
          .eq("tenant_module_license_id", context.license.id)
          .eq("profile_id", body.profileId)
          .in("status", ["active", "invited"])
          .maybeSingle();

      if (assignmentError) throw assignmentError;

      if (!assignment) {
        return NextResponse.json(
          {
            error:
              "El usuario no tiene una licencia activa o invitación pendiente de Operations Hub.",
          },
          { status: 409 },
        );
      }

      const requestedIds = [...new Set(body.teamIds || [])];
      const coordinatorIds = new Set(
        (body.coordinatorTeamIds || []).filter((id) =>
          requestedIds.includes(id),
        ),
      );

      if (requestedIds.length) {
        const { data: validTeams, error: validTeamsError } =
          await context.admin
            .from("wama_operations_teams")
            .select("id")
            .eq("tenant_id", context.tenantId)
            .eq("status", "active")
            .in("id", requestedIds);

        if (validTeamsError) throw validTeamsError;

        if ((validTeams || []).length !== requestedIds.length) {
          return NextResponse.json(
            {
              error:
                "Uno de los equipos seleccionados no pertenece a tu empresa o está inactivo.",
            },
            { status: 400 },
          );
        }
      }

      const { data: tenantTeams, error: tenantTeamsError } =
        await context.admin
          .from("wama_operations_teams")
          .select("id")
          .eq("tenant_id", context.tenantId);

      if (tenantTeamsError) throw tenantTeamsError;

      const tenantTeamIds = (tenantTeams || []).map((team) => team.id);

      if (tenantTeamIds.length) {
        const { error: removeError } = await context.admin
          .from("wama_operations_team_members")
          .delete()
          .eq("profile_id", body.profileId)
          .in("team_id", tenantTeamIds);

        if (removeError) throw removeError;
      }

      if (requestedIds.length) {
        const rows = requestedIds.map((team_id) => ({
          team_id,
          profile_id: body.profileId,
          team_role: coordinatorIds.has(team_id)
            ? "coordinator"
            : "operator",
        }));

        const { error: insertError } = await context.admin
          .from("wama_operations_team_members")
          .insert(rows);

        if (insertError) throw insertError;
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Acción no válida." },
      { status: 400 },
    );
  } catch (error) {
    return fail(error);
  }
}
