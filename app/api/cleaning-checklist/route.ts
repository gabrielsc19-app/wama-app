import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ChecklistFrequency = "diario" | "semanal" | "quincenal" | "mensual";

type ChecklistTemplate = {
  id: number;
  organization_id: number;
  title: string;
  frequency: ChecklistFrequency;
  sector: string | null;
  active: boolean;
  requires_photo: boolean;
};

type ChecklistAnswer = {
  templateId: number;
  status: "si" | "no" | "pendiente";
  observation?: string;
};

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function parseDate(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return new Date().toISOString().slice(0, 10);

  const date = new Date(`${raw.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);

  return raw.slice(0, 10);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthYear(dateText: string) {
  const date = new Date(`${dateText}T12:00:00`);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

function getMonday(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

function getLastDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0);
}

function getPeriodForFrequency(frequency: ChecklistFrequency, serviceDate: string) {
  const date = new Date(`${serviceDate}T12:00:00`);

  if (frequency === "diario") {
    return {
      periodType: "diario",
      periodStart: serviceDate,
      periodEnd: serviceDate,
      dueDate: serviceDate,
    };
  }

  if (frequency === "semanal") {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(12, 0, 0, 0);

    return {
      periodType: "semanal",
      periodStart: toIsoDate(monday),
      periodEnd: toIsoDate(sunday),
      dueDate: toIsoDate(sunday),
    };
  }

  if (frequency === "quincenal") {
    const startDay = date.getDate() <= 15 ? 1 : 16;
    const endDay = date.getDate() <= 15 ? 15 : getLastDayOfMonth(date).getDate();
    const start = new Date(date.getFullYear(), date.getMonth(), startDay, 12, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), endDay, 12, 0, 0, 0);

    return {
      periodType: "quincenal",
      periodStart: toIsoDate(start),
      periodEnd: toIsoDate(end),
      dueDate: toIsoDate(end),
    };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
  const end = getLastDayOfMonth(date);

  return {
    periodType: "mensual",
    periodStart: toIsoDate(start),
    periodEnd: toIsoDate(end),
    dueDate: toIsoDate(end),
  };
}

function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 12, 0, 0, 0);
  const end = getLastDayOfMonth(start);
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
  };
}

async function uploadOptionalPhoto(
  supabaseAdmin: any,
  file: File | null,
  organizationId: number,
  templateId: number,
  serviceDate: string
) {
  if (!file || file.size === 0) return null;

  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `aseo-checklist/${organizationId}/${serviceDate}/${templateId}-${Date.now()}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from("incident-photos")
    .upload(filePath, {
      body: file,
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    } as any);

  if (error) {
    const retry = await supabaseAdmin.storage
      .from("incident-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (retry.error) {
      console.error("No se pudo subir foto checklist aseo:", retry.error);
      return null;
    }
  }

  const { data } = supabaseAdmin.storage
    .from("incident-photos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const organizationId = Number(searchParams.get("organizationId") || 1);
    const serviceDate = searchParams.get("serviceDate");
    const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    const supabaseAdmin = getAdminClient();

    const { data: templates, error: templatesError } = await supabaseAdmin
      .from("cleaning_checklist_templates")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("frequency", { ascending: true })
      .order("id", { ascending: true });

    if (templatesError) {
      return NextResponse.json(
        { ok: false, error: templatesError.message, details: templatesError },
        { status: 500 }
      );
    }

    let responseQuery = supabaseAdmin
      .from("cleaning_checklist_responses")
      .select("*")
      .eq("organization_id", organizationId)
      .order("period_start", { ascending: false })
      .order("id", { ascending: false });

    if (serviceDate) {
      const selectedDate = parseDate(serviceDate);

      const activePeriods = (templates || []).map((template: ChecklistTemplate) => {
        const period = getPeriodForFrequency(template.frequency, selectedDate);
        return {
          templateId: template.id,
          ...period,
        };
      });

      const minStart = activePeriods.reduce((min: string, period: any) => {
        return period.periodStart < min ? period.periodStart : min;
      }, activePeriods[0]?.periodStart || selectedDate);

      const maxEnd = activePeriods.reduce((max: string, period: any) => {
        return period.periodEnd > max ? period.periodEnd : max;
      }, activePeriods[0]?.periodEnd || selectedDate);

      responseQuery = responseQuery
        .gte("period_end", minStart)
        .lte("period_start", maxEnd);
    } else {
      const bounds = getMonthBounds(year, month);
      responseQuery = responseQuery
        .gte("period_end", bounds.start)
        .lte("period_start", bounds.end);
    }

    const { data: responses, error: responsesError } = await responseQuery;

    if (responsesError) {
      return NextResponse.json(
        { ok: false, error: responsesError.message, details: responsesError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      templates: templates || [],
      responses: responses || [],
    });
  } catch (error) {
    console.error("GET cleaning-checklist error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el checklist de aseo.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const formData = await request.formData();

    const organizationId = Number(formData.get("organizationId") || 1);
    const serviceDate = parseDate(formData.get("serviceDate"));
    const { month, year } = getMonthYear(serviceDate);

    const completedByName = cleanText(formData.get("completedByName"), "Aseo");
    const completedByEmail = cleanText(formData.get("completedByEmail"));

    const rawAnswers = cleanText(formData.get("answers"), "[]");
    const answers = JSON.parse(rawAnswers) as ChecklistAnswer[];

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No se recibieron respuestas del checklist." },
        { status: 400 }
      );
    }

    const { data: templates, error: templatesError } = await supabaseAdmin
      .from("cleaning_checklist_templates")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("active", true);

    if (templatesError) {
      return NextResponse.json(
        { ok: false, error: templatesError.message, details: templatesError },
        { status: 500 }
      );
    }

    const templatesById = new Map<number, ChecklistTemplate>();
    (templates || []).forEach((template: ChecklistTemplate) => {
      templatesById.set(Number(template.id), template);
    });

    const validAnswers = answers.filter((answer) => {
      return (
        Number(answer.templateId) > 0 &&
        templatesById.has(Number(answer.templateId)) &&
        ["si", "no", "pendiente"].includes(String(answer.status))
      );
    });

    if (validAnswers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Las respuestas del checklist no son válidas." },
        { status: 400 }
      );
    }

    const savedRows = [];

    for (const answer of validAnswers) {
      const templateId = Number(answer.templateId);
      const template = templatesById.get(templateId)!;
      const period = getPeriodForFrequency(template.frequency, serviceDate);
      const photo = formData.get(`photo_${templateId}`);
      const photoUrl =
        photo instanceof File
          ? await uploadOptionalPhoto(
              supabaseAdmin,
              photo,
              organizationId,
              templateId,
              serviceDate
            )
          : null;

      const payload = {
        organization_id: organizationId,
        template_id: templateId,
        service_date: serviceDate,
        month,
        year,
        status: answer.status,
        observation: cleanText(answer.observation),
        photo_url: photoUrl,
        completed_by_name: completedByName,
        completed_by_email: completedByEmail || null,
        period_type: period.periodType,
        period_start: period.periodStart,
        period_end: period.periodEnd,
        due_date: period.dueDate,
        auto_closed: false,
        auto_closed_reason: null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from("cleaning_checklist_responses")
        .upsert(payload, {
          onConflict: "organization_id,template_id,period_type,period_start,period_end",
        })
        .select()
        .single();

      if (error) {
        console.error("Error guardando respuesta checklist:", error);
        return NextResponse.json(
          { ok: false, error: error.message, details: error, payload },
          { status: 500 }
        );
      }

      savedRows.push(data);
    }

    try {
      await fetch(new URL("/api/push/notify-admins", request.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: "FixLoop | Pumay: checklist de aseo enviado",
          body: `${completedByName} registró ${savedRows.length} tareas del checklist de aseo.`,
          url: "/informes/aseo",
        }),
      });
    } catch (notifyError) {
      console.error("Checklist guardado, pero no se pudo notificar:", notifyError);
    }

    return NextResponse.json({
      ok: true,
      serviceDate,
      month,
      year,
      saved: savedRows.length,
      rows: savedRows,
    });
  } catch (error) {
    console.error("POST cleaning-checklist error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el checklist de aseo.",
      },
      { status: 500 }
    );
  }
}
