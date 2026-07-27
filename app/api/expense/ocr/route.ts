import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type FieldConfidence = {
  merchant: number;
  rut: number;
  date: number;
  folio: number;
  totalAmount: number;
};

type ChileanOcrPayload = {
  merchant: string;
  rut: string;
  receiverName: string;
  receiverRut: string;
  date: string;
  folio: string;
  documentType: string;
  siiDocumentCode: number | null;
  netAmount: number | null;
  exemptAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  currency: "CLP" | "UF" | "USD" | "OTHER";
  paymentMethod: string;
  suggestedCategory: string;
  suggestedCostCenter: string;
  confidence: number;
  fieldConfidence: FieldConfidence;
  warnings: string[];
  rutValid: boolean | null;
  totalsMatch: boolean | null;
  reviewRequired: boolean;
  validationStatus: "validated" | "review" | "invalid";
  duplicateKey: string;
  engine: string;
};

const emptyResult = (): ChileanOcrPayload => ({
  merchant: "",
  rut: "",
  receiverName: "",
  receiverRut: "",
  date: "",
  folio: "",
  documentType: "otro",
  siiDocumentCode: null,
  netAmount: null,
  exemptAmount: null,
  taxAmount: null,
  totalAmount: null,
  currency: "CLP",
  paymentMethod: "",
  suggestedCategory: "Otros",
  suggestedCostCenter: "Operaciones",
  confidence: 0,
  fieldConfidence: { merchant: 0, rut: 0, date: 0, folio: 0, totalAmount: 0 },
  warnings: [],
  rutValid: null,
  totalsMatch: null,
  reviewRequired: true,
  validationStatus: "review",
  duplicateKey: "",
  engine: "WAMA Chile DTE Engine v1",
});

const DOCUMENT_TYPES: Record<number, string> = {
  33: "factura electrónica",
  34: "factura exenta electrónica",
  39: "boleta electrónica",
  41: "boleta exenta electrónica",
  52: "guía de despacho electrónica",
  56: "nota de débito electrónica",
  61: "nota de crédito electrónica",
};

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(/[^0-9-]/g, "");
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function normalizeRut(raw: unknown): string {
  const clean = String(raw ?? "").toUpperCase().replace(/[^0-9K]/g, "");
  if (clean.length < 2) return "";
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

function validateRut(rut: string): boolean | null {
  const clean = rut.toUpperCase().replace(/[^0-9K]/g, "");
  if (clean.length < 2) return null;
  const body = clean.slice(0, -1);
  const supplied = clean.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return expected === supplied;
}

function normalizeDate(raw: unknown): string {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const latam = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (latam) {
    const year = latam[3].length === 2 ? `20${latam[3]}` : latam[3];
    return `${year}-${latam[2].padStart(2, "0")}-${latam[1].padStart(2, "0")}`;
  }
  return text;
}

function calculateTotalsMatch(net: number | null, exempt: number | null, tax: number | null, total: number | null): boolean | null {
  if (total === null) return null;
  if (net === null && exempt === null && tax === null) return null;
  const calculated = (net ?? 0) + (exempt ?? 0) + (tax ?? 0);
  return Math.abs(calculated - total) <= 2;
}

function buildDuplicateKey(result: ChileanOcrPayload): string {
  const source = [result.rut, result.documentType, result.folio, result.date, result.totalAmount ?? ""].join("|");
  return createHash("sha256").update(source).digest("hex").slice(0, 24);
}

function normalizeDocumentType(rawType: unknown, rawCode: unknown): { type: string; code: number | null } {
  const code = numberOrNull(rawCode);
  if (code && DOCUMENT_TYPES[code]) return { type: DOCUMENT_TYPES[code], code };
  const text = String(rawType ?? "").toLowerCase();
  if (text.includes("nota de crédito")) return { type: "nota de crédito electrónica", code: 61 };
  if (text.includes("nota de débito")) return { type: "nota de débito electrónica", code: 56 };
  if (text.includes("guía")) return { type: "guía de despacho electrónica", code: 52 };
  if (text.includes("factura") && text.includes("exenta")) return { type: "factura exenta electrónica", code: 34 };
  if (text.includes("factura")) return { type: "factura electrónica", code: 33 };
  if (text.includes("boleta") && text.includes("exenta")) return { type: "boleta exenta electrónica", code: 41 };
  if (text.includes("boleta")) return { type: "boleta electrónica", code: 39 };
  if (text.includes("voucher") || text.includes("transbank")) return { type: "voucher", code: null };
  return { type: text || "otro", code: code ?? null };
}

function clampConfidence(value: unknown): number {
  return Math.max(0, Math.min(100, Number(value ?? 0)));
}

function normalizeResult(parsed: Record<string, unknown>): ChileanOcrPayload {
  const result = emptyResult();
  const doc = normalizeDocumentType(parsed.documentType, parsed.siiDocumentCode);
  result.merchant = String(parsed.merchant ?? "").trim();
  result.rut = normalizeRut(parsed.rut);
  result.receiverName = String(parsed.receiverName ?? "").trim();
  result.receiverRut = normalizeRut(parsed.receiverRut);
  result.date = normalizeDate(parsed.date);
  result.folio = String(parsed.folio ?? "").replace(/[^0-9A-Za-z-]/g, "").trim();
  result.documentType = doc.type;
  result.siiDocumentCode = doc.code;
  result.netAmount = numberOrNull(parsed.netAmount);
  result.exemptAmount = numberOrNull(parsed.exemptAmount);
  result.taxAmount = numberOrNull(parsed.taxAmount);
  result.totalAmount = numberOrNull(parsed.totalAmount);
  const currency = String(parsed.currency ?? "CLP").toUpperCase();
  result.currency = ["CLP", "UF", "USD"].includes(currency) ? (currency as ChileanOcrPayload["currency"]) : "OTHER";
  result.paymentMethod = String(parsed.paymentMethod ?? "").trim();
  result.suggestedCategory = String(parsed.suggestedCategory ?? "Otros").trim() || "Otros";
  result.suggestedCostCenter = String(parsed.suggestedCostCenter ?? "Operaciones").trim() || "Operaciones";
  result.confidence = clampConfidence(parsed.confidence);
  const rawFieldConfidence = (parsed.fieldConfidence ?? {}) as Record<string, unknown>;
  result.fieldConfidence = {
    merchant: clampConfidence(rawFieldConfidence.merchant),
    rut: clampConfidence(rawFieldConfidence.rut),
    date: clampConfidence(rawFieldConfidence.date),
    folio: clampConfidence(rawFieldConfidence.folio),
    totalAmount: clampConfidence(rawFieldConfidence.totalAmount),
  };
  result.warnings = Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [];
  result.rutValid = validateRut(result.rut);
  result.totalsMatch = calculateTotalsMatch(result.netAmount, result.exemptAmount, result.taxAmount, result.totalAmount);

  if (result.rut && result.rutValid === false) result.warnings.push("El RUT emisor no supera la validación de dígito verificador.");
  if (result.totalsMatch === false) result.warnings.push("Neto, exento e IVA no cuadran con el monto total.");
  if (!result.merchant) result.warnings.push("No se pudo identificar con seguridad la razón social o comercio.");
  if (!result.totalAmount) result.warnings.push("No se pudo identificar con seguridad el monto total.");
  if (!result.date) result.warnings.push("No se pudo identificar con seguridad la fecha de emisión.");

  result.reviewRequired =
    result.confidence < 80 ||
    result.rutValid === false ||
    result.totalsMatch === false ||
    !result.merchant ||
    !result.totalAmount ||
    !result.date;

  result.validationStatus = result.rutValid === false || result.totalsMatch === false
    ? "invalid"
    : result.reviewRequired
      ? "review"
      : "validated";

  result.duplicateKey = buildDuplicateKey(result);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Motor documental no configurado. Agrega OPENAI_API_KEY en Vercel y en .env.local." },
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
    const prompt = `Eres WAMA Chile DTE Engine, un motor especializado en documentos tributarios y comprobantes chilenos.

Analiza exclusivamente lo visible en el documento. No inventes ni completes datos dudosos.

Reconoce especialmente:
- Factura electrónica código SII 33.
- Factura exenta electrónica código 34.
- Boleta electrónica código 39.
- Boleta exenta electrónica código 41.
- Guía de despacho electrónica código 52.
- Nota de débito electrónica código 56.
- Nota de crédito electrónica código 61.
- Voucher o comprobante de pago cuando no sea DTE.

Prioridades de extracción:
1. Razón social o comercio EMISOR.
2. RUT EMISOR chileno.
3. Fecha de emisión.
4. Folio o número del documento.
5. Neto, exento, IVA y total.
6. Receptor cuando esté visible.
7. Método de pago.
8. Clasificación del gasto y centro de costo sugeridos.

Reglas chilenas:
- Montos CLP como enteros, sin puntos, comas ni símbolo de moneda.
- La fecha debe quedar como YYYY-MM-DD.
- Nunca confundas el RUT receptor con el RUT emisor.
- Si aparece un código de documento, utiliza el código SII correcto.
- Para documentos afectos, verifica conceptualmente que neto + IVA + exento sea coherente con total.
- Si un campo no se distingue, usa cadena vacía o null.
- Las categorías permitidas son: Combustible, Movilización, Alimentación, Alojamiento, Insumos, Servicios, Peajes, Estacionamiento, Mantención, Otros.
- Los centros sugeridos son: Operaciones, Comercial, Administración, TI, Mantención, Proyecto.
- confidence y fieldConfidence van de 0 a 100.
- warnings debe explicar cualquier campo dudoso, ilegible o incoherente.

Devuelve únicamente datos estructurados según el schema.`;

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
        text: {
          format: {
            type: "json_schema",
            name: "wama_chile_dte_document",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                merchant: { type: "string" },
                rut: { type: "string" },
                receiverName: { type: "string" },
                receiverRut: { type: "string" },
                date: { type: "string" },
                folio: { type: "string" },
                documentType: { type: "string" },
                siiDocumentCode: { anyOf: [{ type: "integer" }, { type: "null" }] },
                netAmount: { anyOf: [{ type: "integer" }, { type: "null" }] },
                exemptAmount: { anyOf: [{ type: "integer" }, { type: "null" }] },
                taxAmount: { anyOf: [{ type: "integer" }, { type: "null" }] },
                totalAmount: { anyOf: [{ type: "integer" }, { type: "null" }] },
                currency: { type: "string", enum: ["CLP", "UF", "USD", "OTHER"] },
                paymentMethod: { type: "string" },
                suggestedCategory: { type: "string" },
                suggestedCostCenter: { type: "string" },
                confidence: { type: "number" },
                fieldConfidence: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    merchant: { type: "number" },
                    rut: { type: "number" },
                    date: { type: "number" },
                    folio: { type: "number" },
                    totalAmount: { type: "number" },
                  },
                  required: ["merchant", "rut", "date", "folio", "totalAmount"],
                },
                warnings: { type: "array", items: { type: "string" } },
              },
              required: [
                "merchant", "rut", "receiverName", "receiverRut", "date", "folio", "documentType",
                "siiDocumentCode", "netAmount", "exemptAmount", "taxAmount", "totalAmount", "currency",
                "paymentMethod", "suggestedCategory", "suggestedCostCenter", "confidence", "fieldConfidence", "warnings",
              ],
            },
          },
        },
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
    const parsed = JSON.parse(outputText) as Record<string, unknown>;
    const result = normalizeResult(parsed);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado del motor documental.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
