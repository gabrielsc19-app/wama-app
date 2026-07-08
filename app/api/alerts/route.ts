import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    alerts: [
      {
        id: 1,
        title: "Falla luminaria pasillo central",
        location: "Sucursal Centro",
        area: "Mantención",
        priority: "Alta",
        status: "Nuevo",
      },
      {
        id: 2,
        title: "Revisión cierre de bodega",
        location: "Sucursal Norte",
        area: "Seguridad",
        priority: "Media",
        status: "En proceso",
      },
    ],
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    message: "Alerta creada en WAMA demo.",
    alert: {
      id: Date.now(),
      title: body.title ?? "Nueva alerta",
      location: body.location ?? "Sin ubicación",
      area: body.area ?? "Operaciones",
      priority: body.priority ?? "Media",
      status: "Nuevo",
    },
  });
}
