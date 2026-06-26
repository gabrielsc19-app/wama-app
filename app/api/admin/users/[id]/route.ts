import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

type UserPumayRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
  active: boolean | null;
  organization_id: number | null;
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

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getAdminClient();
    const { id } = await context.params;
    const userId = Number(id);
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "ID de usuario inválido." },
        { status: 400 }
      );
    }

    const organizationId = Number(body.organizationId || 1);
    const requesterEmail = normalizeEmail(body.requesterEmail);

    const requester = await assertOwner(supabaseAdmin, requesterEmail, organizationId);

    const { data: targetData, error: targetError } = await supabaseAdmin
      .from("users_pumay")
      .select("id,name,email,role,active,organization_id")
      .eq("organization_id", organizationId)
      .eq("id", userId)
      .maybeSingle();

    if (targetError) {
      return NextResponse.json(
        { ok: false, error: targetError.message, details: targetError },
        { status: 500 }
      );
    }

    const targetUser = targetData as UserPumayRow | null;

    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: "No se encontró el usuario." },
        { status: 404 }
      );
    }

    const currentRole = cleanText(targetUser.role);

    if (!INTERNAL_ROLES.includes(currentRole)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Este registro no corresponde a un perfil interno Pumay. Adminístralo desde Locales.",
        },
        { status: 400 }
      );
    }

    const nextName = cleanText(body.name, cleanText(targetUser.name));
    const nextEmail = normalizeEmail(body.email || targetUser.email);
    const nextRole = cleanText(body.role, currentRole);
    const nextActive =
      body.active === undefined ? targetUser.active !== false : Boolean(body.active);

    if (!ALLOWED_ROLES.includes(nextRole)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Rol no permitido para usuarios Pumay internos: ${nextRole}.`,
        },
        { status: 400 }
      );
    }

    const isSelf = requester.id === targetUser.id;

    if (isSelf && nextRole !== "owner") {
      return NextResponse.json(
        { ok: false, error: "No puedes quitarte a ti mismo el rol owner." },
        { status: 400 }
      );
    }

    if (isSelf && nextActive === false) {
      return NextResponse.json(
        { ok: false, error: "No puedes desactivarte a ti mismo." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users_pumay")
      .update({
        name: nextName,
        email: nextEmail,
        role: nextRole,
        active: nextActive,
      })
      .eq("organization_id", organizationId)
      .eq("id", userId)
      .select("id,created_at,name,email,role,active,organization_id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: data,
    });
  } catch (error) {
    console.error("PATCH admin user error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el usuario.",
      },
      { status: 500 }
    );
  }
}
