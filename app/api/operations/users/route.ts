import { NextResponse } from "next/server";
import { PATCH as resendEnterpriseInvite, POST as inviteEnterpriseUser, PUT as updateEnterpriseRole } from "../../enterprise/users/route";
import { getOperationsContext, operationsError } from "../../../../src/lib/server/operationsAccess";

const fail = (error: unknown) => {
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
      context.admin.from("wama_operations_teams").select("id,name,members:wama_operations_team_members(profile_id,team_role)").eq("tenant_id", context.tenantId).eq("status", "active").order("name"),
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
        teams: (teams || []).filter((team) => (team.members || []).some((member: { profile_id: string }) => member.profile_id === assignment.profile_id)).map((team) => ({ id: team.id, name: team.name, role: (team.members || []).find((member: { profile_id: string }) => member.profile_id === assignment.profile_id)?.team_role })),
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
    const body = await request.json() as { action?: "resend" | "role"; profileId?: string; moduleRole?: string };
    if (body.action === "resend") return resendEnterpriseInvite(forward(request, "PATCH", { profileId: body.profileId }));
    if (body.action === "role") return updateEnterpriseRole(forward(request, "PUT", { profileId: body.profileId, moduleKey: "operations", moduleRole: body.moduleRole }));
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) { return fail(error); }
}
