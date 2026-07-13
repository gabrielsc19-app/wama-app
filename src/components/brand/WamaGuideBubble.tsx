"use client";

import { useState } from "react";
import Link from "next/link";

type Message = {
  from: "wama" | "user";
  text: string;
};

type LeadData = {
  name: string;
  company: string;
  contact: string;
  need: string;
};

const ADMIN_EMAIL = "gsanchez@pumay.cl";

const inappropriateWords = [
  "puta",
  "weon",
  "weón",
  "mierda",
  "ctm",
  "sexo",
  "porno",
  "droga",
  "matar",
  "suicidio",
];

function isInappropriate(text: string) {
  const normalized = text.toLowerCase();
  return inappropriateWords.some((word) => normalized.includes(word));
}

function isGibberish(text: string) {
  const clean = text.trim();

  if (clean.length < 2) return true;

  const hasLetter = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(clean);
  if (!hasLetter) return true;

  const repeated = /(.)\1{5,}/.test(clean);
  if (repeated) return true;

  return false;
}

function getModuleSuggestion(need: string) {
  const value = need.toLowerCase();

  if (
    value.includes("venta") ||
    value.includes("crm") ||
    value.includes("cliente") ||
    value.includes("deal") ||
    value.includes("pipeline") ||
    value.includes("comercial")
  ) {
    return {
      module: "Sales Hub",
      answer:
        "Por lo que me cuentas, te recomiendo comenzar con Sales Hub. Es el módulo para ordenar prospectos, contactos, deals, pipeline y seguimiento comercial.",
      href: "/modulos/sales-hub",
    };
  }

  if (
    value.includes("operacion") ||
    value.includes("operación") ||
    value.includes("caso") ||
    value.includes("alerta") ||
    value.includes("responsable") ||
    value.includes("sla") ||
    value.includes("mantencion") ||
    value.includes("mantención")
  ) {
    return {
      module: "Operación",
      answer:
        "Por lo que me cuentas, te recomiendo comenzar con Operación. Es el módulo para controlar alertas, casos, responsables, evidencia y cumplimiento.",
      href: "/modulos/operacion",
    };
  }

  if (
    value.includes("finanza") ||
    value.includes("finanzas") ||
    value.includes("pago") ||
    value.includes("pagos") ||
    value.includes("documento") ||
    value.includes("factura") ||
    value.includes("cartola") ||
    value.includes("conciliacion") ||
    value.includes("conciliación")
  ) {
    return {
      module: "Finanzas",
      answer:
        "Por lo que me cuentas, te recomiendo comenzar con Finanzas. Es el módulo para ordenar documentos, pagos, pendientes, cartolas y conciliación.",
      href: "/modulos/finanzas",
    };
  }

  return {
    module: "Módulos WAMA",
    answer:
      "No logro identificar con claridad si necesitas ventas, operación o finanzas. Te recomiendo revisar los módulos WAMA o contarme con más detalle qué proceso quieres ordenar.",
    href: "/modulos",
  };
}

function getGeneralAnswer(text: string) {
  const value = text.toLowerCase();

  if (isInappropriate(value)) {
    return "No puedo ayudarte con ese tipo de mensaje. Si quieres, puedo orientarte sobre módulos, prueba gratis, precios o acceso al portal WAMA.";
  }

  if (isGibberish(value)) {
    return "No entendí bien tu mensaje. Puedes preguntarme, por ejemplo: “quiero ordenar mis ventas”, “necesito controlar operación” o “quiero gestionar pagos”.";
  }

  if (
    value.includes("precio") ||
    value.includes("valor") ||
    value.includes("costo") ||
    value.includes("licencia") ||
    value.includes("cuánto") ||
    value.includes("cuanto")
  ) {
    return "WAMA funciona por módulos. El plan base cuesta US$10 mensuales por módulo e incluye hasta 10 usuarios. Si necesitas más usuarios, se puede activar un bloque adicional.";
  }

  if (
    value.includes("prueba") ||
    value.includes("gratis") ||
    value.includes("trial") ||
    value.includes("demo")
  ) {
    return "Puedes activar una prueba gratuita de 14 días. Primero cargas los datos de tu empresa, eliges el módulo inicial y luego accedes al portal.";
  }

  if (
    value.includes("usuario") ||
    value.includes("usuarios") ||
    value.includes("equipo")
  ) {
    return "Cada módulo incluye hasta 10 usuarios. Si tu empresa necesita más, se puede agregar un bloque adicional.";
  }

  if (
    value.includes("portal") ||
    value.includes("login") ||
    value.includes("entrar") ||
    value.includes("ingresar") ||
    value.includes("acceso")
  ) {
    return "Para entrar al software debes ir a Acceso portal, ingresar tu correo y clave, y luego verás los módulos activos de tu empresa.";
  }

  if (
    value.includes("ventas") ||
    value.includes("crm") ||
    value.includes("pipeline") ||
    value.includes("deal")
  ) {
    return getModuleSuggestion(value).answer;
  }

  if (
    value.includes("operación") ||
    value.includes("operacion") ||
    value.includes("alerta") ||
    value.includes("caso") ||
    value.includes("sla")
  ) {
    return getModuleSuggestion(value).answer;
  }

  if (
    value.includes("finanzas") ||
    value.includes("finanza") ||
    value.includes("pago") ||
    value.includes("documento") ||
    value.includes("factura") ||
    value.includes("cartola")
  ) {
    return getModuleSuggestion(value).answer;
  }

  return "No entendí bien tu consulta. Puedo ayudarte con módulos, precios, prueba gratis, usuarios, ventas, operación, finanzas o acceso al portal.";
}

export default function WamaGuideBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<
    "name" | "company" | "contact" | "need" | "done"
  >("name");
  const [question, setQuestion] = useState("");
  const [lead, setLead] = useState<LeadData>({
    name: "",
    company: "",
    contact: "",
    need: "",
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      from: "wama",
      text: "Hola, soy WAMA. Te ayudo a elegir el módulo correcto y activar tu prueba. ¿Cómo te llamas?",
    },
  ]);

  const suggestion = getModuleSuggestion(lead.need);

  function saveLead(nextLead: LeadData) {
    const storedLeads = localStorage.getItem("wamaAssistantLeads");
    const currentLeads = storedLeads ? JSON.parse(storedLeads) : [];

    const newLead = {
      ...nextLead,
      suggestedModule: getModuleSuggestion(nextLead.need).module,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "wamaAssistantLeads",
      JSON.stringify([newLead, ...currentLeads])
    );
  }

  function getMailToLink() {
    const subject = encodeURIComponent(
      `Nuevo lead WAMA - ${lead.company || "Empresa sin nombre"}`
    );

    const body = encodeURIComponent(
      `Nuevo contacto desde Asistente WAMA\n\n` +
        `Nombre: ${lead.name}\n` +
        `Empresa: ${lead.company}\n` +
        `Contacto: ${lead.contact}\n` +
        `Necesidad: ${lead.need}\n` +
        `Módulo sugerido: ${suggestion.module}\n\n` +
        `Origen: Chatbot WAMA\n`
    );

    return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
  }

  function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = question.trim();
    if (!value) return;

    const userMessage: Message = {
      from: "user",
      text: value,
    };

    if (isInappropriate(value)) {
      setMessages((current) => [
        ...current,
        userMessage,
        {
          from: "wama",
          text: "No puedo ayudarte con ese tipo de mensaje. Puedo orientarte sobre WAMA, módulos, prueba gratis, precios o acceso al portal.",
        },
      ]);
      setQuestion("");
      return;
    }

    if (isGibberish(value)) {
      setMessages((current) => [
        ...current,
        userMessage,
        {
          from: "wama",
          text: "No entendí bien tu mensaje. Prueba escribiendo tu nombre, empresa o qué proceso necesitas ordenar.",
        },
      ]);
      setQuestion("");
      return;
    }

    if (step === "name") {
      const nextLead = { ...lead, name: value };
      setLead(nextLead);

      setMessages((current) => [
        ...current,
        userMessage,
        {
          from: "wama",
          text: `Gracias, ${value}. ¿De qué empresa vienes?`,
        },
      ]);

      setStep("company");
      setQuestion("");
      return;
    }

    if (step === "company") {
      const nextLead = { ...lead, company: value };
      setLead(nextLead);

      setMessages((current) => [
        ...current,
        userMessage,
        {
          from: "wama",
          text: "Perfecto. Déjame tu celular o correo para que podamos contactarte.",
        },
      ]);

      setStep("contact");
      setQuestion("");
      return;
    }

    if (step === "contact") {
      const nextLead = { ...lead, contact: value };
      setLead(nextLead);

      setMessages((current) => [
        ...current,
        userMessage,
        {
          from: "wama",
          text: "Gracias. Ahora cuéntame qué necesitas ordenar: ventas, operación, finanzas, reportes u otro proceso.",
        },
      ]);

      setStep("need");
      setQuestion("");
      return;
    }

    if (step === "need") {
      const nextLead = { ...lead, need: value };
      const nextSuggestion = getModuleSuggestion(value);

      setLead(nextLead);
      saveLead(nextLead);

      setMessages((current) => [
        ...current,
        userMessage,
        {
          from: "wama",
          text: nextSuggestion.answer,
        },
        {
          from: "wama",
          text: "Ya dejé tus datos registrados en WAMA. Puedes activar la prueba gratis o enviar esta información al administrador.",
        },
      ]);

      setStep("done");
      setQuestion("");
      return;
    }

    setMessages((current) => [
      ...current,
      userMessage,
      {
        from: "wama",
        text: getGeneralAnswer(value),
      },
    ]);

    setQuestion("");
  }

  function resetConversation() {
    setStep("name");
    setQuestion("");
    setLead({
      name: "",
      company: "",
      contact: "",
      need: "",
    });
    setMessages([
      {
        from: "wama",
        text: "Hola, soy WAMA. Te ayudo a elegir el módulo correcto y activar tu prueba. ¿Cómo te llamas?",
      },
    ]);
  }

  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      {isOpen && (
        <div className="mb-4 flex h-[660px] w-[390px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#111318] shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/10 bg-[#0B0C0E] p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
              Asistente WAMA
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
              Te ayudo a comenzar.
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#C4C7CC]">
              Te guío para elegir módulo, activar la prueba y dejar tus datos de
              contacto.
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

          {step === "done" && (
            <div className="border-t border-white/10 bg-[#0B0C0E] p-4">
              <div className="rounded-2xl border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">
                  Lead registrado
                </p>

                <p className="mt-2 text-sm leading-6 text-[#F5F6F7]">
                  {lead.name} · {lead.company}
                </p>

                <p className="text-sm leading-6 text-[#C4C7CC]">
                  Módulo sugerido: {suggestion.module}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-white/10 bg-[#111318] p-4">
            <div className="mb-3 grid grid-cols-2 gap-2">
              {step === "done" ? (
                <>
                  <a
                    href={getMailToLink()}
                    className="rounded-2xl bg-[#00E5D6] px-3 py-3 text-center text-xs font-black text-[#0B0C0E]"
                  >
                    Enviar al admin
                  </a>

                  <Link
                    href="/trial"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-xs font-bold text-[#F5F6F7]"
                  >
                    Activar prueba
                  </Link>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            <form onSubmit={handleAsk} className="flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/50"
                placeholder={
                  step === "name"
                    ? "Tu nombre..."
                    : step === "company"
                      ? "Nombre de empresa..."
                      : step === "contact"
                        ? "Celular o correo..."
                        : step === "need"
                          ? "Qué necesitas ordenar..."
                          : "Escribe otra pregunta..."
                }
              />

              <button
                type="submit"
                className="rounded-2xl bg-[#00E5D6] px-4 py-3 text-sm font-black text-[#0B0C0E]"
              >
                Enviar
              </button>
            </form>

            {step === "done" && (
              <button
                type="button"
                onClick={resetConversation}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-[#F5F6F7]"
              >
                Nuevo contacto
              </button>
            )}
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