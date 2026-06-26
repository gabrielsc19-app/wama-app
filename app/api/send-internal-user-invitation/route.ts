import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type AnySupabaseClient = any;

type InternalInvitationPayload = {
  organizationId?: number;
  requesterEmail?: string;
  recipientName?: string;
  recipientEmail: string;
  role?: string;
  password?: string;
  appUrl?: string;
};

const DEFAULT_TEMPORARY_PASSWORD = "FixLoop2026!";
const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fixloop-pumay.vercel.app";

function getAdminClient(): AnySupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as AnySupabaseClient;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY en las variables de entorno.");
  }

  return new Resend(apiKey);
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function apiErrorMessage(value: unknown, fallback = "Error desconocido.") {
  if (!value) return fallback;
  if (value instanceof Error) return value.message || fallback;
  if (typeof value === "string") return value;

  const maybe = value as { message?: unknown; error?: unknown; name?: unknown };
  if (typeof maybe.message === "string") return maybe.message;
  if (typeof maybe.error === "string") return maybe.error;

  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function getResendFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "FixLoop | Pumay <onboarding@resend.dev>";
}

function roleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    owner: "Owner",
    super_admin: "Super administrador",
    comercial: "Comercial",
    aseo: "Aseo",
    seguridad: "Seguridad",
    mantencion: "Mantención",
    "mantención": "Mantención",
    operaciones: "Operaciones",
    admin: "Admin",
  };

  return labels[cleanText(role)] || cleanText(role, "Usuario interno");
}

async function assertOwner(
  supabaseAdmin: AnySupabaseClient,
  requesterEmail: string,
  organizationId: number
) {
  const email = normalizeEmail(requesterEmail);

  if (!email) {
    throw new Error("No se recibió correo del usuario solicitante.");
  }

  const { data, error } = await supabaseAdmin
    .from("users_pumay")
    .select("id,name,email,role,active,organization_id")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data || data.role !== "owner") {
    throw new Error("Solo usuarios owner pueden enviar accesos internos.");
  }

  return data;
}

async function upsertAuthPassword({
  supabaseAdmin,
  email,
  name,
  role,
  temporaryPassword,
}: {
  supabaseAdmin: AnySupabaseClient;
  email: string;
  name: string;
  role: string;
  temporaryPassword: string;
}) {
  const { data: listedUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw new Error(listError.message || "No se pudo revisar usuarios Auth.");
  }

  const existingAuthUser = (listedUsers?.users || []).find(
    (user: { id: string; email?: string | null }) => normalizeEmail(user.email) === email
  );

  if (existingAuthUser?.id) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (error) {
      throw new Error(error.message || "No se pudo actualizar el usuario en Auth.");
    }

    return "updated";
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (error) {
    throw new Error(error.message || "No se pudo crear el usuario en Auth.");
  }

  return "created";
}

function buildEmailHtml({
  recipientName,
  recipientEmail,
  role,
  password,
  appUrl,
}: Required<Pick<InternalInvitationPayload, "recipientEmail">> & {
  recipientName: string;
  role: string;
  password: string;
  appUrl: string;
}) {
  const safeName = escapeHtml(recipientName || "usuario/a");
  const safeEmail = escapeHtml(recipientEmail);
  const safeRole = escapeHtml(roleLabel(role));
  const safePassword = escapeHtml(password);
  const safeAppUrl = escapeHtml(appUrl || DEFAULT_APP_URL);

  return `
  <div style="margin:0;padding:0;background:#eef4fa;font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbe5ef;">
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a,#075985);padding:30px 32px;color:#ffffff;">
                <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:800;">FixLoop | Pumay</h1>
                <p style="margin:8px 0 0;font-size:15px;color:#dbeafe;">Report. Assign. Resolve.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 12px;font-size:24px;color:#0f172a;">Bienvenido/a a FixLoop | Pumay</h2>
                <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hola ${safeName},</p>
                <p style="margin:0 0 18px;font-size:15px;color:#334155;">Tu usuario interno fue creado o actualizado correctamente.</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:18px;border-radius:16px;margin:22px 0;">
                  <p style="margin:0 0 8px;"><strong>Link de acceso:</strong> <a href="${safeAppUrl}" style="color:#0369a1;">${safeAppUrl}</a></p>
                  <p style="margin:0 0 8px;"><strong>Usuario:</strong> ${safeEmail}</p>
                  <p style="margin:0 0 8px;"><strong>Contraseña temporal:</strong> ${safePassword}</p>
                  <p style="margin:0;"><strong>Rol:</strong> ${safeRole}</p>
                </div>
                <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:16px;border-radius:16px;margin:22px 0;color:#065f46;">
                  <strong>Importante:</strong> al iniciar sesión, el sistema te solicitará crear tu propia contraseña.
                </div>
                <h3 style="font-size:18px;margin:24px 0 10px;color:#0f172a;">Instalar en iPhone</h3>
                <ol style="margin-top:0;color:#334155;font-size:15px;">
                  <li>Abre el link desde <strong>Safari</strong>.</li>
                  <li>Presiona <strong>Compartir</strong>.</li>
                  <li>Selecciona <strong>Agregar a pantalla de inicio</strong>.</li>
                  <li>Presiona <strong>Agregar</strong>.</li>
                </ol>
                <h3 style="font-size:18px;margin:24px 0 10px;color:#0f172a;">Instalar en Android</h3>
                <ol style="margin-top:0;color:#334155;font-size:15px;">
                  <li>Abre el link desde <strong>Google Chrome</strong>.</li>
                  <li>Presiona el menú de <strong>tres puntos</strong>.</li>
                  <li>Selecciona <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.</li>
                  <li>Confirma la instalación.</li>
                </ol>
                <p style="margin:24px 0 0;font-size:15px;color:#334155;">Una vez dentro, activa las notificaciones para recibir tareas asignadas, alertas críticas y cierres de casos.</p>
                <p style="margin:24px 0 0;font-size:15px;color:#334155;">Saludos,<br/><strong>Equipo FixLoop | Pumay</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const resend = getResendClient();
    const body = (await request.json()) as InternalInvitationPayload;

    const organizationId = Number(body.organizationId || 1);
    const requesterEmail = normalizeEmail(body.requesterEmail);
    const recipientEmail = normalizeEmail(body.recipientEmail);
    const temporaryPassword = cleanText(
      body.password,
      process.env.INTERNAL_USER_TEMPORARY_PASSWORD || DEFAULT_TEMPORARY_PASSWORD
    );
    const appUrl = cleanText(body.appUrl, DEFAULT_APP_URL);

    await assertOwner(supabaseAdmin, requesterEmail, organizationId);

    if (!recipientEmail) {
      return NextResponse.json(
        { ok: false, error: "Falta el correo del usuario." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users_pumay")
      .select("id,name,email,role,organization_id,active")
      .eq("organization_id", organizationId)
      .eq("email", recipientEmail)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "No se encontró el usuario interno en users_pumay." },
        { status: 404 }
      );
    }

    const recipientName = cleanText(body.recipientName, profile.name || recipientEmail);
    const role = cleanText(body.role, profile.role || "operaciones");

    const authAction = await upsertAuthPassword({
      supabaseAdmin,
      email: recipientEmail,
      name: recipientName,
      role,
      temporaryPassword,
    });

    const { error: updateError } = await supabaseAdmin
      .from("users_pumay")
      .update({ must_change_password: true, active: true })
      .eq("organization_id", organizationId)
      .eq("email", recipientEmail);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: [recipientEmail],
      subject: "Bienvenido a FixLoop | Pumay",
      html: buildEmailHtml({
        recipientName,
        recipientEmail,
        role,
        password: temporaryPassword,
        appUrl,
      }),
    });

    if (error) {
      return NextResponse.json({ ok: false, error: apiErrorMessage(error, "Resend no pudo enviar el correo."), provider: "resend" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data, authAction });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el correo de acceso.",
      },
      { status: 500 }
    );
  }
}
