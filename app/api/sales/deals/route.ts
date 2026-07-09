import { NextRequest } from "next/server";
import { json, readRequestJson, stageProbability, statusForStage, supabaseRest } from "../_shared";

type DealPayload = {
  account_id?: string;
  title?: string;
  stage?: string;
  amount_uf?: number | string;
  assigned_to?: string;
  next_step?: string;
  next_activity_date?: string;
  notes?: string;
  created_by?: string;
};

export async function GET() {
  const result = await supabaseRest(
    "sales_deals?select=*,account:sales_accounts(*)&order=created_at.desc"
  );

  if (!result.ok) {
    return json({ ok: false, data: [], error: result.error, details: result.details }, result.status);
  }

  return json({ ok: true, data: Array.isArray(result.data) ? result.data : [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await readRequestJson(request)) as DealPayload;
    const stage = body.stage || "target_account";
    const probability = stageProbability(stage);
    const amountUf = Number(body.amount_uf || 0);

    const payload = {
      organization_id: 1,
      account_id: body.account_id || null,
      title: body.title || "Nuevo deal",
      stage,
      probability,
      amount_uf: Number.isFinite(amountUf) ? amountUf : 0,
      weighted_amount_uf: Number.isFinite(amountUf) ? (amountUf * probability) / 100 : 0,
      status: statusForStage(stage),
      assigned_to: body.assigned_to || "Comercial",
      next_step: body.next_step || "",
      next_activity_date: body.next_activity_date || null,
      notes: body.notes || "",
      created_by: body.created_by || "WAMA",
    };

    const result = await supabaseRest("sales_deals", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      return json({ ok: false, error: result.error, details: result.details }, result.status);
    }

    const created = Array.isArray(result.data) ? result.data[0] : result.data;
    return json({ ok: true, data: created }, 201);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Error creando deal" }, 500);
  }
}
