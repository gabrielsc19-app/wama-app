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

function getLastUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.from === "user")?.text || "";
}

function getLocalSalesAnswer(message: string) {
  const text = message.toLowerCase();

  if (
    text.includes("hola") ||
    text.includes("buenas") ||
    text.includes("hello")
  ) {
    return {
      reply:
        "Hola, soy el agente WAMA. Puedo ayudarte a elegir un módulo, activar una prueba o entender cómo WAMA puede ordenar tu empresa. ¿Qué proceso quieres mejorar hoy?",
      suggestedModule: "Módulos WAMA",
      intent: "greeting",
    };
  }

  if (
    text.includes("precio") ||
    text.includes("valor") ||
    text.includes("costo") ||
    text.includes("licencia") ||
    text.includes("cuánto") ||
    text.includes("cuanto")
  ) {
    return {
      reply:
        "WAMA funciona por módulos. El plan base es de US$10 mensuales por módulo e incluye hasta 10 usuarios. Si tu empresa necesita más usuarios, se puede agregar un bloque adicional.",
      suggestedModule: "Módulos WAMA",
      intent: "pricing",
    };
  }

  if (
    text.includes("venta") ||
    text.includes("ventas") ||
    text.includes("crm") ||
    text.includes("pipeline") ||
    text.includes("deal") ||
    text.includes("deals") ||
    text.includes("comercial")
  ) {
    return {
      reply:
        "Para ventas te recomiendo partir con Sales Hub. Te permite ordenar prospectos, contactos, deals, pipeline, seguimiento y reportes comerciales. ¿Quieres que te ayude a configurar una prueba?",
      suggestedModule: "Sales Hub",
      intent: "module_sales",
    };
  }

  if (
    text.includes("operacion") ||
    text.includes("operación") ||
    text.includes("alerta") ||
    text.includes("caso") ||
    text.includes("sla") ||
    text.includes("responsable")
  ) {
    return {
      reply:
        "Para operación te recomiendo el módulo Operación. Sirve para gestionar alertas, casos, responsables, evidencias, SLA y trazabilidad diaria.",
      suggestedModule: "Operación",
      intent: "module_operation",
    };
  }

  if (
    text.includes("finanza") ||
    text.includes("finanzas") ||
    text.includes("pago") ||
    text.includes("pagos") ||
    text.includes("documento") ||
    text.includes("factura") ||
    text.includes("cartola") ||
    text.includes("conciliación") ||
    text.includes("conciliacion")
  ) {
    return {
      reply:
        "Para finanzas te recomiendo el módulo Finanzas. Ayuda a ordenar documentos, pagos, cartolas, conciliaciones, pendientes y reportes financieros.",
      suggestedModule: "Finanzas",
      intent: "module_finance",
    };
  }

  if (
    text.includes("prueba") ||
    text.includes("gratis") ||
    text.includes("trial") ||
    text.includes("demo")
  ) {
    return {
      reply:
        "La prueba gratuita dura 14 días. Primero cargas los datos de tu empresa, eliges el módulo inicial y luego puedes entrar al portal para comenzar a trabajar.",
      suggestedModule: "Módulos WAMA",
      intent: "trial",
    };
  }

  if (text.length < 3 || /(.)\1{5,}/.test(text)) {
    return {
      reply:
        "No entendí bien tu mensaje. Puedes contarme si quieres ordenar ventas, operación, finanzas o reportes.",
      suggestedModule: "Módulos WAMA",
      intent: "unknown",
    };
  }

  return {
    reply:
      "Puedo ayudarte a elegir el módulo correcto para tu empresa. WAMA trabaja con Sales Hub, Operación, Finanzas y Reportes. ¿Qué área necesitas ordenar primero?",
    suggestedModule: "Módulos WAMA",
    intent: "unknown",
  };
}

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
    const lastUserMessage = getLastUserMessage(messages);
    const localFallback = getLocalSalesAnswer(lastUserMessage);

    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        reply: localFallback.reply,
        lead,
        leadReady: false,
        suggestedModule: localFallback.suggestedModule,
        intent: localFallback.intent,
        mode: "local_fallback",
      });
    }

    const systemPrompt = `
Eres el Agente WAMA, un agente comercial para una app SaaS modular.

Objetivo:
- Ayudar al visitante a entender WAMA.
- Recomendar el módulo correcto: Sales Hub, Operación o Finanzas.
- Capturar lead comercial de forma natural: nombre, empresa, correo o celular, y necesidad.
- Incentivar prueba gratis de 14 días.
- Responder con tono profesional, comercial, claro y cercano.
- No sonar como formulario rígido.
- No tomar "hola", "buenas", "ok", "gracias" como nombre.
- Si el usuario saluda, saluda y pregunta qué necesita.
- Si el usuario escribe algo incoherente, responde que no entendiste.
- Si el usuario escribe algo inapropiado, responde con límite profesional y vuelve a WAMA.
- No inventes datos fuera de este contexto.

Contexto:
- WAMA es software modular para empresas.
- Módulos: Sales Hub, Operación, Finanzas y Reportes.
- Sales Hub: CRM, prospectos, contactos, deals, pipeline, seguimiento comercial.
- Operación: alertas, casos, responsables, SLA, evidencia, trazabilidad.
- Finanzas: documentos, pagos, cartolas, conciliación, pendientes y reportes.
- Prueba gratis: 14 días.
- Precio base: US$10 mensuales por módulo.
- Incluye hasta 10 usuarios por módulo.
- Usuarios adicionales: bloque adicional de US$10.

Responde SIEMPRE en JSON válido, sin markdown:
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

Reglas:
- Si ya tienes nombre, no lo vuelvas a pedir.
- Si ya tienes empresa, no la vuelvas a pedir.
- Si ya tienes contacto, no lo vuelvas a pedir.
- Si ya tienes necesidad, no la vuelvas a pedir.
- Si el usuario pregunta algo antes de dejar datos, responde primero y luego haz una pregunta suave.
- leadReady solo debe ser true si tienes name, company, contact y need.
- suggestedModule debe ser "Sales Hub", "Operación", "Finanzas" o "Módulos WAMA".
`;

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
            content: JSON.stringify({
              currentLead: lead,
              conversation: messages,
            }),
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WAMA assistant OpenAI error:", errorText);

      return NextResponse.json({
        reply: localFallback.reply,
        lead,
        leadReady: false,
        suggestedModule: localFallback.suggestedModule,
        intent: localFallback.intent,
        mode: "local_fallback",
      });
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    const parsed = safeJsonParse(outputText);

    if (!parsed) {
      return NextResponse.json({
        reply: localFallback.reply,
        lead,
        leadReady: false,
        suggestedModule: localFallback.suggestedModule,
        intent: localFallback.intent,
        mode: "local_fallback",
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
      reply: parsed.reply || localFallback.reply,
      lead: nextLead,
      leadReady: Boolean(parsed.leadReady),
      suggestedModule:
        parsed.suggestedModule ||
        parsed.lead?.suggestedModule ||
        localFallback.suggestedModule,
      intent: parsed.intent || localFallback.intent,
      mode: "ai",
    });
  } catch (error) {
    console.error("WAMA assistant server error:", error);

    return NextResponse.json({
      reply:
        "Puedo ayudarte a elegir el módulo correcto para tu empresa. ¿Necesitas ordenar ventas, operación o finanzas?",
      lead: {},
      leadReady: false,
      suggestedModule: "Módulos WAMA",
      intent: "server_error",
      mode: "local_fallback",
    });
  }
}