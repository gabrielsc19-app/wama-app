import { NextResponse } from "next/server";
import { getWamaAdmin, requireWamaUser } from "../../../../src/lib/server/wamaAdmin";

export async function POST(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const admin = getWamaAdmin();

    const { data: profile, error: profileError } = await admin
      .from("wama_profiles")
      .select("id,email,status")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ error: "No encontramos tu perfil WAMA." }, { status: 404 });
    }

    const now = new Date().toISOString();

    const { error: profileUpdateError } = await admin
      .from("wama_profiles")
      .update({ status: "active", updated_at: now })
      .eq("id", profile.id);
    if (profileUpdateError) throw profileUpdateError;

    const { data: memberships, error: membershipsError } = await admin
      .from("wama_tenant_memberships")
      .select("id,tenant_id,status")
      .eq("profile_id", profile.id)
      .in("status", ["invited", "active"]);
    if (membershipsError) throw membershipsError;

    const invitedMemberships = (memberships || []).filter((item) => item.status === "invited");
    if (invitedMemberships.length) {
      const { error: membershipUpdateError } = await admin
        .from("wama_tenant_memberships")
        .update({ status: "active", joined_at: now })
        .eq("profile_id", profile.id)
        .eq("status", "invited");
      if (membershipUpdateError) throw membershipUpdateError;
    }

    const tenantIds = [...new Set((memberships || []).map((item) => item.tenant_id))];
    if (tenantIds.length && profile.email) {
      const { error: invitationUpdateError } = await admin
        .from("wama_invitations")
        .update({ status: "accepted", accepted_at: now, last_error: null })
        .in("tenant_id", tenantIds)
        .ilike("email", profile.email.trim().toLowerCase())
        .in("status", ["pending", "sent", "failed"]);

      // accepted_at may not exist in an older database migration. In that case,
      // keep the account usable and let the enterprise users endpoint reconcile it.
      if (invitationUpdateError && !invitationUpdateError.message.includes("accepted_at")) {
        throw invitationUpdateError;
      }
    }

    return NextResponse.json({
      ok: true,
      activatedMemberships: invitedMemberships.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo activar la invitación.";
    return NextResponse.json(
      { error: message === "UNAUTHORIZED" ? "La sesión de invitación no es válida o expiró." : message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
