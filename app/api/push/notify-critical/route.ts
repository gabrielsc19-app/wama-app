import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
}

if (!supabaseServiceKey) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
}

if (!process.env.VAPID_EMAIL) {
  throw new Error("Falta VAPID_EMAIL en .env.local");
}

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  throw new Error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en .env.local");
}

if (!process.env.VAPID_PRIVATE_KEY) {
  throw new Error("Falta VAPID_PRIVATE_KEY en .env.local");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { organizationId, title, body: notificationBody, url } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Falta organizationId." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Falta title." },
        { status: 400 }
      );
    }

    if (!notificationBody) {
      return NextResponse.json(
        { error: "Falta body." },
        { status: 400 }
      );
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("organization_id", Number(organizationId))
      .eq("active", true);

    if (error) {
      console.error("Error leyendo push_subscriptions:", error);

      return NextResponse.json(
        {
          error: "No se pudieron leer las suscripciones.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    const payload = JSON.stringify({
      title,
      body: notificationBody,
      url: url || "/",
    });

    const results = await Promise.allSettled(
      (subscriptions || []).map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      ok: true,
      sent,
      failed,
    });
  } catch (error) {
    console.error("Error interno notify-critical:", error);

    return NextResponse.json(
      {
        error: "Error interno al enviar notificación.",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}