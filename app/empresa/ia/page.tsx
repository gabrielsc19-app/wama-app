"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronRight,
  CircleCheck,
  LoaderCircle,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type AiMode = "idle" | "openai" | "local" | "error";

const enterpriseContext = {
  companyName: "Empresa Demo SpA",
  activeModules: 3,
  usedLicenses: 27,
  availableLicenses: 13,
  activeProjects: 2,
  trustScore: 98,
  inactiveUsers: 3,
};

const recommendations = [
  {
    title: "Licencias disponibles",
    text: "Tienes 13 cupos libres entre los módulos activos.",
    status: "Todo en orden",
  },
  {
    title: "Usuarios por revisar",
    text: "Hay 3 usuarios sin actividad reciente. Conviene validar sus accesos.",
    status: "Revisar",
  },
  {
    title: "Proyectos",
    text: "Uno de los proyectos concentra la mayor parte de la actividad semanal.",
    status: "Analizar",
  },
];

const prompts = [
  "¿Cuántas licencias libres tengo?",
  "Resume el estado de seguridad",
  "Muéstrame usuarios sin actividad",
  "Dame un resumen ejecutivo de hoy",
];

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Hola. Soy WAMA AI. Puedo conversar contigo y ayudarte a revisar licencias, usuarios, proyectos, seguridad y el estado general de tu empresa.",
  },
];

export default function WamaAIPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AiMode>("idle");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const ask = async (text?: string) => {
    const value = (text ?? question).trim();
    if (!value || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", text: value },
    ];

    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/enterprise-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context: enterpriseContext,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        mode?: AiMode;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No fue posible consultar WAMA AI.");
      }

      setMode(data.mode || "openai");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.reply || "No recibí una respuesta válida. Intenta nuevamente.",
        },
      ]);
    } catch (error) {
      setMode("error");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Ocurrió un problema al consultar WAMA AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask();
  };

  const statusLabel =
    mode === "openai"
      ? "Conectada a OpenAI"
      : mode === "local"
        ? "Modo local: falta API Key"
        : mode === "error"
          ? "Conexión con problemas"
          : "Lista para conversar";

  return (
    <EnterpriseShell
      title="WAMA AI"
      subtitle="Inteligencia empresarial con contexto, permisos y datos de tu organización."
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-[2rem] bg-[#0B0C0E] text-white shadow-[0_24px_70px_rgba(11,12,14,.18)]">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00E5D6] text-[#0B0C0E]">
                <Bot className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#00E5D6]">
                    Agente empresarial
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-bold text-[#C4C7CC]">
                    {statusLabel}
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  Pregunta sobre tu empresa
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#AEB6BF]">
                  WAMA AI mantiene la conversación y utiliza únicamente el contexto empresarial autorizado.
                </p>
              </div>
            </div>
          </div>

          <div className="h-[420px] space-y-4 overflow-y-auto p-5 sm:p-7">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-[#00E5D6] font-bold text-[#0B0C0E]"
                      : "border border-white/10 bg-white/[0.06] text-[#E8ECEF]"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-[#C4C7CC]">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Analizando…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/10 p-4 sm:p-6">
            <form
              onSubmit={submit}
              className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2"
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Escribe una pregunta sobre tu empresa..."
                disabled={loading}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-[#7F8993] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00E5D6] text-[#0B0C0E] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Enviar pregunta"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={loading}
                  onClick={() => void ask(prompt)}
                  className="rounded-full border border-white/10 px-3 py-2 text-left text-[11px] font-bold text-[#C4C7CC] hover:border-[#00E5D6]/60 hover:text-white disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-6 shadow-[0_16px_45px_rgba(11,12,14,.06)] sm:p-7">
            <div className="flex items-center gap-3">
              <WandSparkles className="h-6 w-6 text-[#00AFA5]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#008F87]">
                  Informe automático
                </p>
                <h2 className="text-xl font-black">Resumen ejecutivo</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {recommendations.map((item) => (
                <article key={item.title} className="rounded-2xl bg-[#F5F7F8] p-4">
                  <div className="flex items-start gap-3">
                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#00AFA5]" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-[#69717D]">{item.text}</p>
                      <button className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#008F87]">
                        {item.status}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-[#DFFFFA] p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <Sparkles className="h-7 w-7 shrink-0 text-[#008F87]" />
              <div>
                <h2 className="text-lg font-black">IA con control empresarial</h2>
                <p className="mt-2 text-sm leading-6 text-[#50606A]">
                  La clave de OpenAI permanece exclusivamente en el servidor. El navegador nunca la recibe. Las consultas empresariales podrán auditarse en WAMA Trust cuando conectemos los datos productivos del tenant.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </EnterpriseShell>
  );
}
