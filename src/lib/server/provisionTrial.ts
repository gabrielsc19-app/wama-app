import crypto from "node:crypto";
import { Resend } from "resend";
import { getWamaAdmin } from "./wamaAdmin";

export type TrialProvisionInput = {
  companyName: string;
  companyRut?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  origin: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function temporaryPassword() {
  const suffix = crypto.randomBytes(6).toString("base64url");
  return `Wama-${suffix}!9`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] ?? char);
}

export async function provisionExpenseTrial(input: TrialProvisionInput) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    throw new Error("Falta configurar RESEND_API_KEY para enviar el correo de acceso.");
  }

  const admin = getWamaAdmin();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const password = temporaryPassword();
  const trialEnds = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const slug = `${slugify(input.companyName)}-${Date.now().toString().slice(-6)}`;

  const { data: existingUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existingUsers?.users.some((user) => user.email?.toLowerCase() === ownerEmail)) {
    throw new Error("Este correo ya tiene una cuenta WAMA. Ingresa desde Acceso al portal o utiliza otro correo para la prueba.");
  }

  const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: input.ownerName,
      company_name: input.companyName,
      company_rut: input.companyRut || null,
      phone: input.ownerPhone || null,
      wama_pilot: true,
      must_change_password: true,
      active_module: "expense",
    },
  });
  if (authError || !createdAuth.user) {
    throw new Error(authError?.message || "No se pudo crear el acceso del administrador.");
  }

  const authUserId = createdAuth.user.id;
  let tenantId: string | null = null;

  try {
    const { data: tenant, error: tenantError } = await admin
      .from("wama_tenants")
      .insert({
        name: input.companyName,
        slug,
        status: "trial",
        trial_ends_at: trialEnds,
        pilot_name: "Piloto Rendiciones de Gastos 15 días",
        tax_id: input.companyRut || null,
        contact_phone: input.ownerPhone || null,
      })
      .select("id,code,name,trial_ends_at")
      .single();
    if (tenantError || !tenant) throw new Error(tenantError?.message || "No se pudo crear la empresa.");
    tenantId = tenant.id;

    const { data: profile, error: profileError } = await admin
      .from("wama_profiles")
      .insert({
        auth_user_id: authUserId,
        full_name: input.ownerName,
        email: ownerEmail,
        status: "active",
      })
      .select("id")
      .single();
    if (profileError || !profile) throw new Error(profileError?.message || "No se pudo crear el perfil.");

    const { error: membershipError } = await admin.from("wama_tenant_memberships").insert({
      tenant_id: tenant.id,
      profile_id: profile.id,
      role: "owner",
      status: "active",
      joined_at: new Date().toISOString(),
    });
    if (membershipError) throw new Error(membershipError.message);

    const { data: expenseModule, error: moduleError } = await admin
      .from("wama_module_catalog")
      .select("id")
      .eq("module_key", "expense")
      .single();
    if (moduleError || !expenseModule) throw new Error("No existe Rendiciones de Gastos en el catálogo de módulos.");

    const { data: license, error: licenseError } = await admin
      .from("wama_tenant_module_licenses")
      .insert({
        tenant_id: tenant.id,
        module_id: expenseModule.id,
        status: "trial",
        included_seats: 10,
        starts_at: new Date().toISOString(),
        renews_at: trialEnds,
      })
      .select("id")
      .single();
    if (licenseError || !license) throw new Error(licenseError?.message || "No se pudo activar Rendiciones de Gastos.");

    const { error: assignmentError } = await admin.from("wama_module_user_assignments").insert({
      tenant_module_license_id: license.id,
      profile_id: profile.id,
      assigned_by: profile.id,
      status: "active",
    });
    if (assignmentError) throw new Error(assignmentError.message);

    await admin.from("wama_invitations").upsert({
      tenant_id: tenant.id,
      email: ownerEmail,
      full_name: input.ownerName,
      role: "owner",
      auth_user_id: authUserId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    }, { onConflict: "tenant_id,email" });

    await admin.from("wama_audit_logs").insert({
      tenant_id: tenant.id,
      profile_id: profile.id,
      module_key: "expense",
      action: "trial.self_service_activated",
      entity_type: "tenant",
      entity_id: tenant.id,
      metadata: {
        trial_days: 15,
        included_users: 10,
        owner_email: ownerEmail,
        company_rut: input.companyRut || null,
      },
    });

    const loginUrl = `${input.origin}/login`;
    const from = process.env.WAMA_FROM_EMAIL || "WAMA <contacto@wamaapp.com>";
    const resend = new Resend(resendKey);
    const safeName = escapeHtml(input.ownerName);
    const safeCompany = escapeHtml(input.companyName);
    const safeEmail = escapeHtml(ownerEmail);
    const safePassword = escapeHtml(password);

    const { error: emailError } = await resend.emails.send({
      from,
      to: ownerEmail,
      subject: `Tu portal WAMA para ${input.companyName} ya está listo`,
      html: `
        <div style="margin:0;background:#f4f6f7;padding:40px 16px;font-family:Arial,Helvetica,sans-serif;color:#0b0c0e">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dfe3e6">
            <div style="background:#0b0c0e;padding:32px;color:#ffffff">
              <div style="display:inline-block;background:#00e5d6;color:#0b0c0e;font-weight:900;font-size:24px;padding:12px 16px;border-radius:14px">W</div>
              <h1 style="margin:24px 0 8px;font-size:32px;line-height:1.05">Tu portal WAMA está listo.</h1>
              <p style="margin:0;color:#c4c7cc;line-height:1.6">Hola ${safeName}, activamos la prueba de Rendiciones de Gastos para ${safeCompany}.</p>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 20px;line-height:1.7">La prueba incluye 15 días, hasta 10 usuarios en el módulo y acceso como administrador principal.</p>
              <div style="background:#f5f7f8;border-radius:16px;padding:20px;margin:20px 0">
                <p style="margin:0 0 8px;color:#68717d;font-size:13px">Correo de acceso</p>
                <p style="margin:0 0 18px;font-weight:800">${safeEmail}</p>
                <p style="margin:0 0 8px;color:#68717d;font-size:13px">Clave temporal</p>
                <p style="margin:0;font-weight:900;font-size:18px;letter-spacing:.03em">${safePassword}</p>
              </div>
              <a href="${loginUrl}" style="display:block;text-align:center;background:#00e5d6;color:#0b0c0e;text-decoration:none;font-weight:900;padding:16px 24px;border-radius:999px">Ingresar a WAMA</a>
              <p style="margin:20px 0 0;color:#68717d;font-size:13px;line-height:1.6">Al ingresar por primera vez, WAMA te solicitará crear una clave personal. No reenvíes este correo.</p>
            </div>
          </div>
          <p style="text-align:center;color:#7c8490;font-size:12px;margin:18px 0 0">WAMA · Warn and Manage · contacto@wamaapp.com</p>
        </div>`,
    });
    if (emailError) throw new Error(`La empresa fue creada, pero el correo no pudo enviarse: ${emailError.message}`);

    return {
      tenant,
      ownerEmail,
      trialEndsAt: trialEnds,
      includedUsers: 10,
      moduleKey: "expense",
      moduleName: "Rendiciones de Gastos",
    };
  } catch (error) {
    if (tenantId) await admin.from("wama_tenants").delete().eq("id", tenantId);
    await admin.auth.admin.deleteUser(authUserId);
    throw error;
  }
}
