import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getWamaAdmin } from "../../../../src/lib/server/wamaAdmin";

type ResendEmailEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    bounce?: {
      message?: string;
      type?: string;
      subType?: string;
    };
    error?: {
      message?: string;
    };
  };
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return value;
}

function deliveryState(type: string) {
  const map: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.delivery_delayed": "delayed",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.failed": "failed",
    "email.suppressed": "suppressed",
    "email.opened": "opened",
    "email.clicked": "clicked",
  };
  return map[type] || null;
}

function eventDetail(event: ResendEmailEvent) {
  if (event.type === "email.bounced") {
    return (
      event.data?.bounce?.message ||
      [event.data?.bounce?.type, event.data?.bounce?.subType]
        .filter(Boolean)
        .join(" · ") ||
      "Correo rebotado por el servidor del destinatario."
    );
  }

  if (event.type === "email.failed") {
    return event.data?.error?.message || "Resend informó un fallo de entrega.";
  }

  if (event.type === "email.suppressed") {
    return "El correo fue suprimido por Resend.";
  }

  if (event.type === "email.complained") {
    return "El destinatario o su proveedor marcó el mensaje como no deseado.";
  }

  if (event.type === "email.delivery_delayed") {
    return "El proveedor de correo está demorando temporalmente la entrega.";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const payload = await request.text();

    const id = request.headers.get("svix-id");
    const timestamp = request.headers.get("svix-timestamp");
    const signature = request.headers.get("svix-signature");

    if (!id || !timestamp || !signature) {
      return new NextResponse("Missing webhook headers", { status: 400 });
    }

    const resend = new Resend(required("RESEND_API_KEY"));

    const verified = resend.webhooks.verify({
      payload,
      headers: {
        id,
        timestamp,
        signature,
      },
      webhookSecret: required("RESEND_WEBHOOK_SECRET"),
    }) as ResendEmailEvent;

    const state = deliveryState(verified.type);

    // Ignorar eventos que no alteran trazabilidad de invitaciones.
    if (!state || !verified.data?.email_id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const admin = getWamaAdmin();
    const eventAt =
      verified.created_at ||
      new Date().toISOString();
    const recipient =
      verified.data.to?.[0]?.trim().toLowerCase() || null;

    // Resend garantiza al menos una entrega del webhook y puede repetir eventos.
    // Guardamos svix-id como clave única para que el procesamiento sea idempotente.
    const { error: eventInsertError } = await admin
      .from("wama_email_webhook_events")
      .insert({
        svix_id: id,
        provider: "resend",
        event_type: verified.type,
        provider_message_id: verified.data.email_id,
        recipient_email: recipient,
        event_created_at: eventAt,
        payload: verified,
      });

    if (eventInsertError) {
      const duplicate =
        eventInsertError.code === "23505" ||
        eventInsertError.message.toLowerCase().includes("duplicate");

      if (duplicate) {
        return NextResponse.json({ ok: true, duplicate: true });
      }

      throw eventInsertError;
    }

    const { data: invitation, error: invitationError } = await admin
      .from("wama_invitations")
      .select(
        "tenant_id,email,status,email_last_event_at,email_delivery_status",
      )
      .eq("provider_message_id", verified.data.email_id)
      .maybeSingle();

    if (invitationError) throw invitationError;

    // No todos los correos enviados por WAMA son invitaciones.
    if (!invitation) {
      return NextResponse.json({ ok: true, unmatched: true });
    }

    // Resend no garantiza orden de webhooks. Solo reemplazamos el último evento
    // cuando el evento entrante no es más antiguo.
    const currentAt = invitation.email_last_event_at
      ? new Date(invitation.email_last_event_at).getTime()
      : 0;
    const incomingAt = new Date(eventAt).getTime();

    const update: Record<string, unknown> = {};

    if (!currentAt || incomingAt >= currentAt) {
      update.email_delivery_status = state;
      update.email_last_event_type = verified.type;
      update.email_last_event_at = eventAt;
      update.email_delivery_detail = eventDetail(verified);
    }

    if (verified.type === "email.delivered") {
      update.email_delivered_at = eventAt;
    } else if (verified.type === "email.bounced") {
      update.email_bounced_at = eventAt;
    } else if (verified.type === "email.opened") {
      update.email_opened_at = eventAt;
    } else if (verified.type === "email.clicked") {
      update.email_clicked_at = eventAt;
    }

    if (Object.keys(update).length) {
      const { error: updateError } = await admin
        .from("wama_invitations")
        .update(update)
        .eq("provider_message_id", verified.data.email_id);

      if (updateError) throw updateError;
    }

    return NextResponse.json({
      ok: true,
      emailId: verified.data.email_id,
      event: verified.type,
      state,
    });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return new NextResponse("Invalid or failed webhook", { status: 400 });
  }
}
