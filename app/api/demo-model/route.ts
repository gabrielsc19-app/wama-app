import { NextResponse } from "next/server";

function calculatePrice(users: number, modules: number) {
  const blocks = Math.max(1, Math.ceil(users / 10));
  return blocks * 10 * Math.max(1, modules);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const users = Number(body.users ?? body.usuarios ?? 10);
  const locations = Number(body.locations ?? body.sedes ?? 1);
  const areas = Array.isArray(body.areas) ? body.areas : [];

  const recommendedModules = [
    "Generar Casos",
    "Control de Tareas",
    ...(locations > 1 ? ["Clientes / sedes"] : []),
    ...(areas.includes("Comercial") ? ["Seguimiento Comercial"] : []),
    ...(areas.includes("Contabilidad") ? ["Consolidación Banco"] : []),
    "Reportes Ejecutivos",
  ];

  return NextResponse.json({
    ok: true,
    recommendedModules,
    users,
    locations,
    estimatedMonthlyUsd: calculatePrice(users, recommendedModules.length),
    implementation: [
      "Semana 1: configuración de empresa, sedes y usuarios.",
      "Semana 2: activación de módulos y capacitación.",
      "Semana 3: marcha blanca y ajustes operativos.",
    ],
  });
}
