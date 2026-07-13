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
      text: "Hola, soy el agente WAMA. Puedo ayudarte a elegir un módulo, activar una prueba gratis o resolver dudas sobre el portal.",
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
        setLeadStatus("Tus datos fueron enviados al equipo WAMA.");
      } else {
        setLeadStatus("Tus datos quedaron registrados para seguimiento comercial.");
      }

      setLeadSent(true);
    } catch {
      setLeadStatus("Tus datos quedaron registrados para seguimiento comercial.");
    }
  }

  async function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion || isLoading) return;

    const nextMessages: Message[] = [
      ...messages,
      {
        from: "user",
        text: cleanQuestion,
      },
    ];

    setMessages(nextMessages);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          lead,
        }),
      });

      const data = await response.json();

      const nextLead = {
        ...lead,
        ...(data.lead || {}),
        suggestedModule: data.suggestedModule || data.lead?.suggestedModule,
      };

      setLead(nextLead);

      setMessages((current) => [
        ...current,
        {
          from: "wama",
          text:
            data.reply ||
            "Puedo ayudarte a elegir el módulo correcto para tu empresa.",
        },
      ]);

      if (data.leadReady) {
        await sendLeadToAdmin(nextLead, data.suggestedModule);
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

  function resetChat() {
    setQuestion("");
    setLead({});
    setLeadSent(false);
    setLeadStatus("");
    setMessages([
      {
        from: "wama",
        text: "Hola, soy el agente WAMA. Puedo ayudarte a elegir un módulo, activar una prueba gratis o resolver dudas sobre el portal.",
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
              Pregúntame por módulos, prueba gratis, precios o acceso al portal.
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
                placeholder="Escribe tu pregunta..."
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