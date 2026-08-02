import { NextResponse } from "next/server";
import { provisionTrial, type TrialModuleKey } from "../../../../src/lib/server/provisionTrial";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      secret?: string;
      companyName?: string;
      companyRut?: string;
      ownerName?: string;
      ownerEmail?: string;
      ownerPhone?: string;
      moduleKey?: TrialModuleKey;
    };

    if (!process.env.WAMA_PILOT_SETUP_SECRET || body.secret !== process.env.WAMA_PILOT_SETUP_SECRET) {
      return NextResponse.json({ error: "Clave de habilitación incorrecta." }, { status: 403 });
    }

    const companyName = body.companyName?.trim() || "";
    const ownerName = body.ownerName?.trim() || "";
    const ownerEmail = body.ownerEmail?.trim().toLowerCase() || "";
    if (!companyName || !ownerName || !ownerEmail) {
      return NextResponse.json({ error: "Completa empresa, responsable y correo." }, { status: 400 });
    }

    const result = await provisionTrial({
      companyName,
      companyRut: body.companyRut?.trim(),
      ownerName,
      ownerEmail,
      ownerPhone: body.ownerPhone?.trim(),
      origin: new URL(request.url).origin,
      moduleKey: body.moduleKey === "sales" ? "sales" : "expense",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado." }, { status: 400 });
  }
}
