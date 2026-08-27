import { NextResponse } from "next/server";
import {
  getOperationsContext,
  operationsError,
} from "../../../../src/lib/server/operationsAccess";

function fail(error: unknown) {
  const value = operationsError(error);
  return NextResponse.json({ error: value.message }, { status: value.status });
}

export async function GET(request: Request) {
  try {
    const context = await getOperationsContext(request);
    const publicKey =
      process.env.VAPID_PUBLIC_KEY?.trim() ||
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
      "";

    const { data:subscriptions, count } = await context.admin
      .from("wama_operations_push_subscriptions")
      .select(
        "id,endpoint,user_agent,last_seen_at,created_at,revoked_at",
        { count: "exact" },
      )
      .eq("tenant_id", context.tenantId)
      .eq("profile_id", context.profile.id)
      .is("revoked_at", null)
      .order("last_seen_at", { ascending: false });

    return NextResponse.json({
      configured: Boolean(publicKey && process.env.VAPID_PRIVATE_KEY),
      publicKey,
      subscribed: Boolean(count),
      subscriptions: subscriptions || [],
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOperationsContext(request);
    const body = (await request.json()) as {
      subscription?: PushSubscriptionJSON;
      userAgent?: string;
    };

    if (!body.subscription?.endpoint) {
      return NextResponse.json(
        { error: "Suscripción push no válida." },
        { status: 400 },
      );
    }

    const { error } = await context.admin
      .from("wama_operations_push_subscriptions")
      .upsert(
        {
          tenant_id: context.tenantId,
          profile_id: context.profile.id,
          endpoint: body.subscription.endpoint,
          subscription: body.subscription,
          user_agent: body.userAgent || null,
          last_seen_at: new Date().toISOString(),
          revoked_at: null,
        },
        { onConflict: "profile_id,endpoint" },
      );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getOperationsContext(request);
    const body = (await request.json()) as { endpoint?: string };

    if (!body.endpoint) {
      return NextResponse.json(
        { error: "Falta identificar la suscripción." },
        { status: 400 },
      );
    }

    const { error } = await context.admin
      .from("wama_operations_push_subscriptions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("tenant_id", context.tenantId)
      .eq("profile_id", context.profile.id)
      .eq("endpoint", body.endpoint);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
