import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Faltan variables Supabase.");
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

async function safeNotifyAdmins(request: NextRequest, params: { organizationId: number; title: string; body: string }) {
  try {
    await fetch(new URL("/api/push/notify-admins", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: params.organizationId, title: params.title, body: params.body, url: "/" }),
    });
  } catch (error) {
    console.error("No se pudo notificar a super_admin:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = adminClient();
    const body = await request.json();

    const organizationId = Number(body.organizationId || body.organization_id || 1);
    const title = asString(body.title, "Nuevo reporte de local");
    const description = asString(body.description, "Sin descripción.");
    const type = asString(body.type || body.category, "Operativo");
    const priority = asString(body.priority, "Media");
    const locationId = body.locationId || body.location_id || null;
    const locationName = asString(body.locationName || body.location_name || body.localName, "Local no informado");
    const reporterName = asString(body.reporterName || body.reporter_name, "Locatario");
    const reporterEmail = asString(body.reporterEmail || body.reporter_email, "");
    const photoUrl = asString(body.photoUrl || body.photo_url, "");

    const { data, error } = await supabase.from("incidents").insert({
      organization_id: organizationId,
      title,
      description,
      type,
      priority,
      status: "Nuevo",
      location_id: locationId,
      location_name: locationName,
      reporter_name: reporterName,
      reporter_email: reporterEmail || null,
      assigned_to: "Todos responsables Pumay",
      assigned_to_email: null,
      report_direction: "local_to_pumay",
      photo_url: photoUrl || null,
    }).select().single();

    if (error) {
      console.error("Error creando reporte Local a Pumay:", error);
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 });
    }

    await safeNotifyAdmins(request, { organizationId, title: "FixLoop | Pumay: nuevo reporte de local", body: `${locationName}: ${title}` });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Error general en /api/local-to-pumay:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo crear el reporte." }, { status: 500 });
  }
}
