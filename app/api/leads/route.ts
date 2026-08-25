import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getWamaAdmin } from "../../../src/lib/server/wamaAdmin";

export const runtime = "nodejs";

type LeadPayload = {
  name?: string;
  company?: string;
  contact?: string;
  email?: string;
  phone?: string;
  need?: string;
  suggestedModule?: string;
  source?: string;
  pageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  website?: string;
};

function normalize(body: Record<string, unknown>): LeadPayload {
  const nested =
    body.lead && typeof body.lead === "object"
      ? (body.lead as Record<string, unknown>)
      : {};

  const text = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

  const contact = text(
    nested.contact ??
      body.contact ??
      body.contacto
  );

  const explicitEmail = text(
    nested.email ??
      body.email ??
      body.correo
  );

  const explicitPhone = text(
    nested.phone ??
      body.phone ??
      body.telefono
  );

  const email =
    explicitEmail ||
    (/\S+@\S+\.\S+/.test(contact) ? contact.toLowerCase() : "");

  const phone =
    explicitPhone ||
    (!email && /\+?\d[\d\s().-]{7,}/.test(contact) ? contact : "");

  return {
    name: text(nested.name ?? body.name),
    company: text(
      nested.company ??
        body.company ??
        body.empresa
    ),
    contact,
    email,
    phone,
    need: text(nested.need ?? body.need ?? body.necesidad),
    suggestedModule: text(
      body.suggestedModule ??
        nested.suggestedModule ??
        body.module
    ),
    source: text(body.source ?? nested.source) || "wama-web",
    pageUrl: text(body.pageUrl ?? body.page_url),
    utmSource: text(body.utmSource ?? body.utm_source),
    utmMedium: text(body.utmMedium ?? body.utm_medium),
    utmCampaign: text(body.utmCampaign ?? body.utm_campaign),
    website: text(body.website),
  };
}

function validEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const lead = normalize(body);

    // Honeypot anti-spam. Respondemos OK para no dar señales al bot.
    if (lead.website) {
      return NextResponse.json({ ok: true, sent: true });
    }

    if (!lead.name || lead.name.length < 2) {
      return NextResponse.json(
        { error: "Ingresa tu nombre." },
        { status: 400 }
      );
    }

    if (!lead.company || lead.company.length < 2) {
      return NextResponse.json(
        { error: "Ingresa el nombre de tu empresa." },
        { status: 400 }
      );
    }

    if (!lead.email && !lead.phone && !lead.contact) {
      return NextResponse.json(
        { error: "Ingresa un correo o teléfono de contacto." },
        { status: 400 }
      );
    }

    if (lead.email && !validEmail(lead.email)) {
      return NextResponse.json(
        { error: "El correo ingresado no es válido." },
        { status: 400 }
      );
    }

    const admin = getWamaAdmin();

    const { data: inserted, error: insertError } = await admin
      .from("wama_marketing_leads")
      .insert({
        name: lead.name,
        company: lead.company,
        contact: lead.contact || lead.email || lead.phone,
        email: lead.email || null,
        phone: lead.phone || null,
        need: lead.need || null,
        suggested_module: lead.suggestedModule || null,
        source: lead.source,
        status: "new",
        metadata: {
          page_url: lead.pageUrl || null,
          utm_source: lead.utmSource || null,
          utm_medium: lead.utmMedium || null,
          utm_campaign: lead.utmCampaign || null,
        },
      })
      .select("id,created_at")
      .single();

    if (insertError) {
      console.error("WAMA leads: no se pudo guardar el lead", insertError);
      return NextResponse.json(
        { error: "No pudimos registrar tus datos. Intenta nuevamente." },
        { status: 500 }
      );
    }

    let sent = false;
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      const resend = new Resend(resendKey);
      const adminEmail =
        process.env.WAMA_LEADS_TO_EMAIL || "contacto@wamaapp.com";
      const from =
        process.env.WAMA_FROM_EMAIL ||
        "WAMA <notificaciones@wamaapp.com>";

      const adminResult = await resend.emails.send({
        from,
        to: adminEmail,
        subject: `Nuevo lead WAMA · ${lead.company}`,
        html: adminLeadEmail(lead),
      });

      if (adminResult.error) {
        console.error(
          "WAMA leads: Resend no pudo notificar al equipo",
          adminResult.error
        );
      } else {
        sent = true;
      }

      if (lead.email) {
        const customerResult = await resend.emails.send({
          from,
          to: lead.email,
          subject: "Recibimos tu consulta sobre WAMA",
          html: customerLeadEmail(lead),
        });

        if (customerResult.error) {
          console.error(
            "WAMA leads: no se pudo enviar confirmación al contacto",
            customerResult.error
          );
        }
      }
    } else {
      console.warn(
        "WAMA leads: lead guardado, pero falta RESEND_API_KEY para notificar por correo."
      );
    }

    return NextResponse.json({
      ok: true,
      sent,
      leadId: inserted.id,
      message:
        "Gracias. Recibimos tus datos y el equipo WAMA podrá contactarte.",
    });
  } catch (error) {
    console.error("WAMA leads: error inesperado", error);
    return NextResponse.json(
      { error: "No pudimos procesar la solicitud. Intenta nuevamente." },
      { status: 500 }
    );
  }
}

function adminLeadEmail(lead: LeadPayload) {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:7px 0;color:#69717d;width:150px">${label}</td><td style="padding:7px 0;font-weight:700;color:#0b0c0e">${escapeHtml(value)}</td></tr>`
      : "";

  return `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#0b0c0e">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e1e5e9;border-radius:18px;overflow:hidden">
        <tr><td style="background:#0b0c0e;padding:28px 32px">
          <div style="font-size:30px;font-weight:800;letter-spacing:3px;color:#00e5d6">WAMA</div>
          <div style="margin-top:6px;color:#c4c7cc">Nuevo contacto comercial</div>
        </td></tr>
        <tr><td style="padding:30px 32px">
          <h1 style="margin:0 0 20px;font-size:24px">Nuevo lead desde ${escapeHtml(lead.source || "wama-web")}</h1>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${row("Nombre", lead.name)}
            ${row("Empresa", lead.company)}
            ${row("Contacto", lead.contact || lead.email || lead.phone)}
            ${row("Necesidad", lead.need)}
            ${row("Módulo", lead.suggestedModule)}
            ${row("UTM source", lead.utmSource)}
            ${row("UTM medium", lead.utmMedium)}
            ${row("UTM campaign", lead.utmCampaign)}
            ${row("Página", lead.pageUrl)}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function customerLeadEmail(lead: LeadPayload) {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#0b0c0e">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e1e5e9;border-radius:18px;overflow:hidden">
        <tr><td style="background:#0b0c0e;padding:28px 32px;text-align:center">
          <div style="font-size:32px;font-weight:800;letter-spacing:3px;color:#00e5d6">WAMA</div>
          <div style="margin-top:6px;color:#c4c7cc">Warn and Manage</div>
        </td></tr>
        <tr><td style="padding:34px 32px">
          <h1 style="margin:0 0 18px;font-size:25px">Gracias, ${escapeHtml(lead.name || "")}.</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#42464d">Recibimos tu consulta sobre WAMA y la empresa <strong>${escapeHtml(lead.company || "")}</strong>.</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#42464d">Revisaremos tu necesidad para orientarte al módulo más adecuado. También puedes comenzar una prueba de 15 días directamente desde WAMA.</p>
          <a href="https://www.wamaapp.com/trial" style="display:inline-block;background:#00e5d6;color:#0b0c0e;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:800">Probar WAMA 15 días</a>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f5f6f7;text-align:center;font-size:13px;color:#737881">Sales Hub · Expense Hub · Operations Hub</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
