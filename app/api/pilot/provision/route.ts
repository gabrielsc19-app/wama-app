import { NextResponse } from "next/server";
import { getWamaAdmin } from "../../../../src/lib/server/wamaAdmin";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { secret?: string; companyName?: string; ownerName?: string; ownerEmail?: string };
    if (!process.env.WAMA_PILOT_SETUP_SECRET || body.secret !== process.env.WAMA_PILOT_SETUP_SECRET) {
      return NextResponse.json({ error: "Clave de habilitación incorrecta." }, { status: 403 });
    }
    const companyName = body.companyName?.trim();
    const ownerName = body.ownerName?.trim();
    const ownerEmail = body.ownerEmail?.trim().toLowerCase();
    if (!companyName || !ownerName || !ownerEmail) return NextResponse.json({ error: "Completa empresa, responsable y correo." }, { status: 400 });

    const admin = getWamaAdmin();
    const origin = new URL(request.url).origin;
    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(ownerEmail, {
      redirectTo: `${origin}/invitacion/aceptar`,
      data: { full_name: ownerName, company_name: companyName, wama_pilot: true },
    });
    if (inviteError || !invite.user) return NextResponse.json({ error: inviteError?.message || "No se pudo invitar al responsable." }, { status: 400 });

    const slug = `${slugify(companyName)}-${Date.now().toString().slice(-5)}`;
    const trialEnds = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tenant, error: tenantError } = await admin.from("wama_tenants").insert({
      name: companyName, slug, status: "trial", trial_ends_at: trialEnds, pilot_name: "Piloto Rendiciones de Gastos 15 días",
    }).select("id,code,name,trial_ends_at").single();
    if (tenantError || !tenant) return NextResponse.json({ error: tenantError?.message || "No se pudo crear la empresa." }, { status: 400 });

    const { data: profile, error: profileError } = await admin.from("wama_profiles").upsert({
      auth_user_id: invite.user.id, full_name: ownerName, email: ownerEmail, status: "invited",
    }, { onConflict: "auth_user_id" }).select("id").single();
    if (profileError || !profile) return NextResponse.json({ error: profileError?.message || "No se pudo crear el perfil." }, { status: 400 });

    await admin.from("wama_tenant_memberships").insert({ tenant_id: tenant.id, profile_id: profile.id, role: "owner", status: "invited" });
    const { data: expenseModule } = await admin.from("wama_module_catalog").select("id").eq("module_key", "expense").single();
    if (!expenseModule) return NextResponse.json({ error: "No existe el módulo Rendiciones de Gastos en el catálogo." }, { status: 500 });
    const { data: license, error: licenseError } = await admin.from("wama_tenant_module_licenses").insert({
      tenant_id: tenant.id, module_id: expenseModule.id, status: "trial", included_seats: 10,
      starts_at: new Date().toISOString(), renews_at: trialEnds,
    }).select("id").single();
    if (licenseError || !license) return NextResponse.json({ error: licenseError?.message || "No se pudo activar Rendiciones de Gastos." }, { status: 400 });
    await admin.from("wama_module_user_assignments").insert({ tenant_module_license_id: license.id, profile_id: profile.id, assigned_by: profile.id, status: "active" });
    await admin.from("wama_invitations").upsert({ tenant_id: tenant.id, email: ownerEmail, full_name: ownerName, role: "owner", auth_user_id: invite.user.id, status: "pending" }, { onConflict: "tenant_id,email" });
    await admin.from("wama_audit_logs").insert({ tenant_id: tenant.id, profile_id: profile.id, module_key: "expense", action: "pilot.provisioned", entity_type: "tenant", entity_id: tenant.id, metadata: { trial_days: 15, seats: 10, owner_email: ownerEmail } });

    return NextResponse.json({ ok: true, tenant, ownerEmail, seats: 10, module: "expense", moduleLabel: "Rendiciones de Gastos" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado." }, { status: 500 });
  }
}
