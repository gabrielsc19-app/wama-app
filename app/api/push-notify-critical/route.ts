import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

type UserProfile = {
  email: string;
  role: string | null;
  active: boolean | null;
  organization_id: number;
};

type PushSubscriptionRow = {
  id?: number | string;
  user_email?: string | null;
  email?: string | null;
  organization_id?: number | null;
  subscription?: any;
  endpoint?: string | null;
  p256dh?: string | null;
  auth?: string | null;
  keys?: any;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const vapidSubject =
  process.env.VAPID_SUBJECT ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "mailto:notificaciones@pumay.cl";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeEmail(value?: string | null) {
  return String(value || "").toLowerCase().trim();
}

function normalizeRole(value?: string | null) {
  return String(value || "").toLowerCase().trim();
}

function buildPushSubscription(row: PushSubscriptionRow) {
  if (row.subscription?.endpoint && row.subscription?.keys) {
    return row.subscription;
  }

  if (row.endpoint && row.keys?.p256dh && row.keys?.auth) {
    return {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.keys.p256dh,
        auth: row.keys.auth,
      },
    };
  }

  if (row.endpoint && row.p256dh && row.auth) {
    return {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan variables VAPID: NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY.",
        },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const body = await request.json().catch(() => ({}));
    const organizationId = Number(body.organizationId || body.organization_id || 1);

    const title = String(body.title || "FixLoop | Pumay").trim();
    const message = String(
      body.body || body.message || "Nueva notificación FixLoop."
    ).trim();
    const url = String(body.url || "/").trim();

    const onlySuperAdmins = Boolean(body.onlySuperAdmins);
    const includeOwners = Boolean(
      body.includeOwners || body.includeOwner || body.notifyOwners
    );

    const supabaseAdmin = getSupabaseAdmin();

    let usersQuery = supabaseAdmin
      .from("users_pumay")
      .select("email, role, active, organization_id")
      .eq("organization_id", organizationId)
      .eq("active", true);

    const { data: usersData, error: usersError } = await usersQuery;

    if (usersError) {
      return NextResponse.json(
        {
          ok: false,
          error: usersError.message || "No se pudieron cargar usuarios.",
          details: usersError,
        },
        { status: 500 }
      );
    }

    const users = (usersData || []) as UserProfile[];

    const targetEmails = new Set(
      users
        .filter((user) => {
          const role = normalizeRole(user.role);

          if (onlySuperAdmins) {
            if (includeOwners) return role === "owner" || role === "super_admin";
            return role === "super_admin";
          }

          return true;
        })
        .map((user) => normalizeEmail(user.email))
        .filter(Boolean)
    );

    if (targetEmails.size === 0) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        failed: 0,
        targetEmails: [],
        message: "No hay usuarios objetivo para notificar.",
      });
    }

    const { data: subscriptionsData, error: subscriptionsError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("organization_id", organizationId);

    if (subscriptionsError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            subscriptionsError.message || "No se pudieron cargar suscripciones push.",
          details: subscriptionsError,
        },
        { status: 500 }
      );
    }

    const subscriptions = ((subscriptionsData || []) as PushSubscriptionRow[]).filter(
      (row) => {
        const email = normalizeEmail(row.user_email || row.email);
        return email && targetEmails.has(email);
      }
    );

    const payload = JSON.stringify({
      title,
      body: message,
      url,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url },
    });

    let sent = 0;
    let failed = 0;
    const staleEndpoints: string[] = [];

    await Promise.all(
      subscriptions.map(async (row) => {
        const subscription = buildPushSubscription(row);

        if (!subscription) {
          failed += 1;
          return;
        }

        try {
          await webpush.sendNotification(subscription, payload);
          sent += 1;
        } catch (error: any) {
          failed += 1;

          const statusCode = Number(error?.statusCode || 0);
          const endpoint = String(subscription?.endpoint || "");

          if ((statusCode === 404 || statusCode === 410) && endpoint) {
            staleEndpoints.push(endpoint);
          }

          console.error("Error enviando push crítico:", error);
        }
      })
    );

    if (staleEndpoints.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      targetEmails: Array.from(targetEmails),
      subscriptions: subscriptions.length,
    });
  } catch (error) {
    console.error("POST /api/push-notify-critical error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron enviar las notificaciones.",
      },
      { status: 500 }
    );
  }
}
