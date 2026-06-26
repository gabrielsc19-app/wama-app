import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type AnySupabaseClient = any;

const INTERNAL_ROLES = [
  "owner",
  "super_admin",
  "comercial",
  "aseo",
  "seguridad",
  "mantencion",
  "mantención",
  "operaciones",
  "admin",
];

const ALLOWED_ROLES = INTERNAL_ROLES;
const DEFAULT_TEMPORARY_PASSWORD = "FixLoop2026!";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fixloop-pumay.vercel.app";

type UserPumayRow = {
  id: number;
  created_at?: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  active: boolean | null;
  organization_id: number | null;
  must_change_password?: boolean | null;
};

type UsersSummary = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  owners: number;
  superAdmins: number;
  comerciales: number;
  operativos: number;
};

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
    return null;
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

function roleLabel(role: string) {
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

  return labels[role] || role;
}

function emptySummary(): UsersSummary {
  return {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    owners: 0,
    superAdmins: 0,
    comerciales: 0,
    operativos: 0,
  };
}

function buildSummary(users: UserPumayRow[]): UsersSummary {
  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.active !== false).length,
    inactiveUsers: users.filter((user) => user.active === false).length,
    owners: users.filter((user) => user.role === "owner").length,
    superAdmins: users.filter((user) => user.role === "super_admin").length,
    comerciales: users.filter((user) => user.role === "comercial").length,
    operativos: users.filter(
      (user) => !["owner", "super_admin", "comercial"].includes(cleanText(user.role))
    ).length,
  };
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

  const requester = data as UserPumayRow | null;

  if (!requester || requester.role !== "owner") {
    throw new Error("Solo usuarios owner pueden administrar perfiles Pumay.");
  }

  return requester;
}

async function upsertAuthUser({
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
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      existingAuthUser.id,
      {
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name, role },
      }
    );

    if (error) {
      throw new Error(error.message || "No se pudo actualizar el usuario en Auth.");
    }

    return { authUser: data?.user || existingAuthUser, authAction: "updated" };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (error) {
    throw new Error(error.message || "No se pudo crear el usuario en Auth.");
  }

  return { authUser: data?.user || null, authAction: "created" };
}

function buildInternalWelcomeHtml({
  name,
  email,
  role,
  temporaryPassword,
}: {
  name: string;
  email: string;
  role: string;
  temporaryPassword: string;
}) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(roleLabel(role));
  const safePassword = escapeHtml(temporaryPassword);
  const safeAppUrl = escapeHtml(APP_URL);

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
                <p style="margin:0 0 18px;font-size:15px;color:#334155;">Tu usuario interno para FixLoop | Pumay fue creado correctamente.</p>

                <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:18px;border-radius:16px;margin:22px 0;">
                  <p style="margin:0 0 8px;"><strong>Link de acceso:</strong> <a href="${safeAppUrl}" style="color:#0369a1;">${safeAppUrl}</a></p>
                  <p style="margin:0 0 8px;"><strong>Usuario:</strong> ${safeEmail}</p>
                  <p style="margin:0 0 8px;"><strong>Contraseña temporal:</strong> ${safePassword}</p>
                  <p style="margin:0;"><strong>Rol:</strong> ${safeRole}</p>
                </div>

                <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:16px;border-radius:16px;margin:22px 0;color:#065f46;">
                  <strong>Importante:</strong> al iniciar sesión por primera vez, el sistema te solicitará crear tu propia contraseña.
                </div>

                <h3 style="font-size:18px;margin:24px 0 10px;color:#0f172a;">Cómo instalar la app en iPhone</h3>
                <ol style="margin-top:0;color:#334155;font-size:15px;">
                  <li>Abre el link desde <strong>Safari</strong>.</li>
                  <li>Presiona el botón de <strong>compartir</strong>.</li>
                  <li>Selecciona <strong>Agregar a pantalla de inicio</strong>.</li>
                  <li>Presiona <strong>Agregar</strong>.</li>
                </ol>

                <h3 style="font-size:18px;margin:24px 0 10px;color:#0f172a;">Cómo instalar la app en Android</h3>
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
            <tr>
              <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#64748b;">Este correo fue enviado automáticamente por FixLoop | Pumay.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

async function sendInternalWelcomeEmail({
  name,
  email,
  role,
  temporaryPassword,
}: {
  name: string;
  email: string;
  role: string;
  temporaryPassword: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    return {
      sent: false,
      reason: "Falta RESEND_API_KEY. Usuario creado, pero no se envió correo.",
    };
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "FixLoop | Pumay <onboarding@resend.dev>",
    to: [email],
    subject: "Bienvenido a FixLoop | Pumay",
    html: buildInternalWelcomeHtml({ name, email, role, temporaryPassword }),
  });

  if (error) {
    return { sent: false, reason: JSON.stringify(error) };
  }

  return { sent: true, data };
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);

    const organizationId = Number(searchParams.get("organizationId") || 1);
    const requesterEmail = normalizeEmail(searchParams.get("requesterEmail"));
    const search = normalizeEmail(searchParams.get("search"));
    const roleFilter = cleanText(searchParams.get("role"), "all");
    const activeFilter = cleanText(searchParams.get("active"), "all");

    await assertOwner(supabaseAdmin, requesterEmail, organizationId);

    let query = supabaseAdmin
      .from("users_pumay")
      .select("id,created_at,name,email,role,active,organization_id,must_change_password")
      .eq("organization_id", organizationId)
      .in("role", INTERNAL_ROLES)
      .order("role", { ascending: true })
      .order("name", { ascending: true });

    if (roleFilter !== "all") {
      if (!INTERNAL_ROLES.includes(roleFilter)) {
        return NextResponse.json({
          ok: true,
          users: [],
          summary: emptySummary(),
          allowedRoles: ALLOWED_ROLES,
          scope: "internal_pumay_users_only",
        });
      }

      query = query.eq("role", roleFilter);
    }

    if (activeFilter === "active") query = query.eq("active", true);
    if (activeFilter === "inactive") query = query.eq("active", false);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, details: error },
        { status: 500 }
      );
    }

    let users = (data || []) as UserPumayRow[];

    if (search) {
      users = users.filter((user) => {
        const haystack = [user.name, user.email, user.role].join(" ").toLowerCase();
        return haystack.includes(search);
      });
    }

    return NextResponse.json({
      ok: true,
      users,
      summary: buildSummary(users),
      allowedRoles: ALLOWED_ROLES,
      scope: "internal_pumay_users_only",
    });
  } catch (error) {
    console.error("GET admin users error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los usuarios.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();

    const organizationId = Number(body.organizationId || 1);
    const requesterEmail = normalizeEmail(body.requesterEmail);

    await assertOwner(supabaseAdmin, requesterEmail, organizationId);

    const name = cleanText(body.name);
    const email = normalizeEmail(body.email);
    const role = cleanText(body.role, "operaciones");
    const active = body.active === undefined ? true : Boolean(body.active);
    const temporaryPassword = cleanText(
      body.temporaryPassword,
      process.env.INTERNAL_USER_TEMPORARY_PASSWORD || DEFAULT_TEMPORARY_PASSWORD
    );

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "El nombre es obligatorio." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "El correo es obligatorio." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { ok: false, error: `Rol no permitido para usuarios Pumay internos: ${role}.` },
        { status: 400 }
      );
    }

    const authResult = await upsertAuthUser({
      supabaseAdmin,
      email,
      name,
      role,
      temporaryPassword,
    });

    const { data, error } = await supabaseAdmin
      .from("users_pumay")
      .upsert(
        {
          name,
          email,
          role,
          active,
          organization_id: organizationId,
          must_change_password: true,
        },
        { onConflict: "organization_id,email" }
      )
      .select("id,created_at,name,email,role,active,organization_id,must_change_password")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, details: error },
        { status: 500 }
      );
    }

    const emailResult = await sendInternalWelcomeEmail({
      name,
      email,
      role,
      temporaryPassword,
    });

    return NextResponse.json({
      ok: true,
      user: data,
      authAction: authResult.authAction,
      emailSent: emailResult.sent,
      emailWarning: emailResult.sent ? null : emailResult.reason,
    });
  } catch (error) {
    console.error("POST admin users error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el usuario.",
      },
      { status: 500 }
    );
  }
}
