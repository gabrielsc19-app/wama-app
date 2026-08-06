import { NextResponse } from "next/server";
import { provisionTrial, type TrialModuleKey } from "../../../../src/lib/server/provisionTrial";

export const runtime = "nodejs";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function friendlyTrialError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("ya está activado")) return message;
  if (message.includes("No se pudo verificar el correo")) {
    return "No pudimos verificar tu correo en este momento. Intenta nuevamente en unos minutos.";
  }
  return "No pudimos crear tu prueba en este momento. No se realizó ningún cobro. Intenta nuevamente o contáctanos si el problema continúa.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      companyName?: string;
      companyRut?: string;
      ownerName?: string;
      ownerEmail?: string;
      ownerPhone?: string;
      website?: string;
      moduleKey?: TrialModuleKey;
    };

    if (body.website) return NextResponse.json({ ok: true });

    const companyName = body.companyName?.trim() || "";
    const companyRut = body.companyRut?.trim() || "";
    const ownerName = body.ownerName?.trim() || "";
    const ownerEmail = body.ownerEmail?.trim().toLowerCase() || "";
    const ownerPhone = body.ownerPhone?.trim() || "";
    const moduleKey = body.moduleKey === "sales" ? "sales" : "expense";

    if (!companyName || !ownerName || !ownerEmail) {
      return NextResponse.json({ error: "Completa empresa, responsable y correo administrador." }, { status: 400 });
    }
    if (!isEmail(ownerEmail)) {
      return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
    }

    const result = await provisionTrial({
      companyName,
      companyRut,
      ownerName,
      ownerEmail,
      ownerPhone,
      origin: new URL(request.url).origin,
      moduleKey,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[trial/activate] Error al crear la prueba", error);
    return NextResponse.json({
      error: friendlyTrialError(error),
    }, { status: 500 });
  }
}
