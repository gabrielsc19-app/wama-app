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

async function getProfile(request: NextRequest, body: any) {
  const supabase = adminClient();
  const token = (request.headers.get("authorization") || "").replace("Bearer ", "").trim();
  let email = asString(body.reporterEmail || body.userEmail || body.email);

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    email = data.user?.email || email;
  }

  if (!email) throw new Error("No se pudo identificar el correo del usuario.");

  const { data: profile, error } = await supabase
    .from("users_pumay")
    .select("id,name,email,role,active,organization_id")
    .eq("email", email)
    .eq("active", true)
    .maybeSingle();

  if (error || !profile) throw new Error("No existe un perfil activo en users_pumay para este usuario.");
  return profile as { id: number; name: string; email: string; role: string; active: boolean; organization_id: number };
}

async function safeLog(params: { organizationId: number; incidentId: number; action: string; detail: string; createdByName: string; createdByEmail: string }) {
  try {
    const supabase = adminClient();
    await supabase.from("incident_logs").insert({
      organization_id: params.organizationId,
      incident_id: params.incidentId,
      action: params.action,
      detail: params.detail,
      created_by_name: params.createdByName,
      created_by_email: params.createdByEmail,
    });
  } catch (error) {
    console.error("No se pudo crear log, pero el caso ya fue creado:", error);
  }
}

async function safeNotifyAssigned(request: NextRequest, params: { organizationId: number; assignedTo: string; title: string; body: string }) {
  try {
    await fetch(new URL("/api/push/notify-assigned", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: params.organizationId, assignedTo: params.assignedTo, title: params.title, body: params.body, url: "/" }),
    });
  } catch (error) {
    console.error("No se pudo enviar notificación asignada:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = adminClient();
    const body = await request.json();
    const profile = await getProfile(request, body);

    const assignedTo = asString(body.assignedTo || body.internalTaskResponsible || body.responsible || body.team, "Todos responsables Pumay");
    const taskType = asString(body.taskType || body.internalTaskType || body.type, "Tarea operacional");
    const priority = asString(body.priority || body.internalTaskPriority, "Media");
    const title = asString(body.title || body.internalTaskTitle, "Tarea interna Pumay");
    const description = asString(body.description || body.internalTaskDescription, "Sin descripción.");
    const photoUrl = asString(body.photoUrl || body.photo_url || body.internalTaskPhotoUrl, "");

    const { data, error } = await supabase.from("incidents").insert({
      organization_id: profile.organization_id,
      title,
      description,
      type: taskType,
      priority,
      status: "Nuevo",
      location_id: null,
      location_name: "Tarea interna Pumay",
      reporter_name: profile.name,
      reporter_email: profile.email,
      assigned_to: assignedTo,
      assigned_to_email: null,
      report_direction: "pumay_internal",
      photo_url: photoUrl || null,
    }).select().single();

    if (error) {
      console.error("Error creando tarea interna:", error);
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 });
    }

    await safeLog({ organizationId: profile.organization_id, incidentId: data.id, action: "Tarea interna creada", detail: `${profile.name} creó una tarea interna para ${assignedTo}.`, createdByName: profile.name, createdByEmail: profile.email });
    await safeNotifyAssigned(request, { organizationId: profile.organization_id, assignedTo, title: "FixLoop | Pumay: nueva tarea asignada", body: `${title} · Responsable: ${assignedTo}` });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Error general en /api/internal-tasks:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo crear la tarea interna." }, { status: 500 });
  }
}
