import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ProposalRow = {
  id: number;
  organization_id: number;
  week_number: number;
  week_start: string;
  week_end: string;
  status: string;
  prepared_by_name: string | null;
  prepared_by_email: string | null;
  approved_by_gabriel_name: string | null;
  approved_by_gabriel_email: string | null;
  proposed_count: number;
  proposed_amount: number;
  overdue_count: number;
  overdue_amount: number;
  due_this_week_count: number;
  due_this_week_amount: number;
  reprogrammable_count: number;
  reprogrammable_amount: number;
  excluded_paid_count: number;
  excluded_paid_amount: number;
  excluded_duplicate_count: number;
  excluded_duplicate_amount: number;
};

type ProposalItemRow = {
  supplier_name: string;
  supplier_rut: string | null;
  company_name: string | null;
  invoice_folio: string;
  due_date: string | null;
  scheduled_payment_date: string | null;
  amount: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRecipients(action: string) {
  const gabrielEmail = process.env.PAYMENTS_GABRIEL_EMAIL || "gsanchez@pumay.cl";
  const claudioEmail = process.env.PAYMENTS_CLAUDIO_EMAIL || "cdieterich@pumay.cl";

  if (action === "to_claudio") {
    return {
      to: claudioEmail,
      cc: gabrielEmail,
      label: "Claudio",
    };
  }

  return {
    to: gabrielEmail,
    cc: "",
    label: "Gabriel",
  };
}

function buildEmail({
  action,
  proposal,
  items,
}: {
  action: string;
  proposal: ProposalRow;
  items: ProposalItemRow[];
}) {
  const period = `Semana ${proposal.week_number} (${formatDate(proposal.week_start)} al ${formatDate(
    proposal.week_end,
  )})`;

  const isToClaudio = action === "to_claudio";

  const subject = isToClaudio
    ? `Pumay | Pago autorizado proveedores - ${period}`
    : `Pumay | Propuesta de pago proveedores - ${period}`;

  const intro = isToClaudio
    ? `Gabriel aprobó la propuesta de pago a proveedores. Se envía a Claudio para ejecución de pago masivo en banco.`
    : `Verónica cargó las facturas y cartola. FixLoop validó la información y generó la propuesta para aprobación de Gabriel.`;

  const rows = items
    .slice(0, 25)
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.supplier_name)}</td>
          <td>${escapeHtml(item.supplier_rut || "-")}</td>
          <td>${escapeHtml(item.company_name || "-")}</td>
          <td>${escapeHtml(item.invoice_folio)}</td>
          <td>${formatDate(item.scheduled_payment_date || item.due_date)}</td>
          <td style="text-align:right;font-weight:700;">${formatMoney(Number(item.amount || 0))}</td>
        </tr>
      `,
    )
    .join("");

  const extraRows =
    items.length > 25
      ? `<p style="margin:12px 0 0;color:#475569;">Se muestran 25 facturas de ${items.length}. El detalle completo queda registrado en el módulo Cuentas por pagar.</p>`
      : "";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f1f5f9;padding:24px;color:#0f172a;">
      <div style="max-width:980px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(90deg,#020617,#0f172a,#005A7F);padding:24px;color:white;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:800;color:#fde68a;">
            Cuentas por pagar
          </p>
          <h1 style="margin:0;font-size:28px;">${escapeHtml(period)}</h1>
          <p style="margin:8px 0 0;color:#e2e8f0;">${escapeHtml(intro)}</p>
        </div>

        <div style="padding:24px;">
          <h2 style="margin:0 0 12px;font-size:20px;">Resumen de propuesta</h2>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:10px;border:1px solid #e2e8f0;background:#ecfdf5;font-weight:700;">Total propuesto</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;font-weight:800;">${formatMoney(
                Number(proposal.proposed_amount || 0),
              )}</td>
            </tr>
            <tr>
              <td style="padding:10px;border:1px solid #e2e8f0;">Facturas incluidas</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;">${proposal.proposed_count}</td>
            </tr>
            <tr>
              <td style="padding:10px;border:1px solid #e2e8f0;">Vencidas incluidas</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;">${proposal.overdue_count} · ${formatMoney(
                Number(proposal.overdue_amount || 0),
              )}</td>
            </tr>
            <tr>
              <td style="padding:10px;border:1px solid #e2e8f0;">Semana actual</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;">${proposal.due_this_week_count} · ${formatMoney(
                Number(proposal.due_this_week_amount || 0),
              )}</td>
            </tr>
            <tr>
              <td style="padding:10px;border:1px solid #e2e8f0;">Reprogramables</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;">${proposal.reprogrammable_count} · ${formatMoney(
                Number(proposal.reprogrammable_amount || 0),
              )}</td>
            </tr>
            <tr>
              <td style="padding:10px;border:1px solid #e2e8f0;">Excluidas por cartola</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;">${proposal.excluded_paid_count} · ${formatMoney(
                Number(proposal.excluded_paid_amount || 0),
              )}</td>
            </tr>
            <tr>
              <td style="padding:10px;border:1px solid #e2e8f0;">Duplicadas detectadas</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;">${proposal.excluded_duplicate_count} · ${formatMoney(
                Number(proposal.excluded_duplicate_amount || 0),
              )}</td>
            </tr>
          </table>

          <h2 style="margin:20px 0 12px;font-size:20px;">Detalle para pago</h2>

          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left;padding:9px;border:1px solid #e2e8f0;">Proveedor</th>
                <th style="text-align:left;padding:9px;border:1px solid #e2e8f0;">RUT</th>
                <th style="text-align:left;padding:9px;border:1px solid #e2e8f0;">Sociedad</th>
                <th style="text-align:left;padding:9px;border:1px solid #e2e8f0;">Folio</th>
                <th style="text-align:left;padding:9px;border:1px solid #e2e8f0;">Vencimiento</th>
                <th style="text-align:right;padding:9px;border:1px solid #e2e8f0;">Monto</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="6" style="padding:12px;border:1px solid #e2e8f0;">Sin facturas incluidas.</td></tr>`}</tbody>
          </table>

          ${extraRows}

          <div style="margin-top:22px;padding:16px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;">
            ${
              isToClaudio
                ? "Acción requerida: Claudio debe ejecutar el pago masivo en el banco con esta propuesta autorizada."
                : "Acción requerida: Gabriel debe revisar y aprobar la propuesta en el módulo Cuentas por pagar."
            }
          </div>
        </div>
      </div>
    </div>
  `;

  const text = `${subject}

${intro}

Total propuesto: ${formatMoney(Number(proposal.proposed_amount || 0))}
Facturas incluidas: ${proposal.proposed_count}
Vencidas incluidas: ${proposal.overdue_count}
Semana actual: ${proposal.due_this_week_count}
Reprogramables: ${proposal.reprogrammable_count}
Excluidas por cartola: ${proposal.excluded_paid_count}
Duplicadas: ${proposal.excluded_duplicate_count}

Detalle completo disponible en el módulo Cuentas por pagar.`;

  return { subject, html, text };
}

async function sendResendEmail({
  to,
  cc,
  subject,
  html,
  text,
}: {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY en variables de entorno.");
  }

  const from =
    process.env.RESEND_FROM_EMAIL ||
    process.env.MAIL_FROM ||
    "Pumay <notificaciones@fixloop.com>";

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    html,
    text,
  };

  if (cc) payload.cc = [cc];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof result?.message === "string"
        ? result.message
        : "Resend no pudo enviar el correo.",
    );
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const proposalId = Number(body.proposalId || body.proposal_id);
    const action = String(body.action || "to_gabriel");

    if (!proposalId) {
      return NextResponse.json(
        { ok: false, error: "Falta proposalId." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: proposalData, error: proposalError } = await supabaseAdmin
      .from("supplier_payment_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposalData) {
      return NextResponse.json(
        { ok: false, error: proposalError?.message || "No existe la propuesta." },
        { status: 404 },
      );
    }

    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from("supplier_payment_proposal_items")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("supplier_name", { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        { ok: false, error: itemsError.message },
        { status: 500 },
      );
    }

    const proposal = proposalData as ProposalRow;
    const items = (itemsData || []) as ProposalItemRow[];

    const recipients = getRecipients(action);
    const email = buildEmail({ action, proposal, items });

    const resendResult = await sendResendEmail({
      to: recipients.to,
      cc: recipients.cc,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    return NextResponse.json({
      ok: true,
      to: recipients.to,
      cc: recipients.cc,
      resend: resendResult,
    });
  } catch (error) {
    console.error("Error enviando correo de propuesta:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el correo de propuesta.",
      },
      { status: 500 },
    );
  }
}
