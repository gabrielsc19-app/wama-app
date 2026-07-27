import { NextRequest } from "next/server";
import { json, readRequestJson, supabaseRest } from "../_shared";

export async function GET() {
  const result = await supabaseRest(
    "sales_activities?select=*&order=created_at.desc&limit=50"
  );

  if (!result.ok) {
    return json({ ok: false, data: [], error: result.error, details: result.details }, result.status);
  }

  return json({ ok: true, data: Array.isArray(result.data) ? result.data : [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await readRequestJson(request);

    const payload = {
      organization_id: 1,
      account_id: body.account_id || null,
      deal_id: body.deal_id || null,
      activity_type: body.activity_type || "note",
      title: body.title || "Actividad comercial",
      description: body.description || "",
      created_by: body.created_by || "WAMA",
    };

    const result = await supabaseRest("sales_activities", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      return json({ ok: false, error: result.error, details: result.details }, result.status);
    }

    const created = Array.isArray(result.data) ? result.data[0] : result.data;
    return json({ ok: true, data: created }, 201);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Error creando actividad" }, 500);
  }
}
