import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ChecklistFrequency = "diario" | "semanal" | "quincenal" | "mensual";

type ChecklistTemplate = {
  id: number;
  organization_id: number;
  title: string;
  frequency: ChecklistFrequency;
  active: boolean;
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

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseTargetDate(value: string | null) {
  if (value) {
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(12, 0, 0, 0);

  return yesterday;
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

function getPeriodsToClose(targetDate: Date) {
  const targetIso = toIsoDate(targetDate);
  const periods: Array<{
    frequency: ChecklistFrequency;
    periodType: ChecklistFrequency;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
  }> = [];

  periods.push({
    frequency: "diario",
    periodType: "diario",
    periodStart: targetIso,
    periodEnd: targetIso,
    dueDate: targetIso,
  });

  if (targetDate.getDay() === 0) {
    const monday = getMonday(targetDate);

    periods.push({
      frequency: "semanal",
      periodType: "semanal",
      periodStart: toIsoDate(monday),
      periodEnd: targetIso,
      dueDate: targetIso,
    });
  }

  if (targetDate.getDate() === 15) {
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 12, 0, 0, 0);

    periods.push({
      frequency: "quincenal",
      periodType: "quincenal",
      periodStart: toIsoDate(start),
      periodEnd: targetIso,
      dueDate: targetIso,
    });
  }

  const lastDay = getLastDayOfMonth(targetDate);

  if (toIsoDate(lastDay) === targetIso) {
    const biweeklyStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 16, 12, 0, 0, 0);
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 12, 0, 0, 0);

    periods.push({
      frequency: "quincenal",
      periodType: "quincenal",
      periodStart: toIsoDate(biweeklyStart),
      periodEnd: targetIso,
      dueDate: targetIso,
    });

    periods.push({
      frequency: "mensual",
      periodType: "mensual",
      periodStart: toIsoDate(monthStart),
      periodEnd: targetIso,
      dueDate: targetIso,
    });
  }

  return periods;
}

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  return handleAutoClose(request);
}

export async function POST(request: Request) {
  return handleAutoClose(request);
}

async function handleAutoClose(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, error: "No autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = Number(searchParams.get("organizationId") || 1);
    const targetDate = parseTargetDate(searchParams.get("date"));
    const targetIso = toIsoDate(targetDate);
    const periodsToClose = getPeriodsToClose(targetDate);

    const supabaseAdmin = getAdminClient();

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

    let inserted = 0;
    let convertedPending = 0;
    const details = [];

    for (const period of periodsToClose) {
      const periodTemplates = ((templates || []) as ChecklistTemplate[]).filter(
        (template) => template.frequency === period.frequency
      );

      for (const template of periodTemplates) {
        const { data: existing, error: existingError } = await supabaseAdmin
          .from("cleaning_checklist_responses")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("template_id", template.id)
          .eq("period_type", period.periodType)
          .eq("period_start", period.periodStart)
          .eq("period_end", period.periodEnd)
          .maybeSingle();

        if (existingError) {
          details.push({
            templateId: template.id,
            title: template.title,
            error: existingError.message,
          });
          continue;
        }

        if (!existing) {
          const date = new Date(`${period.dueDate}T12:00:00`);
          const month = date.getMonth() + 1;
          const year = date.getFullYear();

          const { error: insertError } = await supabaseAdmin
            .from("cleaning_checklist_responses")
            .insert({
              organization_id: organizationId,
              template_id: template.id,
              service_date: period.dueDate,
              month,
              year,
              status: "no",
              observation: "No respondida dentro del plazo.",
              photo_url: null,
              completed_by_name: "Sistema",
              completed_by_email: "sistema@fixloop.local",
              period_type: period.periodType,
              period_start: period.periodStart,
              period_end: period.periodEnd,
              due_date: period.dueDate,
              auto_closed: true,
              auto_closed_reason: "No respondida dentro del plazo.",
            });

          if (insertError) {
            details.push({
              templateId: template.id,
              title: template.title,
              error: insertError.message,
            });
          } else {
            inserted += 1;
          }

          continue;
        }

        if (existing.status === "pendiente") {
          const { error: updateError } = await supabaseAdmin
            .from("cleaning_checklist_responses")
            .update({
              status: "no",
              observation:
                existing.observation || "Pendiente vencida. Convertida automáticamente a No.",
              auto_closed: true,
              auto_closed_reason: "Pendiente vencida dentro del plazo contractual.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateError) {
            details.push({
              templateId: template.id,
              title: template.title,
              error: updateError.message,
            });
          } else {
            convertedPending += 1;
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      organizationId,
      targetDate: targetIso,
      periodsClosed: periodsToClose,
      inserted,
      convertedPending,
      details,
    });
  } catch (error) {
    console.error("auto-close cleaning checklist error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo ejecutar el cierre automático.",
      },
      { status: 500 }
    );
  }
}
