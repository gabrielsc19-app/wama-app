import { NextResponse } from "next/server";
import { provisionExpenseTrial } from "../../../../src/lib/server/provisionTrial";

export const runtime = "nodejs";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
    };

    if (body.website) return NextResponse.json({ ok: true });

    const companyName = body.companyName?.trim() || "";
    const companyRut = body.companyRut?.trim() || "";
    const ownerName = body.ownerName?.trim() || "";
    const ownerEmail = body.ownerEmail?.trim().toLowerCase() || "";
    const ownerPhone = body.ownerPhone?.trim() || "";

    if (!companyName || !ownerName || !ownerEmail) {
      return NextResponse.json({ error: "Completa empresa, responsable y correo administrador." }, { status: 400 });
    }
    if (!isEmail(ownerEmail)) {
      return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
    }

    const result = await provisionExpenseTrial({
      companyName,
      companyRut,
      ownerName,
      ownerEmail,
      ownerPhone,
      origin: new URL(request.url).origin,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "No se pudo activar la prueba.",
    }, { status: 400 });
  }
}
