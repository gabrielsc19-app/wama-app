import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type TeamOption = {
  label: string;
  area: string;
};

const TEAM_OPTIONS: TeamOption[] = [
  { label: "Equipo Operaciones", area: "operaciones" },
  { label: "Equipo Mantención", area: "mantencion" },
  { label: "Equipo Seguridad", area: "seguridad" },
  { label: "Equipo Aseo", area: "aseo" },
  { label: "Equipo Comercial", area: "comercial" },
  { label: "Todos responsables Pumay", area: "todos" },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeRole(value: unknown) {
  return cleanText(value).toLowerCase();
}

function normalizeArea(value: unknown) {
  const raw = cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!raw) return "operaciones";
  if (raw.includes("mantencion") || raw.includes("mantenimiento")) return "mantencion";
  if (raw.includes("seguridad")) return "seguridad";
  if (raw.includes("aseo")) return "aseo";
  if (raw.includes("comercial")) return "comercial";
  if (raw.includes("todos") || raw.includes("responsables")) return "todos";
  if (raw.includes("operacion")) return "operaciones";

  return raw;
}

function getTeamByLabelOrArea(label: unknown, area: unknown) {
  const labelText = cleanText(label);
  const normalizedArea = normalizeArea(area || labelText);

  return (
    TEAM_OPTIONS.find((team) => team.label === labelText) ||
    TEAM_OPTIONS.find((team) => team.area === normalizedArea) ||
    TEAM_OPTIONS[0]
  );
}

function canCreateInternalTask(role: unknown) {
  const normalized = normalizeRole(role);
  return [
    "owner",
    "super_admin",
    "operaciones",
    "mantencion",
    "mantención",
    "mantenimiento",
    "seguridad",
    "aseo",
    "comercial",
    "admin",
  ].includes(normalized);
}

function normalizePriority(value: unknown) {
  const normalized = normalizeRole(value);
  if (normalized === "alta" || normalized === "critica" || normalized === "crítica") return "alta";
  if (normalized === "baja") return "baja";
  return "media";
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json().catch(() => ({}));

    const organizationId = Number(body.organizationId || 1);
    const createdByEmail = cleanText(body.createdByEmail).toLowerCase();
    const createdByName = cleanText(body.createdByName, "Usuario Pumay");
    const createdByRole = cleanText(body.createdByRole);

    if (!createdByEmail) {
      return NextResponse.json(
        { ok: false, error: "Falta el correo del usuario creador." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users_pumay")
      .select("id,name,email,role,active,organization_id")
      .eq("organization_id", organizationId)
      .eq("email", createdByEmail)
      .eq("active", true)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          ok: false,
          error: profileError?.message || "No se encontró un perfil activo para crear la tarea.",
        },
        { status: 403 }
      );
    }

    if (!canCreateInternalTask(profile.role || createdByRole)) {
      return NextResponse.json(
        { ok: false, error: "Tu perfil no tiene permiso para crear tareas internas." },
        { status: 403 }
      );
    }

    const team = getTeamByLabelOrArea(body.assignedTo, body.targetArea || body.responsibleArea);
    const targetArea = team.area;

    const title = cleanText(body.title);
    const description = cleanText(body.description);
    const taskType = cleanText(body.type, "Tarea operacional");
    const priority = normalizePriority(body.priority);
    const photoUrl = cleanText(body.photoUrl) || null;

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Debes ingresar un título para la tarea." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { ok: false, error: "Debes ingresar una descripción para la tarea." },
        { status: 400 }
      );
    }

    const incidentPayload = {
      title,
      type: taskType,
      status: "nuevo",
      description,
      location_id: null,
      local_code: null,
      location_name: "Tarea interna Pumay",
      report_direction: "pumay_internal",
      reporter_name: profile.name || createdByName,
      reporter_email: profile.email || createdByEmail,
      reporter_phone: null,
      priority,
      assigned_to: team.label,
      assigned_to_email: null,
      assigned_by: profile.name || createdByName,
      assigned_by_email: profile.email || createdByEmail,
      assigned_at: new Date().toISOString(),
      created_by_email: profile.email || createdByEmail,
      target_area: targetArea,
      responsible_area: targetArea,
      source_module: "internal_tasks",
      applies_to_metrics: true,
      is_test: false,
      archived: false,
      resolution_comment: null,
      closed_at: null,
      organization_id: organizationId,
      photo_url: photoUrl,
    };

    const { data: incident, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .insert(incidentPayload)
      .select()
      .single();

    if (incidentError) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se pudo crear la tarea interna: ${incidentError.message}`,
          details: incidentError,
        },
        { status: 500 }
      );
    }

    if (incident?.id) {
      await supabaseAdmin.from("incident_logs").insert({
        organization_id: organizationId,
        incident_id: incident.id,
        action: "pumay_internal_created",
        description: `${profile.name || createdByName} creó una tarea interna para ${team.label}. Área: ${targetArea}.`,
        performed_by: profile.name || createdByName,
        performed_by_email: profile.email || createdByEmail,
      });
    }

    try {
      await fetch(new URL("/api/push/notify-assigned", request.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          assignedTo: team.label,
          assignedToName: team.label,
          assignedToEmail: null,
          targetArea,
          responsibleArea: targetArea,
          assignedByName: profile.name || createdByName,
          incidentTitle: title,
          incidentLocation: "Tarea interna Pumay",
          title: "FixLoop | Pumay: nueva tarea interna",
          body: `${title} · ${team.label}`,
          url: "/",
        }),
      });
    } catch (error) {
      console.error("No se pudo enviar push al equipo asignado:", error);
    }

    return NextResponse.json({
      ok: true,
      incident,
      team,
      targetArea,
    });
  } catch (error) {
    console.error("POST /api/internal-tasks error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la tarea interna.",
      },
      { status: 500 }
    );
  }
}
