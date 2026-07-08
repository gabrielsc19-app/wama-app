import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    message: "Lead recibido en WAMA demo.",
    lead: {
      company: body.company ?? body.empresa ?? null,
      contact: body.contact ?? body.contacto ?? null,
      email: body.email ?? body.correo ?? null,
      phone: body.phone ?? body.telefono ?? null,
      source: "wama-demo",
    },
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    leads: [],
    message: "Endpoint de leads WAMA listo para conectar a Supabase.",
  });
}
