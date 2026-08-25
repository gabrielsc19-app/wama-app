import crypto from "node:crypto";
import { sendWamaEmail } from "./googleGmail";
import { getWamaAdmin } from "./wamaAdmin";

export type TrialModuleKey = "expense" | "sales" | "operations";

export type TrialProvisionInput = {
  companyName: string;
  companyRut?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  origin: string;
  moduleKey: TrialModuleKey;
};

const MODULES = {
  expense: { name: "Expense Hub", description: "Rendiciones de Gastos", href: "/expense-hub" },
  sales: { name: "Sales Hub", description: "CRM y gestión comercial", href: "/sales-hub" },
  operations: { name: "Operations Hub", description: "Incidentes, alertas y gestión operacional", href: "/operations-hub" },
} as const;

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

function temporaryPassword() {
  return `Wama-${crypto.randomBytes(6).toString("base64url")}!9`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
}

export async function provisionTrial(input: TrialProvisionInput) {
  const admin = getWamaAdmin();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const moduleInfo = MODULES[input.moduleKey];
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error("No se pudo verificar el correo administrador.");
  let authUser = usersPage.users.find((user) => user.email?.toLowerCase() === ownerEmail) ?? null;
  let password: string | null = null;
  let createdNewUser = false;

  if (!authUser) {
    password = temporaryPassword();
    const { data, error } = await admin.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: input.ownerName,
        company_name: input.companyName,
        company_rut: input.companyRut || null,
        phone: input.ownerPhone || null,
        must_change_password: true,
      },
    });
    if (error || !data.user) throw new Error(error?.message || "No se pudo crear el acceso del administrador.");
    authUser = data.user;
    createdNewUser = true;
  }

  const { data: existingProfile, error: profileLookupError } = await admin
    .from("wama_profiles").select("id,full_name").eq("auth_user_id", authUser.id).maybeSingle();
  if (profileLookupError) throw new Error(profileLookupError.message);

  let profileId = existingProfile?.id as string | undefined;
  if (!profileId) {
    const { data: profile, error } = await admin.from("wama_profiles").insert({
      auth_user_id: authUser.id, full_name: input.ownerName, email: ownerEmail, status: "active",
    }).select("id").single();
    if (error || !profile) throw new Error(error?.message || "No se pudo crear el perfil administrador.");
    profileId = profile.id;
  }

  const { data: memberships, error: membershipLookupError } = await admin
    .from("wama_tenant_memberships").select("tenant_id,role,status").eq("profile_id", profileId).eq("status", "active");
  if (membershipLookupError) throw new Error(membershipLookupError.message);

  let tenantId = memberships?.find((membership) => membership.role === "owner")?.tenant_id as string | undefined;
  let createdTenant = false;

  try {
    if (!tenantId) {
      const slug = `${slugify(input.companyName)}-${Date.now().toString().slice(-6)}`;
      const { data: tenant, error } = await admin.from("wama_tenants").insert({
        name: input.companyName,
        slug,
        status: "trial",
        trial_ends_at: trialEnds,
        pilot_name: "Portal modular WAMA",
        tax_id: input.companyRut || null,
        contact_phone: input.ownerPhone || null,
      }).select("id").single();
      if (error || !tenant) throw new Error(error?.message || "No se pudo crear la empresa.");
      tenantId = tenant.id;
      createdTenant = true;

      const { error: membershipError } = await admin.from("wama_tenant_memberships").insert({
        tenant_id: tenantId, profile_id: profileId, role: "owner", status: "active", joined_at: now.toISOString(),
      });
      if (membershipError) throw new Error(membershipError.message);
    }

    const { data: catalogModule, error: moduleError } = await admin
      .from("wama_module_catalog").select("id").eq("module_key", input.moduleKey).single();
    if (moduleError || !catalogModule) throw new Error(`El módulo ${moduleInfo.name} no existe en el catálogo.`);

    const { data: existingLicense, error: existingLicenseError } = await admin
      .from("wama_tenant_module_licenses").select("id,status,renews_at").eq("tenant_id", tenantId).eq("module_id", catalogModule.id).maybeSingle();
    if (existingLicenseError) throw new Error(existingLicenseError.message);
    if (existingLicense) throw new Error(`${moduleInfo.name} ya está activado para esta empresa. Ingresa a tu Portal WAMA.`);

    const { data: license, error: licenseError } = await admin.from("wama_tenant_module_licenses").insert({
      tenant_id: tenantId,
      module_id: catalogModule.id,
      status: "trial",
      included_seats: 10,
      extra_block_size: 10,
      unit_price_usd: 10,
      extra_block_price_usd: 10,
      starts_at: now.toISOString(),
      renews_at: trialEnds,
    }).select("id").single();
    if (licenseError || !license) throw new Error(licenseError?.message || `No se pudo activar ${moduleInfo.name}.`);

    const { error: assignmentError } = await admin.from("wama_module_user_assignments").insert({
      tenant_module_license_id: license.id, profile_id: profileId, assigned_by: profileId, status: "active",
    });
    if (assignmentError) throw new Error(assignmentError.message);

    if (input.moduleKey === "operations") {
      const { error: seedError } = await admin.rpc("wama_seed_operations", { target_tenant_id: tenantId, creator_profile_id: profileId });
      if (seedError) throw new Error(seedError.message);
    }

    await admin.from("wama_invitations").upsert({
      tenant_id: tenantId, email: ownerEmail, full_name: input.ownerName, role: "owner", auth_user_id: authUser.id,
      status: "accepted", accepted_at: now.toISOString(),
    }, { onConflict: "tenant_id,email" });

    await admin.from("wama_audit_logs").insert({
      tenant_id: tenantId, profile_id: profileId, module_key: input.moduleKey,
      action: "trial.module_activated", entity_type: "tenant_module_license", entity_id: license.id,
      metadata: { trial_days: 15, included_users: 10, owner_email: ownerEmail },
    });

    const loginUrl = `${input.origin}/login`;
    const portalUrl = `${input.origin}/empresa`;
    const safeName = escapeHtml(input.ownerName);
    const safeCompany = escapeHtml(input.companyName);
    const credentialText = password ? `\nCorreo: ${ownerEmail}\nClave temporal: ${password}\n` : "\nUsa tu cuenta WAMA actual.\n";

    await sendWamaEmail({
      to: ownerEmail,
      subject: `${moduleInfo.name} ya está activo en WAMA`,
      text: `Hola ${input.ownerName},\n\nActivamos ${moduleInfo.name} para ${input.companyName}. Tienes 15 días de prueba y 10 licencias independientes para este módulo.${credentialText}\nPortal: ${password ? loginUrl : portalUrl}`,
      html: `<div style="background:#f4f6f7;padding:32px;font-family:Arial;color:#0b0c0e"><div style="max-width:620px;margin:auto;background:white;border-radius:24px;overflow:hidden"><div style="background:#0b0c0e;color:white;padding:30px"><strong style="color:#00e5d6">WAMA</strong><h1>${moduleInfo.name} está activo.</h1><p>Hola ${safeName}, activamos ${moduleInfo.description} para ${safeCompany}.</p></div><div style="padding:30px"><p>Prueba de 15 días · 10 licencias independientes.</p>${password ? `<p><b>Correo:</b> ${escapeHtml(ownerEmail)}<br><b>Clave temporal:</b> ${escapeHtml(password)}</p>` : "<p>Ingresa con tu cuenta WAMA actual.</p>"}<a href="${password ? loginUrl : portalUrl}" style="display:block;text-align:center;background:#00e5d6;color:#0b0c0e;text-decoration:none;font-weight:900;padding:15px;border-radius:999px">Ir al Portal WAMA</a></div></div></div>`,
    });

    return { ownerEmail, trialEndsAt: trialEnds, includedUsers: 10, moduleKey: input.moduleKey, moduleName: moduleInfo.name, createdNewUser };
  } catch (error) {
    if (createdTenant && tenantId) await admin.from("wama_tenants").delete().eq("id", tenantId);
    if (createdNewUser) await admin.auth.admin.deleteUser(authUser.id);
    throw error;
  }
}

export const provisionExpenseTrial = (input: Omit<TrialProvisionInput, "moduleKey">) => provisionTrial({ ...input, moduleKey: "expense" });
