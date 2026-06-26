import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AnySupabaseClient = any;

function getAdminClient(): AnySupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as AnySupabaseClient;
}

function normalizeEmail(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function normalizeRole(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const publicationId = Number(body.publicationId || 0);
    const organizationId = Number(body.organizationId || 1);
    const requestedByEmail = normalizeEmail(body.requestedByEmail);

    if (!publicationId || !requestedByEmail) {
      return NextResponse.json(
        { ok: false, error: "Faltan publicationId o requestedByEmail." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getAdminClient();

    const { data: actor, error: actorError } = await supabaseAdmin
      .from("users_pumay")
      .select("id,email,role,active,organization_id")
      .eq("organization_id", organizationId)
      .eq("email", requestedByEmail)
      .eq("active", true)
      .maybeSingle();

    const actorRole = normalizeRole(actor?.role);

    if (actorError || !actor || !["owner", "comercial"].includes(actorRole)) {
      return NextResponse.json(
        { ok: false, error: "Solo Comercial u Owner pueden eliminar publicaciones comerciales." },
        { status: 403 },
      );
    }

    const { data: publication, error: publicationError } = await supabaseAdmin
      .from("commercial_publications")
      .select("id,organization_id,title,archived,status")
      .eq("id", publicationId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (publicationError || !publication) {
      return NextResponse.json(
        { ok: false, error: "No se encontró la publicación comercial." },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("commercial_publications")
      .update({
        archived: true,
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", publicationId)
      .eq("organization_id", organizationId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: "No se pudo eliminar la publicación comercial." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, publicationId });
  } catch (error) {
    console.error("Error archivando publicación comercial:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error interno eliminando publicación comercial.",
      },
      { status: 500 },
    );
  }
}
