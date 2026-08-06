import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getWamaAdmin } from "@/src/lib/server/wamaAdmin";

export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "Si existe una cuenta asociada a ese correo, recibirás un código en los próximos minutos.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("Password recovery: falta RESEND_API_KEY");
      return NextResponse.json(
        { error: "El servicio de correo no está disponible. Intenta nuevamente más tarde." },
        { status: 503 },
      );
    }

    const admin = getWamaAdmin();
    const { data, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: "https://www.wamaapp.com/restablecer-clave" },
    });

    // No revelamos si una dirección está o no registrada.
    const otp = data.properties?.email_otp;

    if (linkError || !otp) {
      const normalized = linkError?.message?.toLowerCase() || "";
      if (normalized.includes("user") && normalized.includes("not found")) {
        return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
      }
      console.error("Password recovery: Supabase no generó el código", linkError);
      return NextResponse.json(
        { error: "No pudimos generar el código de recuperación. Intenta nuevamente en unos minutos." },
        { status: 502 },
      );
    }

    const resend = new Resend(resendKey);
    const { error: sendError } = await resend.emails.send({
      from: process.env.WAMA_FROM_EMAIL || "WAMA <no-reply@notificaciones.wamaapp.com>",
      to: email,
      subject: `${otp} es tu código de recuperación WAMA`,
      text: `Tu código de recuperación WAMA es: ${otp}\n\nEscríbelo en WAMA para crear una nueva contraseña. Si no solicitaste este cambio, ignora este correo.`,
      html: recoveryEmail(otp),
    });

    if (sendError) {
      console.error("Password recovery: Resend rechazó el envío", sendError);
      return NextResponse.json(
        { error: "No pudimos enviar el correo. Intenta nuevamente en unos minutos." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Password recovery: error inesperado", error);
    return NextResponse.json(
      { error: "No pudimos procesar la solicitud. Intenta nuevamente en unos minutos." },
      { status: 500 },
    );
  }
}

function recoveryEmail(otp: string) {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#0b0c0e">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e5e9;border-radius:18px;overflow:hidden">
          <tr><td style="background:#0b0c0e;padding:32px;text-align:center">
            <div style="font-size:36px;font-weight:800;letter-spacing:4px;color:#00e5d6">WAMA</div>
            <div style="margin-top:8px;font-size:14px;color:#c4c7cc">Warn and Manage</div>
          </td></tr>
          <tr><td style="padding:40px 34px">
            <h1 style="margin:0 0 18px;font-size:25px;color:#0b0c0e">Recupera tu acceso a WAMA</h1>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#42464d">Recibimos una solicitud para crear una nueva contraseña.</p>
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#42464d">Escribe este código en WAMA para continuar:</p>
            <div style="margin:0 auto 24px;padding:18px 20px;border-radius:12px;background:#f0fffd;text-align:center;font-size:34px;font-weight:800;letter-spacing:10px;color:#0b0c0e">${otp}</div>
            <p style="margin:0 0 26px;font-size:14px;line-height:1.6;color:#737881">El código vence pronto y solo puede utilizarse una vez.</p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#737881">Si no solicitaste este cambio, puedes ignorar el mensaje. Tu contraseña actual seguirá funcionando.</p>
          </td></tr>
          <tr><td style="padding:22px 34px;background:#f5f6f7;text-align:center;font-size:13px;color:#737881">Gestiona tu empresa módulo por módulo.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
