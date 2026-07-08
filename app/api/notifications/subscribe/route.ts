import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    message: "Suscripción de notificación recibida en WAMA demo.",
    subscriptionReceived: Boolean(body),
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Endpoint de notificaciones WAMA listo.",
  });
}
