"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  from: "wama" | "user";
  text: string;
};

type LeadData = {
  name?: string;
  company?: string;
  contact?: string;
  need?: string;
  suggestedModule?: string;
};

function isGreeting(text: string) {
  const value = text.trim().toLowerCase();

  return [
    "hola",
    "buenas",
    "buen día",
    "buen dia",
    "buenas tardes",
    "buenas noches",
    "hello",
    "hi",
  ].some((greeting) => value === greeting || value.startsWith(`${greeting} `));
}

function isContact(text: string) {
  return (
    /\S+@\S+\.\S+/.test(text) ||
    /\+?\d[\d\s.-]{7,}/.test(text)
  );
}

function looksLikeName(text: string) {
  const value = text.trim();

  if (value.length < 2) return false;
  if (isGreeting(value)) return false;
  if (isContact(value)) return false;

  const blockedWords = [
    "ventas",
    "venta",
    "crm",
    "pipeline",
    "operacion",
    "operación",
    "finanzas",
    "finanza",
    "pago",
    "pagos",
    "documentos",
    "documento",
    "precio",
    "prueba",
    "gratis",
    "portal",
    "modulo",
    "módulo",
  ];

  const lowerValue = value.toLowerCase();

  if (blockedWords.some((word) => lowerValue.includes(word))) {
    return false;
  }

  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
}

function localQuickAnswer(text: string) {
  const value = text.toLowerCase();

  if (
    value.includes("precio") ||
    value.includes("valor") ||
    value.includes("costo") ||
    value.includes("cuánto") ||
    value.includes("cuanto") ||
    value.includes("licencia")
  ) {
    return {
      reply:
        "WAMA funciona por módulos. El plan base es de US$10 mensuales por módulo e incluye hasta 10 usuarios. Para orientarte mejor, ¿cómo te llamas?",
      suggestedModule: "Módulos WAMA",
    };
  }

  if (
    value.includes("ventas") ||
    value.includes("venta") ||
    value.includes("crm") ||
    value.includes("pipeline") ||
    value.includes("deal") ||
    value.includes("deals")
  ) {
    return {
      reply:
        "Para ventas te recomiendo Sales Hub. Sirve para ordenar prospectos, contactos, deals, pipeline y seguimiento comercial. Para ayudarte mejor, ¿cómo te llamas?",
      suggestedModule: "Sales Hub",
    };
  }

  if (
    value.includes("operacion") ||
    value.includes("operación") ||
    value.includes("alerta") ||
    value.includes("caso") ||
    value.includes("sla") ||
    value.includes("responsable")
  ) {
    return {
      reply:
        "Para operación te recomiendo el módulo Operación. Ayuda a gestionar alertas, casos, responsables, evidencia y SLA. Para ayudarte mejor, ¿cómo te llamas?",
      suggestedModule: "Operación",
    };
  }

  if (
    value.includes("finanza") ||
    value.includes("finanzas") ||
    value.includes("pago") ||
    value.includes("pagos") ||
    value.includes("factura") ||
    value.includes("documento") ||
    value.includes("cartola") ||
    value.includes("conciliación") ||
    value.includes("conciliacion")
  ) {
    return {
      reply:
        "Para finanzas te recomiendo el módulo Finanzas. Ayuda a ordenar documentos, pagos, cartolas, pendientes y conciliación. Para ayudarte mejor, ¿cómo te llamas?",
      suggestedModule: "Finanzas",
    };
  }

  if (
    value.includes("prueba") ||
    value.includes("gratis") ||
    value.includes("trial") ||
    value.includes("demo")
  ) {
    return {
      reply:
        "La prueba gratuita dura 14 días. Te permite configurar tu empresa, elegir un módulo y comenzar a trabajar en el portal. Para iniciar, ¿cómo te llamas?",
      suggestedModule: "Módulos WAMA",
    };
  }

  return null;
}

export default function WamaGuideBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [leadStatus, setLeadStatus] = useState("");
  const [lead, setLead] = useState<LeadData>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      from: "wama",
      text: "Hola, soy el agente WAMA. Te ayudo a elegir el módulo correcto, activar una prueba gratis y comenzar rápido. ¿Cómo te llamas?",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, leadStatus]);

  async function sendLeadToAdmin(nextLead: LeadData, suggestedModule?: string) {
    if (leadSent) return;

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead: nextLead,
          suggestedModule: suggestedModule || nextLead.suggestedModule,
        }),
      });

      const data = await response.json();

      if (data.sent) {
        setLeadStatus("Perfecto. Tus datos fueron enviados al equipo WAMA.");
      } else {
        setLeadStatus("Perfecto. Tus datos quedaron registrados para seguimiento comercial.");
      }

      setLeadSent(true);
    } catch {
      setLeadStatus("Perfecto. Tus datos quedaron registrados para seguimiento comercial.");
    }
  }

  async function callAssistant(nextMessages: Message[], nextLead: LeadData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          lead: nextLead,
        }),
      });

      const data = await response.json();

      const updatedLead = {
        ...nextLead,
        ...(data.lead || {}),
        suggestedModule: data.suggestedModule || data.lead?.suggestedModule || nextLead.suggestedModule,
      };

      setLead(updatedLead);

      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text:
            data.reply ||
            "Puedo ayudarte a elegir el módulo correcto para tu empresa. ¿Qué proceso quieres ordenar primero?",
        },
      ]);

      if (data.leadReady) {
        await sendLeadToAdmin(updatedLead, data.suggestedModule);
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text: "Puedo ayudarte a elegir el módulo correcto para tu empresa. ¿Necesitas ordenar ventas, operación o finanzas?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion || isLoading) return;

    const userMessage: Message = {
      from: "user",
      text: cleanQuestion,
    };

    const nextMessages: Message[] = [...messages, userMessage];

    setMessages(nextMessages);
    setQuestion("");

    if (isGreeting(cleanQuestion) && !lead.name) {
      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text: "Hola, bienvenido a WAMA. Para ayudarte mejor, ¿cómo te llamas?",
        },
      ]);
      return;
    }

    if (!lead.name && looksLikeName(cleanQuestion)) {
      const nextLead = {
        ...lead,
        name: cleanQuestion,
      };

      setLead(nextLead);

      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text: `Gracias, ${cleanQuestion}. ¿De qué empresa vienes?`,
        },
      ]);

      return;
    }

    if (lead.name && !lead.company && !isContact(cleanQuestion)) {
      const nextLead = {
        ...lead,
        company: cleanQuestion,
      };

      setLead(nextLead);

      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text: "Perfecto. ¿Me dejas tu correo o celular para enviarte información y ayudarte con la prueba?",
        },
      ]);

      return;
    }

    if (lead.name && lead.company && !lead.contact && isContact(cleanQuestion)) {
      const nextLead = {
        ...lead,
        contact: cleanQuestion,
      };

      setLead(nextLead);

      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text: "Gracias. Ahora cuéntame qué necesitas ordenar: ventas, operación, finanzas, reportes u otro proceso.",
        },
      ]);

      return;
    }

    if (lead.name && lead.company && lead.contact && !lead.need) {
      const quick = localQuickAnswer(cleanQuestion);

      const nextLead = {
        ...lead,
        need: cleanQuestion,
        suggestedModule: quick?.suggestedModule || lead.suggestedModule || "Módulos WAMA",
      };

      setLead(nextLead);

      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text:
            quick?.reply ||
            "Perfecto. Con esa información puedo orientar mejor el módulo inicial para tu empresa.",
        },
        {
          from: "wama",
          text: "Ya tengo los datos principales. Los dejaré registrados para seguimiento comercial.",
        },
      ]);

      await sendLeadToAdmin(nextLead, nextLead.suggestedModule);
      return;
    }

    const quick = localQuickAnswer(cleanQuestion);

    if (quick && !lead.name) {
      const nextLead = {
        ...lead,
        suggestedModule: quick.suggestedModule,
      };

      setLead(nextLead);

      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text: quick.reply,
        },
      ]);

      return;
    }

    await callAssistant(nextMessages, lead);
  }

  function resetChat() {
    setQuestion("");
    setLead({});
    setLeadSent(false);
    setLeadStatus("");
    setMessages([
      {
        from: "wama",
        text: "Hola, soy el agente WAMA. Te ayudo a elegir el módulo correcto, activar una prueba gratis y comenzar rápido. ¿Cómo te llamas?",
      },
    ]);
  }

  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      {isOpen && (
        <div className="mb-4 flex h-[640px] w-[410px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#111318] shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <div className="shrink-0 border-b border-white/10 bg-[#0B0C0E] p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
              Agente WAMA
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
              Te ayudo a comenzar.
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#C4C7CC]">
              Respondo dudas, recomiendo módulos y te ayudo a activar tu prueba.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.from === "wama"
                    ? "mr-auto border border-[#00E5D6]/20 bg-[#00E5D6]/10 text-[#F5F6F7]"
                    : "ml-auto bg-white/[0.08] text-[#F5F6F7]"
                }`}
              >
                {message.text}
              </div>
            ))}

            {isLoading && (
              <div className="mr-auto max-w-[92%] rounded-2xl border border-[#00E5D6]/20 bg-[#00E5D6]/10 px-4 py-3 text-sm text-[#F5F6F7]">
                Escribiendo...
              </div>
            )}

            {leadStatus && (
              <div className="rounded-2xl border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-4 text-sm leading-6 text-[#F5F6F7]">
                {leadStatus}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-white/10 bg-[#111318] p-4">
            <form onSubmit={handleAsk} className="flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={isLoading}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/50 disabled:opacity-60"
                placeholder="Escribe tu respuesta..."
              />

              <button
                type="submit"
                disabled={isLoading}
                className="rounded-2xl bg-[#00E5D6] px-4 py-3 text-sm font-black text-[#0B0C0E] disabled:opacity-60"
              >
                Enviar
              </button>
            </form>

            <button
              type="button"
              onClick={resetChat}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-[#F5F6F7]"
            >
              Reiniciar conversación
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="wama-button-motion flex items-center gap-3 rounded-full border border-[#00E5D6]/35 bg-[#00E5D6] px-5 py-4 text-sm font-black text-[#0B0C0E] shadow-[0_20px_60px_rgba(0,229,214,0.25)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B0C0E] text-sm font-black text-[#00E5D6]">
          W
        </span>

        {isOpen ? "Cerrar ayuda" : "Agente WAMA"}
      </button>
    </div>
  );
}