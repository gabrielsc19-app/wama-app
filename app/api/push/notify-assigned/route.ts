import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

type UserPumay = {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
  active: boolean | null;
  organization_id: number | null;
};

type PushSubscriptionRow = {
  id: string;
  user_email: string | null;
  organization_id: number | null;
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
};

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function uniqueEmails(values: string[]) {
  return Array.from(new Set(values.map(normalizeEmail).filter(Boolean)));
}

function getVapidKeys() {
  return {
    publicKey:
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      process.env.VAPID_PUBLIC_KEY ||
      "",
    privateKey:
      process.env.VAPID_PRIVATE_KEY ||
      process.env.WEB_PUSH_PRIVATE_KEY ||
      "",
    subject:
      process.env.VAPID_SUBJECT ||
      process.env.WEB_PUSH_SUBJECT ||
      "mailto:contacto@pumay.cl",
  };
}

function normalizeArea(value: unknown) {
  const raw = normalize(value);

  if (!raw) return "";

  if (raw.includes("comercial")) return "comercial";
  if (raw.includes("aseo")) return "aseo";
  if (raw.includes("seguridad")) return "seguridad";

  if (
    raw.includes("mantencion") ||
    raw.includes("mantenimiento") ||
    raw.includes("mantencion")
  ) {
    return "mantencion";
  }

  if (
    raw.includes("operacion") ||
    raw.includes("operaciones") ||
    raw.includes("coordinador")
  ) {
    return "operaciones";
  }

  if (
    raw.includes("super") ||
    raw.includes("administracion") ||
    raw.includes("admin") ||
    raw.includes("owner") ||
    raw.includes("dueno") ||
    raw.includes("dueño")
  ) {
    return "admin";
  }

  if (raw.includes("todos")) return "todos";

  return raw;
}

function isInternalPumayRole(role: string | null) {
  const roleNorm = normalize(role);

  return [
    "owner",
    "super_admin",
    "admin",
    "operaciones",
    "operacion",
    "coordinador",
    "jefe_operaciones",
    "mantencion",
    "mantenimiento",
    "jefe_mantencion",
    "seguridad",
    "aseo",
    "comercial",
  ].includes(roleNorm);
}

function roleArea(role: string | null) {
  const roleNorm = normalize(role);

  if (roleNorm === "owner") return "owner";
  if (roleNorm === "super_admin" || roleNorm === "admin") return "admin";
  if (
    roleNorm === "operaciones" ||
    roleNorm === "operacion" ||
    roleNorm === "coordinador" ||
    roleNorm === "jefe_operaciones"
  ) {
    return "operaciones";
  }
  if (
    roleNorm === "mantencion" ||
    roleNorm === "mantenimiento" ||
    roleNorm === "jefe_mantencion"
  ) {
    return "mantencion";
  }
  if (roleNorm === "seguridad") return "seguridad";
  if (roleNorm === "aseo") return "aseo";
  if (roleNorm === "comercial") return "comercial";

  return roleNorm;
}

function shouldNotifyUser(params: {
  user: UserPumay;
  assignedTo: string;
  targetArea: string;
  assignedEmail: string;
}) {
  const { user, assignedTo, targetArea, assignedEmail } = params;

  const userEmail = normalizeEmail(user.email);
  const userRole = normalize(user.role);
  const userArea = roleArea(user.role);
  const assignedNorm = normalize(assignedTo);
  const assignedArea = normalizeArea(targetArea || assignedTo);

  if (!userEmail || !isInternalPumayRole(user.role)) return false;

  // Owner controla todo FixLoop y recibe todas las notificaciones internas.
  if (userRole === "owner") return true;

  // Si se asigna a un correo exacto, solo recibe ese correo.
  // No se dispara a áreas completas ni a super_admin por defecto.
  if (assignedEmail || assignedNorm.includes("@")) {
    const destinationEmail = assignedEmail || assignedNorm;
    return userEmail === destinationEmail;
  }

  // "Todos responsables Pumay" se usa para operación general interna.
  // Se notifica a todos los roles internos activos.
  if (assignedArea === "todos" || assignedNorm.includes("todos")) {
    return isInternalPumayRole(user.role);
  }

  // Administración / super administración:
  // solo super_admin/admin, además de owner que ya fue incluido arriba.
  if (assignedArea === "admin") {
    return userRole === "super_admin" || userRole === "admin";
  }

  // Áreas específicas: cada área recibe solo lo suyo.
  // Comercial queda estrictamente limitado a comercial.
  if (assignedArea === "comercial") return userArea === "comercial";
  if (assignedArea === "seguridad") return userArea === "seguridad";
  if (assignedArea === "aseo") return userArea === "aseo";
  if (assignedArea === "mantencion") return userArea === "mantencion";
  if (assignedArea === "operaciones") return userArea === "operaciones";

  return false;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          ok: false,
          step: "env",
          error: "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    const { publicKey, privateKey, subject } = getVapidKeys();

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        {
          ok: false,
          step: "vapid",
          error:
            "Faltan llaves VAPID. Revisa NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.",
        },
        { status: 500 }
      );
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          step: "setVapidDetails",
          error:
            error instanceof Error
              ? error.message
              : "No se pudieron configurar las llaves VAPID.",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const organizationId = Number(body.organizationId || body.organization_id || 1);
    const assignedTo = String(body.assignedTo || body.assigned_to || "").trim();
    const targetArea = String(
      body.targetArea ||
        body.target_area ||
        body.responsibleArea ||
        body.responsible_area ||
        assignedTo ||
        ""
    ).trim();
    const assignedEmail = normalizeEmail(
      body.assignedToEmail ||
        body.assigned_to_email ||
        body.userEmail ||
        body.user_email ||
        ""
    );
    const title = String(body.title || "FixLoop | Pumay").trim();
    const message = String(
      body.body || body.message || "Tienes una nueva gestión asignada."
    ).trim();
    const url = String(body.url || "/").trim();

    if (!assignedTo && !targetArea && !assignedEmail) {
      return NextResponse.json(
        {
          ok: false,
          step: "validation",
          error: "Falta assignedTo, targetArea o assignedToEmail.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: users, error: usersError } = await supabaseAdmin
      .from("users_pumay")
      .select("id,name,email,role,active,organization_id")
      .eq("organization_id", organizationId)
      .eq("active", true);

    if (usersError) {
      return NextResponse.json(
        {
          ok: false,
          step: "users_pumay",
          error: usersError.message,
          details: usersError,
        },
        { status: 500 }
      );
    }

    const usersList = (users || []) as UserPumay[];

    const targetEmails = uniqueEmails(
      usersList
        .filter((user) =>
          shouldNotifyUser({
            user,
            assignedTo,
            targetArea,
            assignedEmail,
          })
        )
        .map((user) => user.email || "")
    );

    if (targetEmails.length === 0) {
      return NextResponse.json({
        ok: true,
        step: "no_target_users",
        assignedTo,
        targetArea,
        assignedEmail,
        targetEmails: [],
        subscriptionsFound: 0,
        notified: 0,
        failed: 0,
        reason: "No se encontraron usuarios activos para ese responsable o área.",
      });
    }

    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,user_email,organization_id,endpoint,p256dh,auth")
      .eq("organization_id", organizationId)
      .in("user_email", targetEmails);

    if (subscriptionsError) {
      return NextResponse.json(
        {
          ok: false,
          step: "push_subscriptions",
          error: subscriptionsError.message,
          details: subscriptionsError,
          targetEmails,
        },
        { status: 500 }
      );
    }

    const rows = ((subscriptions || []) as PushSubscriptionRow[]).filter(
      (row) => row.endpoint && row.p256dh && row.auth
    );

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        step: "no_subscriptions",
        assignedTo,
        targetArea,
        assignedEmail,
        targetEmails,
        subscriptionsFound: 0,
        notified: 0,
        failed: 0,
        reason:
          "Los usuarios existen, pero no tienen suscripciones push activas/completas.",
      });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      url,
      data: {
        url,
        assignedTo,
        targetArea: normalizeArea(targetArea || assignedTo),
        assignedEmail,
        organizationId,
      },
    });

    const results = await Promise.all(
      rows.map(async (row) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: row.endpoint || "",
              keys: {
                p256dh: row.p256dh || "",
                auth: row.auth || "",
              },
            },
            payload
          );

          return {
            ok: true,
            id: row.id,
            user_email: row.user_email,
          };
        } catch (error: any) {
          const statusCode = error?.statusCode || null;
          const errorMessage =
            error instanceof Error ? error.message : String(error || "Error push");

          if (statusCode === 404 || statusCode === 410) {
            await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .eq("id", row.id);
          }

          return {
            ok: false,
            id: row.id,
            user_email: row.user_email,
            statusCode,
            error: errorMessage,
          };
        }
      })
    );

    const notified = results.filter((item) => item.ok).length;
    const failed = results.length - notified;

    return NextResponse.json({
      ok: true,
      step: "sent",
      assignedTo,
      targetArea,
      assignedEmail,
      targetEmails,
      subscriptionsFound: rows.length,
      notified,
      failed,
      results,
    });
  } catch (error) {
    console.error("Error notify-assigned:", error);

    return NextResponse.json(
      {
        ok: false,
        step: "catch",
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la notificación asignada.",
      },
      { status: 500 }
    );
  }
}
