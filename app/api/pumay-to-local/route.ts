import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clean(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  if (!text || text === "undefined" || text === "null") return fallback;
  return text;
}

function parseOrgId(value: FormDataEntryValue | null) {
  const parsed = Number(clean(value, "1"));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseOptionalNumber(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

async function findLocation(supabaseAdmin: any, organizationId: number, rawLocationId: string) {
  const numericId = Number(rawLocationId);

  if (Number.isFinite(numericId) && numericId > 0) {
    const { data } = await supabaseAdmin
      .from("locations")
      .select("*")
      .eq("id", numericId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (data) return data;
  }

  const localCodeFromText = rawLocationId.includes("·")
    ? rawLocationId.split("·")[0].trim()
    : rawLocationId;

  const localNameFromText = rawLocationId.includes("·")
    ? rawLocationId.split("·").slice(1).join("·").trim()
    : rawLocationId;

  try {
    const filters = [
      `local_code.eq.${localCodeFromText}`,
      `code.eq.${localCodeFromText}`,
      `name.eq.${localNameFromText}`,
    ].join(",");

    const { data } = await supabaseAdmin
      .from("locations")
      .select("*")
      .eq("organization_id", organizationId)
      .or(filters)
      .maybeSingle();

    if (data) return data;
  } catch (error) {
    console.error("No se pudo buscar local por código/nombre exacto:", error);
  }

  const { data } = await supabaseAdmin
    .from("locations")
    .select("*")
    .eq("organization_id", organizationId)
    .ilike("name", `%${localNameFromText}%`)
    .limit(1)
    .maybeSingle();

  return data || null;
}

async function findLocalContact(
  supabaseAdmin: any,
  organizationId: number,
  localId: number | null,
  localCode: string,
  localName: string
) {
  try {
    let query = supabaseAdmin
      .from("local_user_access")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .limit(5);

    const wantedCode = clean(localCode).toLowerCase();
    const wantedName = clean(localName).toLowerCase();

    if (wantedCode) {
      query = query.eq("local_code", localCode);
    } else if (localId) {
      query = query.eq("location_id", localId);
    } else if (wantedName) {
      query = query.ilike("local_name", `%${localName}%`);
    } else {
      return null;
    }

    const { data, error } = await query;

    if (error) {
      console.error("No se pudo buscar contacto local:", error);
      return null;
    }

    const rows = Array.isArray(data) ? data : [];
    const match = rows.find((row: any) => {
      const rowLocalId = parseOptionalNumber(row.location_id || row.local_id);
      const rowCode = clean(row.local_code).toLowerCase();
      const rowName = clean(row.local_name).toLowerCase();

      if (localId && rowLocalId && Number(rowLocalId) === Number(localId)) return true;
      if (wantedCode && rowCode && rowCode === wantedCode) return true;
      if (wantedName && rowName && rowName === wantedName) return true;
      if (wantedName && rowName && rowName.includes(wantedName)) return true;

      return false;
    });

    if (!match) return null;

    const email = clean(match.user_email || match.email || match.contact_email);
    const name = clean(match.user_name || match.name || match.contact_name || email);

    if (!email && !name) return null;

    return {
      row: match,
      name: name || email,
      email,
    };
  } catch (error) {
    console.error("Error buscando contacto local:", error);
    return null;
  }
}

async function safeInsertIncident(supabaseAdmin: any, payload: Record<string, any>) {
  const attempts = [
    payload,
    {
      organization_id: payload.organization_id,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      priority: payload.priority,
      status: payload.status,
      location_id: payload.location_id,
      location_name: payload.location_name,
      reporter_name: payload.reporter_name,
      reporter_email: payload.reporter_email,
      assigned_to: payload.assigned_to,
      assigned_to_email: payload.assigned_to_email,
      report_direction: payload.report_direction,
      photo_url: payload.photo_url,
      target_local_code: payload.target_local_code,
      target_local_name: payload.target_local_name,
      target_local_contact_email: payload.target_local_contact_email,
      target_local_contact_name: payload.target_local_contact_name,
      target_local_can_respond: payload.target_local_can_respond,
      requires_local_response: payload.requires_local_response,
    },
    {
      organization_id: payload.organization_id,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      priority: payload.priority,
      status: payload.status,
      location_id: payload.location_id,
      location_name: payload.location_name,
      reporter_name: payload.reporter_name,
      reporter_email: payload.reporter_email,
      assigned_to: payload.assigned_to,
      assigned_to_email: payload.assigned_to_email,
      report_direction: payload.report_direction,
      photo_url: payload.photo_url,
    },
    {
      organization_id: payload.organization_id,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      priority: payload.priority,
      status: payload.status,
      location_name: payload.location_name,
      reporter_name: payload.reporter_name,
      assigned_to: payload.assigned_to,
      report_direction: payload.report_direction,
    },
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    const { data, error } = await supabaseAdmin
      .from("incidents")
      .insert(attempt)
      .select()
      .single();

    if (!error) return { data, error: null };

    lastError = error;
    console.error("Intento insert Pumay → Local falló:", error.message, attempt);
  }

  return { data: null, error: lastError };
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const formData = await request.formData();

    const organizationId = parseOrgId(
      formData.get("organizationId") ||
        formData.get("organization_id") ||
        formData.get("orgId")
    );

    const rawLocationId = clean(
      formData.get("locationId") ||
        formData.get("localCaseLocationId") ||
        formData.get("targetLocalId") ||
        formData.get("localId")
    );

    const caseType = clean(
      formData.get("caseType") ||
        formData.get("localCaseType") ||
        formData.get("type"),
      "Observación"
    );

    const priority = clean(
      formData.get("priority") ||
        formData.get("localCasePriority"),
      "Media"
    );

    const title = clean(
      formData.get("title") ||
        formData.get("localCaseTitle")
    );

    const description = clean(
      formData.get("description") ||
        formData.get("localCaseDescription")
    );

    const reporterName = clean(
      formData.get("reporterName") ||
        formData.get("createdByName") ||
        formData.get("userName"),
      "Pumay"
    );

    const reporterEmail = clean(
      formData.get("reporterEmail") ||
        formData.get("createdByEmail") ||
        formData.get("userEmail")
    );

    if (!rawLocationId) {
      return NextResponse.json(
        { ok: false, error: "Debes seleccionar un local." },
        { status: 400 }
      );
    }

    if (!title || !description) {
      return NextResponse.json(
        { ok: false, error: "Faltan título o descripción." },
        { status: 400 }
      );
    }

    const location = await findLocation(supabaseAdmin, organizationId, rawLocationId);

    const localId =
      parseOptionalNumber(formData.get("localId")) ||
      parseOptionalNumber(formData.get("locationId")) ||
      parseOptionalNumber(formData.get("localCaseLocationId")) ||
      location?.id ||
      null;

    const localCode =
      clean(formData.get("localCode")) ||
      clean(formData.get("targetLocalCode")) ||
      clean(location?.local_code) ||
      clean(location?.code) ||
      (rawLocationId.includes("·") ? rawLocationId.split("·")[0].trim() : "");

    const localName =
      clean(formData.get("localName")) ||
      clean(formData.get("targetLocalName")) ||
      clean(location?.name) ||
      (rawLocationId.includes("·")
        ? rawLocationId.split("·").slice(1).join("·").trim()
        : rawLocationId);

    const contact = await findLocalContact(
      supabaseAdmin,
      organizationId,
      localId,
      localCode,
      localName
    );

    const contactEmail = contact?.email || "";
    const contactName = contact?.name || contactEmail || "";

    let photoUrl: string | null = null;
    const photo = formData.get("photo") || formData.get("localCasePhoto");

    if (photo instanceof File && photo.size > 0) {
      try {
        const extension = photo.name.split(".").pop() || "jpg";
        const filePath = `pumay-to-local/pumay-local-${organizationId}-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("incident-photos")
          .upload(filePath, photo, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.type || "image/jpeg",
          });

        if (!uploadError) {
          const { data } = supabaseAdmin.storage
            .from("incident-photos")
            .getPublicUrl(filePath);

          photoUrl = data.publicUrl;
        } else {
          console.error("No se pudo subir foto Pumay → Local:", uploadError.message);
        }
      } catch (uploadError) {
        console.error("Error subiendo foto Pumay → Local:", uploadError);
      }
    }

    const payload = {
      organization_id: organizationId,
      title,
      description,
      type: caseType,
      priority,
      status: "Nuevo",
      location_id: localId,
      location_name: localName || "Local no informado",
      reporter_name: reporterName,
      reporter_email: reporterEmail || null,
      assigned_to: localName || "Local",
      assigned_to_email: contactEmail || null,
      report_direction: "pumay_to_local",
      photo_url: photoUrl,
      target_local_code: localCode || null,
      target_local_name: localName || null,
      target_local_contact_email: contactEmail || null,
      target_local_contact_name: contactName || null,
      target_local_can_respond: true,
      requires_local_response: true,
    };

    const { data: incident, error: insertError } = await safeInsertIncident(
      supabaseAdmin,
      payload
    );

    if (insertError) {
      console.error("Error definitivo creando Pumay → Local:", insertError);
      return NextResponse.json(
        {
          ok: false,
          error: insertError.message || "No se pudo insertar en incidents.",
          details: insertError,
          attemptedPayload: payload,
        },
        { status: 500 }
      );
    }

    try {
      await supabaseAdmin.from("incident_logs").insert({
        organization_id: organizationId,
        incident_id: incident.id,
        action: "Caso enviado a local",
        detail: `${reporterName} creó un caso para ${localName || "local"}${
          contactEmail ? `, contacto ${contactEmail}` : ""
        }.`,
        created_by_name: reporterName,
        created_by_email: reporterEmail || null,
      });
    } catch (logError) {
      console.error("No se pudo registrar log Pumay → Local:", logError);
    }

    const notificationResults: Record<string, any> = {};

    try {
      if (contactEmail) {
        const notifyLocalResponse = await fetch(
          new URL("/api/push/notify-local-contact", request.url),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              organizationId,
              localCode,
              localName,
              email: contactEmail,
              title: "FixLoop | Pumay: nuevo caso para tu local",
              body: `${title} · ${localName}`,
              url: "/",
            }),
          }
        );

        notificationResults.local = await notifyLocalResponse
          .json()
          .catch(() => ({ ok: false, error: "Sin respuesta JSON" }));
      } else {
        notificationResults.local = {
          ok: true,
          notified: 0,
          reason: "Caso creado sin contacto local.",
        };
      }
    } catch (notifyError) {
      console.error("No se pudo notificar al contacto local:", notifyError);
      notificationResults.local = {
        ok: false,
        error:
          notifyError instanceof Error
            ? notifyError.message
            : "Error notificando local.",
      };
    }

    try {
      const notifyAdminResponse = await fetch(
        new URL("/api/push/notify-admins", request.url),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            title: "FixLoop | Pumay: caso enviado a local",
            body: `${reporterName} creó un caso para ${localName}: ${title}`,
            url: "/",
          }),
        }
      );

      notificationResults.admins = await notifyAdminResponse
        .json()
        .catch(() => ({ ok: false, error: "Sin respuesta JSON" }));
    } catch (notifyAdminError) {
      console.error("No se pudo notificar a super_admin:", notifyAdminError);
      notificationResults.admins = {
        ok: false,
        error:
          notifyAdminError instanceof Error
            ? notifyAdminError.message
            : "Error notificando super_admin.",
      };
    }

    return NextResponse.json({
      ok: true,
      incident,
      localContact: {
        name: contactName || null,
        email: contactEmail || null,
      },
      notifications: notificationResults,
    });
  } catch (error) {
    console.error("Error general creando Pumay → Local:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el caso para local.",
      },
      { status: 500 }
    );
  }
}
