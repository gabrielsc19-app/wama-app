import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Faltan variables de Supabase: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeRole(value: unknown) {
  return cleanText(value).toLowerCase();
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getAdminClient();
    const { id } = await context.params;

    const incidentId = Number(id);

    if (!incidentId) {
      return NextResponse.json(
        { ok: false, error: "ID de caso inválido." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const organizationId = Number(body.organizationId || 1);
    const userEmail = cleanText(body.userEmail).toLowerCase();
    const userRole = normalizeRole(body.userRole);

    if (!userEmail) {
      return NextResponse.json(
        { ok: false, error: "Falta userEmail para validar el owner." },
        { status: 400 }
      );
    }

    if (userRole !== "owner") {
      return NextResponse.json(
        { ok: false, error: "Solo usuarios owner pueden eliminar casos." },
        { status: 403 }
      );
    }

    const { data: ownerProfile, error: ownerError } = await supabaseAdmin
      .from("users_pumay")
      .select("id, name, email, role, active, organization_id")
      .eq("organization_id", organizationId)
      .eq("email", userEmail)
      .eq("active", true)
      .maybeSingle();

    if (ownerError || !ownerProfile) {
      return NextResponse.json(
        {
          ok: false,
          error:
            ownerError?.message ||
            "No se encontró usuario owner activo para autorizar la eliminación.",
        },
        { status: 403 }
      );
    }

    if (normalizeRole(ownerProfile.role) !== "owner") {
      return NextResponse.json(
        {
          ok: false,
          error: "El usuario autenticado no tiene rol owner.",
        },
        { status: 403 }
      );
    }

    const { data: incident, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .select("id, title, organization_id")
      .eq("id", incidentId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (incidentError || !incident) {
      return NextResponse.json(
        {
          ok: false,
          error: incidentError?.message || "No se encontró el caso.",
        },
        { status: 404 }
      );
    }

    const { error: logsError } = await supabaseAdmin
      .from("incident_logs")
      .delete()
      .eq("incident_id", incidentId)
      .eq("organization_id", organizationId);

    if (logsError) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se pudo borrar el historial del caso: ${logsError.message}`,
        },
        { status: 500 }
      );
    }

    const { error: deleteIncidentError } = await supabaseAdmin
      .from("incidents")
      .delete()
      .eq("id", incidentId)
      .eq("organization_id", organizationId);

    if (deleteIncidentError) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se pudo eliminar el caso: ${deleteIncidentError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      deleted: true,
      incidentId,
      title: incident.title || null,
    });
  } catch (error) {
    console.error("DELETE /api/incidents/[id] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el caso.",
      },
      { status: 500 }
    );
  }
}
