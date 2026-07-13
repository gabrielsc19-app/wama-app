"use client";

import { useState } from "react";
import Link from "next/link";

const demoAnswers = [
  {
    keywords: ["precio", "valor", "cuanto", "cuánto", "costo", "licencia"],
    answer:
      "WAMA funciona por módulos. Cada módulo cuesta US$10 mensuales e incluye hasta 10 usuarios. Si necesitas más usuarios, puedes activar bloques adicionales.",
  },
  {
    keywords: ["prueba", "gratis", "trial"],
    answer:
      "Puedes activar una prueba gratis de 14 días. Durante ese periodo configuras tu empresa, cargas datos iniciales y pruebas el módulo seleccionado.",
  },
  {
    keywords: ["sales", "crm", "venta", "ventas", "pipeline", "deal"],
    answer:
      "Para comenzar con Sales Hub, activa la prueba y luego completa el onboarding comercial: qué vendes, tipo de venta, pipeline, contactos y primeros deals.",
  },
  {
    keywords: ["operacion", "operación", "caso", "alerta", "sla", "responsable"],
    answer:
      "En Operación, WAMA ayuda a ordenar alertas, asignar responsables, controlar SLA, adjuntar evidencia y revisar casos pendientes.",
  },
  {
    keywords: ["finanza", "finanzas", "pago", "documento", "cartola", "conciliacion", "conciliación"],
    answer:
      "En Finanzas, WAMA ayuda a cargar documentos, revisar pendientes, validar cartolas y detectar diferencias antes del cierre.",
  },
];

function getDemoAnswer(question: string) {
  const normalizedQuestion = question.toLowerCase();

  const match = demoAnswers.find((item) =>
    item.keywords.some((keyword) => normalizedQuestion.includes(keyword))
  );

  if (match) return match.answer;

  return "Te puedo ayudar a elegir un módulo, activar una prueba gratis o entender cómo comenzar. Cuéntame si necesitas ventas, operación o finanzas.";
}

export default function WamaGuideBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "wama",
      text: "Hola, soy WAMA. Te acompaño para activar tu prueba, elegir un módulo y comenzar a trabajar.",
    },
  ]);

  function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    const answer = getDemoAnswer(cleanQuestion);

    setMessages((current) => [
      ...current,
      { from: "user", text: cleanQuestion },
      { from: "wama", text: answer },
    ]);

    setQuestion("");
  }

  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      {isOpen && (
        <div className="mb-4 w-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#111318] shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/10 bg-[#0B0C0E] p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
              Asistente WAMA
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
              ¿Tienes dudas?
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
              Pregúntame cómo activar la prueba, qué módulo usar o cómo empezar.
            </p>
          </div>

          <div className="max-h-[260px] space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.from === "wama"
                    ? "border border-[#00E5D6]/20 bg-[#00E5D6]/10 text-[#F5F6F7]"
                    : "bg-white/[0.06] text-[#F5F6F7]"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleAsk} className="border-t border-white/10 p-4">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/50"
              placeholder="Escribe tu pregunta..."
            />

            <button
              type="submit"
              className="mt-3 w-full rounded-2xl bg-[#00E5D6] px-4 py-3 text-sm font-black text-[#0B0C0E]"
            >
              Preguntar
            </button>
          </form>

          <div className="grid gap-3 border-t border-white/10 p-4">
            <Link
              href="/trial"
              className="rounded-2xl bg-[#00E5D6] px-4 py-3 text-center text-sm font-black text-[#0B0C0E]"
            >
              Activar prueba gratis
            </Link>

            <Link
              href="/modulos"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-[#F5F6F7]"
            >
              Ver módulos
            </Link>
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

        {isOpen ? "Cerrar ayuda" : "Te ayudo a comenzar"}
      </button>
    </div>
  );
}