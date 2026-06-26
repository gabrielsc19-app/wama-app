import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  organization_id: number;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeRole(role?: string | null) {
  return normalizeText(role);
}

function canCreateServiceReport(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === "seguridad" || normalized === "aseo";
}

function serviceConfig(role?: string | null) {
  const normalized = normalizeRole(role);

  if (normalized === "seguridad") {
    return {
      label: "Seguridad",
      assignedTo: "Equipo Seguridad",
      targetArea: "seguridad",
      sourceModule: "service_reports_security",
    };
  }

  if (normalized === "aseo") {
    return {
      label: "Aseo",
      assignedTo: "Equipo Aseo",
      targetArea: "aseo",
      sourceModule: "service_reports_cleaning",
    };
  }

  return {
    label: "Servicio",
    assignedTo: "Todos responsables Pumay",
    targetArea: "todos",
    sourceModule: "service_reports",
  };
}

function shouldKeepReportOpen(input: {
  reportType: string;
  title: string;
  description: string;
  sector: string;
}) {
  const text = normalizeText(
    `${input.reportType} ${input.title} ${input.description} ${input.sector}`
  );

  const openKeywords = [
    "requiere apoyo",
    "requiere gestion",
    "requiere revision",
    "pendiente",
    "incidente",
    "problema",
    "falla",
    "filtracion",
    "filtración",
    "reparar",
    "reparacion",
    "reparación",
    "urgente",
    "emergencia",
    "riesgo",
    "peligro",
    "dañado",
    "danado",
    "roto",
    "no funciona",
    "sin funcionar",
    "apoyo mantencion",
    "apoyo mantención",
    "apoyo seguridad",
    "apoyo aseo",
  ];

  return openKeywords.some((keyword) => text.includes(normalizeText(keyword)));
}

async function uploadOnePhoto({
  supabaseAdmin,
  file,
  organizationId,
  folder,
}: {
  supabaseAdmin: any;
  file: File;
  organizationId: number;
  folder: string;
}) {
  const extension = file.name.split(".").pop() || "jpg";
  const safeName = `${folder}-${organizationId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;
  const path = `${folder}/${safeName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("incident-photos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (uploadError) {
    throw new Error(uploadError.message || "No se pudo subir la foto.");
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("incident-photos")
    .getPublicUrl(path);

  return publicUrlData.publicUrl as string;
}

async function createIncidentLog({
  supabaseAdmin,
  organizationId,
  incidentId,
  action,
  description,
  performedBy,
  performedByEmail,
}: {
  supabaseAdmin: any;
  organizationId: number;
  incidentId: number;
  action: string;
  description: string;
  performedBy: string;
  performedByEmail: string;
}) {
  const { error } = await supabaseAdmin.from("incident_logs").insert({
    organization_id: organizationId,
    incident_id: incidentId,
    action,
    description,
    performed_by: performedBy,
    performed_by_email: performedByEmail,
  });

  if (error) {
    console.error("No se pudo crear log de reporte de servicio:", error);
  }
}

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Faltan variables SUPABASE para el servidor." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const formData = await request.formData();

    const userEmail = cleanText(formData.get("userEmail")).toLowerCase();
    const reportType = cleanText(formData.get("reportType"), "Reporte diario");
    const sector = cleanText(formData.get("sector"));
    const title = cleanText(formData.get("title"));
    const description = cleanText(formData.get("description"));

    if (!userEmail || !title || !description) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users_pumay")
      .select("id,name,email,role,active,organization_id")
      .eq("email", userEmail)
      .eq("active", true)
      .maybeSingle<UserProfile>();

    if (profileError || !profile) {
      return NextResponse.json(
        { ok: false, error: "No se encontró perfil activo para este usuario." },
        { status: 403 }
      );
    }

    if (!canCreateServiceReport(profile.role)) {
      return NextResponse.json(
        { ok: false, error: "Perfil no autorizado para reportes de servicio." },
        { status: 403 }
      );
    }

    const config = serviceConfig(profile.role);
    const reportTitle = `${config.label} - ${reportType}: ${title}`;
    const keepOpen = shouldKeepReportOpen({
      reportType,
      title,
      description,
      sector,
    });

    const now = new Date().toISOString();
    const status = keepOpen ? "nuevo" : "cerrado";
    const resolutionComment = keepOpen
      ? null
      : `Reporte de ${config.label} registrado y cerrado automáticamente por ${profile.name}.`;

    const photoInputs = [
      ...formData.getAll("photos"),
      ...formData.getAll("photo"),
    ].filter((item): item is File => item instanceof File && item.size > 0);

    const limitedPhotos = photoInputs.slice(0, 5);
    const photoUrls: string[] = [];

    for (const photo of limitedPhotos) {
      try {
        const url = await uploadOnePhoto({
          supabaseAdmin,
          file: photo,
          organizationId: profile.organization_id,
          folder: "service-reports",
        });
        photoUrls.push(url);
      } catch (uploadError) {
        console.error("No se pudo subir una foto. Se continuará:", uploadError);
      }
    }

    const primaryPhotoUrl = photoUrls[0] || null;

    const fullPayload = {
      organization_id: profile.organization_id,
      title: reportTitle,
      description,
      type: config.label,
      priority: "media",
      status,
      location_id: null,
      local_code: null,
      location_name: sector || "Reporte interno Pumay",
      reporter_name: profile.name,
      reporter_email: profile.email,
      reporter_phone: null,
      assigned_to: config.assignedTo,
      assigned_to_email: null,
      assigned_by: profile.name,
      assigned_by_email: profile.email,
      assigned_at: now,
      taken_at: keepOpen ? null : now,
      closed_at: keepOpen ? null : now,
      resolution_comment: resolutionComment,
      report_direction: "internal_to_pumay",
      target_area: config.targetArea,
      responsible_area: config.targetArea,
      source_module: config.sourceModule,
      service_type: normalizeRole(profile.role),
      applies_to_metrics: false,
      is_test: false,
      archived: false,
      photo_url: primaryPhotoUrl,
    };

    const legacyPayload = {
      organization_id: profile.organization_id,
      title: reportTitle,
      description,
      type: config.label,
      priority: "media",
      status,
      location_id: null,
      location_name: sector || "Reporte interno Pumay",
      reporter_name: profile.name,
      reporter_email: profile.email,
      reporter_phone: null,
      assigned_to: config.assignedTo,
      assigned_to_email: null,
      assigned_by: profile.name,
      assigned_by_email: profile.email,
      assigned_at: now,
      closed_at: keepOpen ? null : now,
      resolution_comment: resolutionComment,
      report_direction: "internal_to_pumay",
      photo_url: primaryPhotoUrl,
    };

    let { data: incident, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .insert(fullPayload)
      .select()
      .single();

    if (incidentError) {
      const message = String(incidentError.message || "").toLowerCase();
      const shouldRetryLegacy =
        message.includes("target_area") ||
        message.includes("responsible_area") ||
        message.includes("source_module") ||
        message.includes("service_type") ||
        message.includes("applies_to_metrics") ||
        message.includes("is_test") ||
        message.includes("archived") ||
        message.includes("taken_at") ||
        message.includes("schema cache");

      if (shouldRetryLegacy) {
        console.warn(
          "Reporte de servicio reintentado con payload legacy:",
          incidentError
        );

        const retry = await supabaseAdmin
          .from("incidents")
          .insert(legacyPayload)
          .select()
          .single();

        incident = retry.data;
        incidentError = retry.error;
      }
    }

    if (incidentError || !incident) {
      console.error("Error insertando reporte de servicio:", incidentError);
      return NextResponse.json(
        {
          ok: false,
          error: incidentError?.message || "No se pudo crear el reporte.",
        },
        { status: 500 }
      );
    }

    if (photoUrls.length > 0) {
      try {
        await supabaseAdmin.from("incident_photos").insert(
          photoUrls.map((photoUrl) => ({
            organization_id: profile.organization_id,
            incident_id: incident.id,
            photo_url: photoUrl,
            photo_type: keepOpen ? "creation" : "closure",
            uploaded_by: profile.name,
            uploaded_by_email: profile.email,
          }))
        );
      } catch (photoLogError) {
        console.error("No se pudo registrar incident_photos:", photoLogError);
      }
    }

    await createIncidentLog({
      supabaseAdmin,
      organizationId: profile.organization_id,
      incidentId: incident.id,
      action: "service_report_created",
      description: `${profile.name} registró reporte de ${config.label}: ${reportType}. Sector: ${sector || "No informado"}.`,
      performedBy: profile.name,
      performedByEmail: profile.email,
    });

    if (!keepOpen) {
      await createIncidentLog({
        supabaseAdmin,
        organizationId: profile.organization_id,
        incidentId: incident.id,
        action: "closed",
        description: resolutionComment || "Reporte cerrado automáticamente.",
        performedBy: profile.name,
        performedByEmail: profile.email,
      });
    }

    return NextResponse.json({
      ok: true,
      incident,
      autoClosed: !keepOpen,
      photosSaved: photoUrls.length,
    });
  } catch (error) {
    console.error("Error general en /api/service-reports:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo enviar el reporte." },
      { status: 500 }
    );
  }
}
