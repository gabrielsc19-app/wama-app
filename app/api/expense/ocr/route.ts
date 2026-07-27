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

function normalizeResult(value: unknown): OcrPayload {
  const parsed = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const numberOrNull = (input: unknown) => {
    if (input === null || input === undefined || input === "") return null;
    const numeric = Number(input);
    return Number.isFinite(numeric) ? Math.round(numeric) : null;
  };

  return {
    ...emptyResult(),
    merchant: String(parsed.merchant ?? "").trim(),
    rut: String(parsed.rut ?? "").trim(),
    date: String(parsed.date ?? "").trim(),
    folio: String(parsed.folio ?? "").trim(),
    documentType: String(parsed.documentType ?? "").trim(),
    netAmount: numberOrNull(parsed.netAmount),
    taxAmount: numberOrNull(parsed.taxAmount),
    totalAmount: numberOrNull(parsed.totalAmount),
    suggestedCategory: String(parsed.suggestedCategory ?? "Otros").trim() || "Otros",
    suggestedCostCenter: String(parsed.suggestedCostCenter ?? "Operaciones").trim() || "Operaciones",
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence ?? 0))),
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String).filter(Boolean) : [],
  };
}

function readOutputText(payload: Record<string, unknown>): string {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      return String((item as { text?: unknown }).text ?? "");
    })
    .join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OCR no configurado. Falta OPENAI_API_KEY en Vercel." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes adjuntar una imagen o PDF." }, { status: 400 });
    }

    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera el máximo de 12 MB." }, { status: 413 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Formato no compatible. Usa JPG, PNG, WEBP o PDF." }, { status: 415 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const prompt = [
      "Analiza este comprobante chileno de gasto.",
      "Extrae solo información visible. No inventes valores.",
      "Prioriza el emisor/proveedor del documento, no el cliente receptor.",
      "Para montos usa enteros CLP sin separadores ni símbolos.",
      "La fecha debe quedar en YYYY-MM-DD.",
      "Si un dato no es legible, devuelve cadena vacía o null y agrega una advertencia.",
      "Clasifica la categoría entre: Combustible, Movilización, Alimentación, Alojamiento, Insumos, Servicios u Otros.",
      "Sugiere centro de costo entre: Operaciones, Comercial, Administración, TI o Proyecto.",
    ].join(" ");

    const content = file.type === "application/pdf"
      ? [
          { type: "input_text", text: prompt },
          { type: "input_file", filename: file.name, file_data: dataUrl },
        ]
      : [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: dataUrl, detail: "high" },
        ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50_000);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_OCR_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "expense_document_ocr",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                merchant: { type: "string" },
                rut: { type: "string" },
                date: { type: "string" },
                folio: { type: "string" },
                documentType: { type: "string" },
                netAmount: { anyOf: [{ type: "integer" }, { type: "null" }] },
                taxAmount: { anyOf: [{ type: "integer" }, { type: "null" }] },
                totalAmount: { anyOf: [{ type: "integer" }, { type: "null" }] },
                suggestedCategory: { type: "string" },
                suggestedCostCenter: { type: "string" },
                confidence: { type: "number" },
                warnings: { type: "array", items: { type: "string" } },
              },
              required: [
                "merchant", "rut", "date", "folio", "documentType", "netAmount",
                "taxAmount", "totalAmount", "suggestedCategory", "suggestedCostCenter",
                "confidence", "warnings",
              ],
            },
          },
        },
      }),
    });
    clearTimeout(timeout);

    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const error = payload.error && typeof payload.error === "object"
        ? String((payload.error as { message?: unknown }).message ?? "")
        : "";
      return NextResponse.json(
        { error: error || "No fue posible analizar el documento." },
        { status: response.status },
      );
    }

    const outputText = readOutputText(payload);
    if (!outputText) {
      return NextResponse.json({ error: "El OCR no devolvió resultados." }, { status: 502 });
    }

    const result = normalizeResult(JSON.parse(outputText));
    if (result.totalAmount === null) {
      result.warnings.push("No fue posible identificar con seguridad el total del documento.");
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error
      ? error.name === "AbortError"
        ? "El análisis demoró demasiado. Intenta con una foto más nítida."
        : error.message
      : "Error inesperado de OCR.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
