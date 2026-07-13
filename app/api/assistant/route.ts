import { NextResponse } from "next/server";

type LeadData = {
  name?: string;
  company?: string;
  contact?: string;
  need?: string;
  suggestedModule?: string;
};

type ChatMessage = {
  from: "wama" | "user";
  text: string;
};

type AssistantResponse = {
  reply?: string;
  lead?: LeadData;
  leadReady?: boolean;
  suggestedModule?: string;
  intent?: string;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function safeJsonParse(text: string): AssistantResponse | null {
  try {
    return JSON.parse(text) as AssistantResponse;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]) as AssistantResponse;
    } catch {
      return null;
    }
  }
}

function extractOutputText(data: unknown): string {
  const responseData = data as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };

  if (typeof responseData.output_text === "string") {
    return responseData.output_text;
  }

  if (!Array.isArray(responseData.output)) {
    return "";
  }

  return responseData.output
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const messages = (body.messages || []) as ChatMessage[];
    const lead = (body.lead || {}) as LeadData;

    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        reply:
          "La IA de WAMA aún no tiene configurada la API Key. Revisa OPENAI_API_KEY en Vercel y en .env.local.",
        lead,
        leadReady: false,
        suggestedModule: lead.suggestedModule || "",
        intent: "missing_api_key",
      });
    }

    const systemPrompt = `
Eres el Asistente WAMA, un agente de ventas para una app SaaS modular.

Objetivo:
- Ayudar al visitante a entender WAMA.
- Recomendar el módulo correcto: Sales Hub, Operación o Finanzas.
- Capturar lead comercial: nombre, empresa, correo o celular, y necesidad.
- Incentivar prueba gratis de 14 días.
- Mantener tono profesional, directo, comercial y cercano.
- No sonar como formulario rígido.
- No tomar "hola", "buenas", "ok", "gracias" como nombre.
- Si el usuario saluda, saluda y pregunta qué necesita.
- Si el usuario escribe algo incoherente, responde que no entendiste.
- Si el usuario escribe algo inapropiado, responde con límite profesional y vuelve a WAMA.
- No inventes datos de empresa, precios ni características fuera de este contexto.

Contexto de WAMA:
- WAMA es software modular para empresas.
- Módulos: Sales Hub, Operación, Finanzas y Reportes.
- Sales Hub: CRM, prospectos, contactos, deals, pipeline, seguimiento comercial.
- Operación: alertas, casos, responsables, SLA, evidencia, trazabilidad.
- Finanzas: documentos, pagos, cartolas, conciliación, pendientes y reportes.
- Prueba gratis: 14 días.
- Precio base: US$10 mensuales por módulo.
- Incluye hasta 10 usuarios por módulo.
- Usuarios adicionales: bloque adicional de US$10.
- El objetivo comercial es que el cliente active prueba gratis o deje sus datos.

Debes responder SIEMPRE en JSON válido, sin markdown:
{
  "reply": "respuesta breve para el usuario",
  "lead": {
    "name": "",
    "company": "",
    "contact": "",
    "need": "",
    "suggestedModule": ""
  },
  "leadReady": false,
  "suggestedModule": "",
  "intent": "greeting|pricing|trial|module_sales|module_operation|module_finance|lead_capture|unknown|inappropriate"
}

Reglas de captura:
- Si ya tienes nombre, no lo vuelvas a pedir.
- Si ya tienes empresa, no la vuelvas a pedir.
- Si ya tienes contacto, no lo vuelvas a pedir.
- Si ya tienes necesidad, no la vuelvas a pedir.
- Si el usuario pregunta algo antes de dejar datos, responde primero y luego haz una pregunta suave.
- leadReady solo debe ser true si tienes name, company, contact y need.
- suggestedModule debe ser "Sales Hub", "Operación", "Finanzas" o "Módulos WAMA".
`;

    const userInput = JSON.stringify({
      currentLead: lead,
      conversation: messages,
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userInput,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json({
        reply:
          "La IA de WAMA no pudo responder en este momento. Podemos continuar con la prueba gratis o revisar los módulos.",
        lead,
        leadReady: false,
        suggestedModule: lead.suggestedModule || "",
        intent: "openai_error",
        error: errorText,
      });
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    const parsed = safeJsonParse(outputText);

    if (!parsed) {
      return NextResponse.json({
        reply:
          "No entendí bien tu mensaje. Puedo ayudarte con prueba gratis, módulos, precios o acceso al portal.",
        lead,
        leadReady: false,
        suggestedModule: lead.suggestedModule || "",
        intent: "parse_error",
      });
    }

    const nextLead: LeadData = {
      name: parsed.lead?.name || lead.name || "",
      company: parsed.lead?.company || lead.company || "",
      contact: parsed.lead?.contact || lead.contact || "",
      need: parsed.lead?.need || lead.need || "",
      suggestedModule:
        parsed.lead?.suggestedModule ||
        parsed.suggestedModule ||
        lead.suggestedModule ||
        "",
    };

    return NextResponse.json({
      reply: parsed.reply || "Te puedo ayudar con WAMA.",
      lead: nextLead,
      leadReady: Boolean(parsed.leadReady),
      suggestedModule:
        parsed.suggestedModule || parsed.lead?.suggestedModule || "",
      intent: parsed.intent || "unknown",
    });
  } catch {
    return NextResponse.json(
      {
        reply:
          "Hubo un problema con el asistente. Intenta nuevamente o activa la prueba gratis.",
        lead: {},
        leadReady: false,
        suggestedModule: "",
        intent: "server_error",
      },
      { status: 200 }
    );
  }
}