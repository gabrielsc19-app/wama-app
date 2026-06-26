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

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const incidentId = Number(searchParams.get("incidentId"));
    const organizationId = Number(searchParams.get("organizationId"));

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

    const { data, error } = await supabaseAdmin
      .from("incident_logs")
      .select("*")
      .eq("incident_id", incidentId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "No se pudo cargar el historial del caso.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const logs = (data || []).map((log: any) => ({
      id: log.id,
      created_at: log.created_at,
      incident_id: log.incident_id,
      organization_id: log.organization_id,
      action: log.action,
      description: log.description || log.detail || null,
      performed_by: log.performed_by || log.created_by_name || null,
      performed_by_email:
        log.performed_by_email || log.created_by_email || null,
    }));

    return NextResponse.json({
      ok: true,
      logs,
    });
  } catch (error) {
    console.error("GET /api/incidents/logs error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error interno al cargar historial.",
      },
      { status: 500 }
    );
  }
}