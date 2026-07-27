import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    tasks: [
      {
        id: 1,
        title: "Revisión diaria de acceso principal",
        responsible: "Equipo operativo",
        status: "Pendiente",
      },
      {
        id: 2,
        title: "Validar comunicación enviada a sedes",
        responsible: "Supervisor",
        status: "En proceso",
      },
    ],
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    message: "Tarea creada en WAMA demo.",
    task: {
      id: Date.now(),
      title: body.title ?? "Nueva tarea",
      responsible: body.responsible ?? "Equipo operativo",
      status: "Pendiente",
    },
  });
}
