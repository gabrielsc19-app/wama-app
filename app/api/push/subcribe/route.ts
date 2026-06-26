import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
}

if (!supabaseServiceKey) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Ruta subscribe funcionando",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { subscription, userEmail, organizationId, userAgent } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: "Falta subscription." },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "Falta userEmail." },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Falta organizationId." },
        { status: 400 }
      );
    }

    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        {
          error: "Suscripción push inválida.",
          detail: {
            hasEndpoint: Boolean(endpoint),
            hasP256dh: Boolean(p256dh),
            hasAuth: Boolean(auth),
          },
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_email: userEmail,
        organization_id: Number(organizationId),
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent || null,
        active: true,
      },
      {
        onConflict: "endpoint",
      }
    );

    if (error) {
      console.error("Error Supabase push_subscriptions:", error);

      return NextResponse.json(
        {
          error: "No se pudo guardar la suscripción en Supabase.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Suscripción push guardada correctamente.",
    });
  } catch (error) {
    console.error("Error interno subscribe:", error);

    return NextResponse.json(
      {
        error: "Error interno al guardar suscripción.",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}