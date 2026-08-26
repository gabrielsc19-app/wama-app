import { NextResponse } from "next/server";
import { PATCH as resendEnterpriseInvite, POST as inviteEnterpriseUser, PUT as updateEnterpriseRole } from "../../enterprise/users/route";
import { getOperationsContext, operationsError } from "../../../../src/lib/server/operationsAccess";

const fail = (error: unknown) => {
  console.error("GET/WRITE /api/operations/users failed", error);
  const result = operationsError(error);
  return NextResponse.json({ error: result.message }, { status: result.status });
};

function forward(request: Request, method: string, body: unknown) {
  return new Request(request.url.replace("/api/operations/users", "/api/enterprise/users"), {
    method,
    headers: request.headers,
    body: JSON.stringify(body),
  });
}

export async function GET(request: Request) {
  try {
    const context = await getOperationsContext(request);
    if (!context.canAdmin) return NextResponse.json({ error: "Solo el administrador puede gestionar usuarios." }, { status: 403 });
    const [{ data: assignments, error: assignmentsError }, { data: teams, error: teamsError }, { data: invitations, error: invitationsError }] = await Promise.all([
      context.admin.from("wama_module_user_assignments").select("profile_id,module_role,status,created_at").eq("tenant_module_license_id", context.license.id).in("status", ["active", "invited", "suspended"]),
      context.admin.from("wama_operations_teams").select("id,name").eq("tenant_id", context.tenantId).eq("status", "active").order("name"),
      context.admin.from("wama_invitations").select("email,status,sent_at,send_attempts,last_error,provider_message_id,expires_at").eq("tenant_id", context.tenantId),
    ]);
    if (assignmentsError) throw assignmentsError;
    if (teamsError) throw teamsError;
    if (invitationsError) throw invitationsError;
    const profileIds = [...new Set((assignments || []).map((item) => item.profile_id))];
    const { data: profiles, error: profilesError } = profileIds.length
      ? await context.admin.from("wama_profiles").select("id,full_name,email,status").in("id", profileIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const teamIds = (teams || []).map((team) => team.id);
    const { data: teamMembers, error: teamMembersError } = teamIds.length
      ? await context.admin.from("wama_operations_team_members").select("team_id,profile_id,team_role").in("team_id", teamIds)
      : { data: [], error: null };
    if (teamMembersError) throw teamMembersError;
    const invitesByEmail = new Map((invitations || []).map((item) => [String(item.email).toLowerCase(), item]));
    const users = (assignments || []).map((assignment) => {
      const profile = (profiles || []).find((item) => item.id === assignment.profile_id);
      const invitation = profile ? invitesByEmail.get(String(profile.email).toLowerCase()) || null : null;
      return {
        id: assignment.profile_id,
        full_name: profile?.full_name || "Usuario",
        email: profile?.email || "",
        profile_status: profile?.status || "invited",
        license_status: assignment.status,
        module_role: assignment.module_role,
        invitation,
        teams: (teams || []).filter((team) => (teamMembers || []).some((member) => member.team_id === team.id && member.profile_id === assignment.profile_id)).map((team) => ({ id: team.id, name: team.name, role: (teamMembers || []).find((member) => member.team_id === team.id && member.profile_id === assignment.profile_id)?.team_role })),
      };
    });
    const capacity = context.license.included_seats + context.license.extra_seat_blocks * context.license.extra_block_size;
    return NextResponse.json({ users, teams: teams || [], license: { used: users.filter((item) => item.license_status !== "suspended").length, capacity } });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { fullName?: string; email?: string; moduleRole?: string; teamIds?: string[]; coordinatorTeamIds?: string[] };
    const enterpriseResponse = await inviteEnterpriseUser(forward(request, "POST", { fullName: body.fullName, email: body.email, moduleRoles: { operations: body.moduleRole || "operations_operator" } }));
    const result = await enterpriseResponse.json();
    if (!enterpriseResponse.ok) return NextResponse.json(result, { status: enterpriseResponse.status });
    const context = await getOperationsContext(request);
    const { data: profile } = await context.admin.from("wama_profiles").select("id").ilike("email", String(body.email || "").trim()).maybeSingle();
    if (profile && body.teamIds?.length) {
      const validTeams = await context.admin.from("wama_operations_teams").select("id").eq("tenant_id", context.tenantId).eq("status", "active").in("id", body.teamIds);
      const validIds = new Set((validTeams.data || []).map((team) => team.id));
      const coordinatorIds = new Set(body.coordinatorTeamIds || []);
      const rows = body.teamIds.filter((id) => validIds.has(id)).map((team_id) => ({ team_id, profile_id: profile.id, team_role: coordinatorIds.has(team_id) ? "coordinator" : "operator" }));
      if (rows.length) {
        const { error } = await context.admin.from("wama_operations_team_members").upsert(rows, { onConflict: "team_id,profile_id" });
        if (error) throw error;
      }
    }
    return NextResponse.json(result, { status: enterpriseResponse.status });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { action?: "resend" | "role" | "teams"; profileId?: string; moduleRole?: string; teamIds?: string[]; coordinatorTeamIds?: string[] };
    if (body.action === "resend") return resendEnterpriseInvite(forward(request, "PATCH", { profileId: body.profileId }));
    if (body.action === "role") return updateEnterpriseRole(forward(request, "PUT", { profileId: body.profileId, moduleKey: "operations", moduleRole: body.moduleRole }));
    if (body.action === "teams") {
      const context = await getOperationsContext(request);
      if (!context.canAdmin) return NextResponse.json({ error: "Solo el administrador puede gestionar equipos." }, { status: 403 });
      if (!body.profileId) return NextResponse.json({ error: "Falta identificar al usuario." }, { status: 400 });
      const { data: assignment, error: assignmentError } = await context.admin.from("wama_module_user_assignments").select("profile_id").eq("tenant_module_license_id", context.license.id).eq("profile_id", body.profileId).in("status", ["active", "invited"]).maybeSingle();
      if (assignmentError) throw assignmentError;
      if (!assignment) return NextResponse.json({ error: "El usuario no tiene una licencia activa o invitación pendiente de Operations Hub." }, { status: 409 });
      const requestedIds = [...new Set(body.teamIds || [])];
      const coordinatorIds = new Set((body.coordinatorTeamIds || []).filter((id) => requestedIds.includes(id)));
      let validIds = new Set<string>();
      if (requestedIds.length) {
        const { data: validTeams, error: validTeamsError } = await context.admin.from("wama_operations_teams").select("id").eq("tenant_id", context.tenantId).eq("status", "active").in("id", requestedIds);
        if (validTeamsError) throw validTeamsError;
        validIds = new Set((validTeams || []).map((team) => team.id));
        if (validIds.size !== requestedIds.length) return NextResponse.json({ error: "Uno de los equipos seleccionados no pertenece a tu empresa o está inactivo." }, { status: 400 });
      }
      const { data: tenantTeams, error: tenantTeamsError } = await context.admin.from("wama_operations_teams").select("id").eq("tenant_id", context.tenantId);
      if (tenantTeamsError) throw tenantTeamsError;
      const tenantTeamIds = (tenantTeams || []).map((team) => team.id);
      if (tenantTeamIds.length) {
        const { error: removeError } = await context.admin.from("wama_operations_team_members").delete().eq("profile_id", body.profileId).in("team_id", tenantTeamIds);
        if (removeError) throw removeError;
      }
      if (requestedIds.length) {
        const rows = requestedIds.map((team_id) => ({ team_id, profile_id: body.profileId, team_role: coordinatorIds.has(team_id) ? "coordinator" : "operator" }));
        const { error: insertError } = await context.admin.from("wama_operations_team_members").insert(rows);
        if (insertError) throw insertError;
      }
      await context.admin.from("wama_audit_logs").insert({ tenant_id: context.tenantId, profile_id: context.profile.id, module_key: "operations", action: "operations_user_teams_updated", entity_type: "profile", entity_id: body.profileId, metadata: { team_ids: requestedIds, coordinator_team_ids: [...coordinatorIds] } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) { return fail(error); }
}
