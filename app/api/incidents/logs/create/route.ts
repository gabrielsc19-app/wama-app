import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));

    const incidentId = Number(body.incidentId);
    const organizationId = Number(body.organizationId);
    const action = String(body.action || "").trim();
    const description = String(body.description || "").trim();
    const performedBy = String(body.performedBy || "").trim();
    const performedByEmail = String(body.performedByEmail || "")
      .toLowerCase()
      .trim();

    if (!incidentId) {
      return NextResponse.json(
        { ok: false, error: "Falta incidentId." },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { ok: false, error: "Falta organizationId." },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Falta action." },
        { status: 400 }
      );
    }

    const { data: incident, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .select("id, organization_id")
      .eq("id", incidentId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (incidentError || !incident) {
      return NextResponse.json(
        {
          ok: false,
          error: incidentError?.message || "No se encontró el caso.",
          details: incidentError,
        },
        { status: 404 }
      );
    }

    /*
      FixLoop ha usado dos formatos de columnas en incident_logs:
      1) description / performed_by / performed_by_email
      2) detail / created_by_name / created_by_email

      Este endpoint intenta primero el formato nuevo.
      Si Supabase responde que alguna columna no existe, reintenta con el formato alternativo.
    */

    const primaryPayload = {
      incident_id: incidentId,
      organization_id: organizationId,
      action,
      description: description || null,
      performed_by: performedBy || null,
      performed_by_email: performedByEmail || null,
    };

    let insertResult = await supabaseAdmin
      .from("incident_logs")
      .insert(primaryPayload)
      .select()
      .single();

    if (insertResult.error) {
      const message = String(insertResult.error.message || "").toLowerCase();

      const shouldRetryLegacy =
        message.includes("description") ||
        message.includes("performed_by") ||
        message.includes("performed_by_email") ||
        message.includes("schema cache") ||
        message.includes("column");

      if (shouldRetryLegacy) {
        const legacyPayload = {
          incident_id: incidentId,
          organization_id: organizationId,
          action,
          detail: description || null,
          created_by_name: performedBy || null,
          created_by_email: performedByEmail || null,
        };

        insertResult = await supabaseAdmin
          .from("incident_logs")
          .insert(legacyPayload)
          .select()
          .single();
      }
    }

    if (insertResult.error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            insertResult.error.message || "No se pudo guardar el historial.",
          details: insertResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      log: insertResult.data,
    });
  } catch (error) {
    console.error("POST /api/incidents/logs/create error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error interno al guardar historial.",
      },
      { status: 500 }
    );
  }
}