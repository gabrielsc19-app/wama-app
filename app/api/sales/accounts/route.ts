import { NextRequest } from "next/server";
import { json, readRequestJson, supabaseRest } from "../_shared";

type AccountPayload = {
  company_name?: string;
  brand_name?: string;
  website?: string;
  industry?: string;
  source?: string;
  initial_comment?: string;
  assigned_to?: string;
  created_by?: string;
};

export async function GET() {
  const result = await supabaseRest(
    "sales_accounts?select=*&order=created_at.desc"
  );

  if (!result.ok) {
    return json({ ok: false, data: [], error: result.error, details: result.details }, result.status);
  }

  return json({ ok: true, data: Array.isArray(result.data) ? result.data : [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await readRequestJson(request)) as AccountPayload;

    const payload = {
      organization_id: 1,
      company_name: body.company_name || body.brand_name || "Empresa sin nombre",
      brand_name: body.brand_name || body.company_name || "Marca sin nombre",
      website: body.website || "",
      industry: body.industry || "",
      source: body.source || "WAMA",
      initial_comment: body.initial_comment || "",
      assigned_to: body.assigned_to || "Comercial",
      created_by: body.created_by || "WAMA",
    };

    const result = await supabaseRest("sales_accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      return json({ ok: false, error: result.error, details: result.details }, result.status);
    }

    const created = Array.isArray(result.data) ? result.data[0] : result.data;
    return json({ ok: true, data: created }, 201);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Error creando cuenta" }, 500);
  }
}
