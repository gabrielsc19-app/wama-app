"use client";

import { useState } from "react";
import Link from "next/link";

const demoAnswers = [
  {
    keywords: ["precio", "valor", "cuanto", "cuánto", "costo", "licencia", "pago"],
    answer:
      "El plan base cuesta US$10 mensuales por módulo e incluye hasta 10 usuarios. Si necesitas más usuarios, puedes agregar bloques adicionales.",
  },
  {
    keywords: ["usuario", "usuarios", "equipo", "personas"],
    answer:
      "Cada módulo incluye hasta 10 usuarios. Si tu empresa necesita agregar más, WAMA puede activar un bloque adicional.",
  },
  {
    keywords: ["prueba", "gratis", "trial", "demo"],
    answer:
      "Puedes activar una prueba gratis de 14 días. Primero cargas los datos de tu empresa y luego entras al portal para comenzar.",
  },
  {
    keywords: ["sales", "crm", "venta", "ventas", "pipeline", "deal", "deals"],
    answer:
      "Para comenzar con Sales Hub, activa la prueba y completa el onboarding comercial: qué vendes, tipo de venta, pipeline y primeros deals.",
  },
  {
    keywords: ["operacion", "operación", "caso", "alerta", "sla", "responsable"],
    answer:
      "En Operación puedes gestionar alertas, responsables, SLA, evidencia y seguimiento de casos desde un solo portal.",
  },
  {
    keywords: [
      "finanza",
      "finanzas",
      "pago",
      "pagos",
      "documento",
      "documentos",
      "cartola",
      "conciliacion",
      "conciliación",
    ],
    answer:
      "En Finanzas puedes cargar documentos, revisar pendientes, validar cartolas y controlar conciliaciones.",
  },
  {
    keywords: ["portal", "login", "ingresar", "acceso", "entrar"],
    answer:
      "Para entrar al software debes ir a Acceso portal, ingresar tu correo y clave, y luego verás los módulos activos de tu empresa.",
  },
  {
    keywords: ["reporte", "reportes", "dashboard", "indicador", "indicadores"],
    answer:
      "Los reportes muestran indicadores ejecutivos para decidir: ventas, operación, finanzas, pendientes y riesgos.",
  },
];

function getDemoAnswer(question: string) {
  const normalizedQuestion = question.toLowerCase();

  const match = demoAnswers.find((item) =>
    item.keywords.some((keyword) => normalizedQuestion.includes(keyword))
  );

  if (match) return match.answer;

  return "Te puedo ayudar a elegir un módulo, activar una prueba gratis o entender cómo empezar. Cuéntame si necesitas ventas, operación o finanzas.";
}

export default function WamaGuideBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "wama",
      text: "Hola, soy WAMA. Te ayudo a comenzar. Puedes preguntarme por prueba gratis, módulos, precios o acceso al portal.",
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
        <div className="mb-4 flex h-[620px] w-[380px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#111318] shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/10 bg-[#0B0C0E] p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
              Asistente WAMA
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
              ¿Tienes dudas?
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#C4C7CC]">
              Te ayudo a elegir módulo, activar la prueba o entrar al portal.
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
          </div>

          <div className="border-t border-white/10 bg-[#111318] p-4">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Link
                href="/trial"
                className="rounded-2xl bg-[#00E5D6] px-3 py-3 text-center text-xs font-black text-[#0B0C0E]"
              >
                Prueba gratis
              </Link>

              <Link
                href="/modulos"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-xs font-bold text-[#F5F6F7]"
              >
                Ver módulos
              </Link>
            </div>

            <form onSubmit={handleAsk} className="flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/50"
                placeholder="Escribe tu pregunta..."
              />

              <button
                type="submit"
                className="rounded-2xl bg-[#00E5D6] px-4 py-3 text-sm font-black text-[#0B0C0E]"
              >
                Enviar
              </button>
            </form>
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