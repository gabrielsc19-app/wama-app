import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type OcrPayload = {
  merchant: string;
  rut: string;
  date: string;
  folio: string;
  documentType: string;
  netAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  suggestedCategory: string;
  suggestedCostCenter: string;
  confidence: number;
  warnings: string[];
};

const emptyResult = (): OcrPayload => ({
  merchant: "",
  rut: "",
  date: "",
  folio: "",
  documentType: "",
  netAmount: null,
  taxAmount: null,
  totalAmount: null,
  suggestedCategory: "Otros",
  suggestedCostCenter: "Operaciones",
  confidence: 0,
  warnings: [],
});

function extractJson(text: string): OcrPayload {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("La IA no devolvió un JSON válido.");
  const parsed = JSON.parse(match[0]);
  return {
    ...emptyResult(),
    ...parsed,
    netAmount: parsed.netAmount == null ? null : Number(parsed.netAmount),
    taxAmount: parsed.taxAmount == null ? null : Number(parsed.taxAmount),
    totalAmount: parsed.totalAmount == null ? null : Number(parsed.totalAmount),
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence ?? 0))),
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OCR no configurado. Agrega OPENAI_API_KEY en Vercel y en .env.local." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes adjuntar una imagen o PDF." }, { status: 400 });
    }

    const maxBytes = 12 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "El archivo supera el máximo de 12 MB." }, { status: 413 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Formato no compatible. Usa JPG, PNG, WEBP o PDF." }, { status: 415 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
    const prompt = `Analiza este comprobante chileno de gasto. Extrae solamente datos visibles; no inventes. Devuelve JSON puro con esta forma exacta:
{
  "merchant": "razón social o comercio",
  "rut": "RUT con dígito verificador",
  "date": "YYYY-MM-DD",
  "folio": "folio o número de documento",
  "documentType": "boleta|factura|voucher|otro",
  "netAmount": 0,
  "taxAmount": 0,
  "totalAmount": 0,
  "suggestedCategory": "Combustible|Movilización|Alimentación|Alojamiento|Insumos|Servicios|Otros",
  "suggestedCostCenter": "Operaciones|Comercial|Administración|TI|Proyecto",
  "confidence": 0,
  "warnings": []
}
Reglas: montos como números enteros en CLP sin puntos ni símbolos; si no se distingue un dato usa cadena vacía o null; confidence de 0 a 100; warnings debe explicar campos dudosos o ilegibles.`;

    const content = file.type === "application/pdf"
      ? [
          { type: "input_text", text: prompt },
          { type: "input_file", filename: file.name, file_data: bytes.toString("base64") },
        ]
      : [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: dataUrl, detail: "high" },
        ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || process.env.OPENAI_OCR_MODEL || "gpt-4.1-mini",
        input: [{ role: "user", content }],
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const apiCode = String(payload?.error?.code || "");
      const apiType = String(payload?.error?.type || "");
      const quota = response.status === 429 || apiCode === "insufficient_quota" || apiType === "insufficient_quota";
      if (quota) {
        return NextResponse.json(
          {
            code: "quota_exceeded",
            error: "La cuenta API de OpenAI no tiene saldo disponible. Activa facturación o aumenta el límite mensual y vuelve a intentar.",
          },
          { status: 429 },
        );
      }
      const detail = payload?.error?.message || "No fue posible analizar el documento.";
      return NextResponse.json({ code: "ocr_failed", error: detail }, { status: response.status });
    }

    const outputText = payload.output_text || payload.output?.flatMap((item: any) => item.content || []).map((item: any) => item.text || "").join("\n") || "";
    const result = extractJson(outputText);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado de OCR.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
