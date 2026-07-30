import { NextRequest, NextResponse } from "next/server";
import { sendWamaEmail } from "@/src/lib/server/googleGmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const expected = process.env.WAMA_PILOT_SETUP_SECRET?.trim();
    const received = request.headers.get("x-wama-setup-secret")?.trim();
    if (!expected || !received || expected !== received) return NextResponse.json({ok:false,error:"No autorizado"},{status:401});
    const body = await request.json() as {to?:string};
    if (!body.to?.trim()) return NextResponse.json({ok:false,error:"Falta el campo to"},{status:400});
    const result = await sendWamaEmail({
      to:body.to.trim(),
      subject:"WAMA Gmail conectado correctamente",
      html:'<div style="font-family:Arial;background:#0b0c0e;color:#fff;padding:32px"><div style="max-width:620px;margin:auto;background:#17191c;border-radius:20px;padding:32px"><div style="color:#00e5d6;font-size:12px;font-weight:800;letter-spacing:.14em">PRUEBA DE INTEGRACIÓN</div><h1>WAMA ya puede enviar correos.</h1><p style="color:#c4c7cc">Este mensaje fue enviado mediante Gmail API desde contacto@wamaapp.com.</p></div></div>',
      text:"WAMA ya puede enviar correos mediante Gmail API.",
    });
    return NextResponse.json({ok:true,...result});
  } catch (error) {
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Error desconocido"},{status:500});
  }
}
