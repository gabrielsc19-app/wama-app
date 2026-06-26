import { NextResponse } from "next/server";

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeArea(value: unknown) {
  const raw = normalize(value);

  if (!raw) return "";

  if (raw.includes("comercial")) return "comercial";
  if (raw.includes("aseo")) return "aseo";
  if (raw.includes("seguridad")) return "seguridad";

  if (
    raw.includes("mantencion") ||
    raw.includes("mantención") ||
    raw.includes("mantenimiento")
  ) {
    return "mantencion";
  }

  if (
    raw.includes("operacion") ||
    raw.includes("operación") ||
    raw.includes("operaciones") ||
    raw.includes("coordinador")
  ) {
    return "operaciones";
  }

  if (
    raw.includes("super") ||
    raw.includes("administracion") ||
    raw.includes("administración") ||
    raw.includes("admin")
  ) {
    return "admin";
  }

  if (raw.includes("todos")) return "todos";

  return raw;
}

function resolveAssignedTo(body: Record<string, any>) {
  const assignedEmail = String(
    body.assignedToEmail ||
      body.assigned_to_email ||
      body.userEmail ||
      body.user_email ||
      ""
  )
    .trim()
    .toLowerCase();

  if (assignedEmail) {
    return {
      assignedTo: assignedEmail,
      targetArea: "",
      assignedEmail,
      reason: "email_exact",
    };
  }

  const explicitAssignedTo = String(
    body.assignedTo || body.assigned_to || ""
  ).trim();

  const explicitTargetArea = String(
    body.targetArea ||
      body.target_area ||
      body.responsibleArea ||
      body.responsible_area ||
      body.area ||
      ""
  ).trim();

  const notifyAllInternal =
    body.notifyAllInternal === true ||
    body.notify_all_internal === true ||
    normalize(body.scope) === "todos" ||
    normalize(body.scope) === "all_internal";

  if (notifyAllInternal) {
    return {
      assignedTo: "Todos responsables Pumay",
      targetArea: "todos",
      assignedEmail: "",
      reason: "all_internal",
    };
  }

  const adminOnly =
    body.adminOnly === true ||
    body.admin_only === true ||
    normalize(explicitTargetArea) === "admin" ||
    normalize(explicitAssignedTo).includes("super");

  if (adminOnly) {
    return {
      assignedTo: "Super administración",
      targetArea: "admin",
      assignedEmail: "",
      reason: "admin_only",
    };
  }

  const area = normalizeArea(explicitTargetArea || explicitAssignedTo);

  if (area === "comercial") {
    return {
      assignedTo: "Comercial",
      targetArea: "comercial",
      assignedEmail: "",
      reason: "area_comercial",
    };
  }

  if (area === "mantencion") {
    return {
      assignedTo: "Mantención",
      targetArea: "mantencion",
      assignedEmail: "",
      reason: "area_mantencion",
    };
  }

  if (area === "seguridad") {
    return {
      assignedTo: "Seguridad",
      targetArea: "seguridad",
      assignedEmail: "",
      reason: "area_seguridad",
    };
  }

  if (area === "aseo") {
    return {
      assignedTo: "Aseo",
      targetArea: "aseo",
      assignedEmail: "",
      reason: "area_aseo",
    };
  }

  if (area === "operaciones") {
    return {
      assignedTo: "Operaciones",
      targetArea: "operaciones",
      assignedEmail: "",
      reason: "area_operaciones",
    };
  }

  if (explicitAssignedTo) {
    return {
      assignedTo: explicitAssignedTo,
      targetArea: explicitTargetArea || explicitAssignedTo,
      assignedEmail: "",
      reason: "assigned_to_raw",
    };
  }

  /*
    Fallback conservador:
    Si el código antiguo llama notify-admins sin área, NO enviamos a super_admin
    por defecto ni a todos. Lo tratamos como operación general.
    Owner recibirá igualmente por la regla de notify-assigned.
  */
  return {
    assignedTo: "Operaciones",
    targetArea: "operaciones",
    assignedEmail: "",
    reason: "fallback_operaciones",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const organizationId = Number(body.organizationId || body.organization_id || 1);
    const title = String(body.title || "FixLoop | Pumay").trim();
    const message = String(
      body.body || body.message || "Nueva gestión operacional."
    ).trim();
    const url = String(body.url || "/").trim();

    const resolved = resolveAssignedTo(body);

    /*
      Este endpoint actúa como proxy hacia notify-assigned.
      Ya no fuerza assignedTo = "Super administración".
      Ahora respeta área, responsable o correo exacto para evitar que cada grupo
      vea notificaciones que no le corresponden.
    */
    const response = await fetch(new URL("/api/push/notify-assigned", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId,
        assignedTo: resolved.assignedTo,
        targetArea: resolved.targetArea,
        assignedToEmail: resolved.assignedEmail,
        title,
        body: message,
        url,
      }),
    });

    const result = await response.json().catch(() => ({
      ok: false,
      error: "notify-assigned no devolvió JSON.",
      status: response.status,
    }));

    if (!response.ok || result?.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          source: "notify-admins-proxy-segmented",
          error: result?.error || "No se pudo enviar la notificación segmentada.",
          resolved,
          details: result,
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: "notify-admins-proxy-segmented",
      resolved,
      sent: result.notified ?? result.sent ?? 0,
      failed: result.failed ?? 0,
      totalSubscriptions: result.subscriptionsFound ?? result.totalSubscriptions ?? 0,
      targetEmails: result.targetEmails ?? [],
      details: result,
    });
  } catch (error) {
    console.error("Error notify-admins proxy segmented:", error);

    return NextResponse.json(
      {
        ok: false,
        source: "notify-admins-proxy-segmented",
        error:
          error instanceof Error
            ? error.message
            : "No se pudo notificar a los usuarios internos.",
      },
      { status: 500 }
    );
  }
}
