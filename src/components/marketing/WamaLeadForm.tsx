"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type FormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  need: string;
  module: string;
  website: string;
};

const emptyForm: FormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  need: "",
  module: "",
  website: "",
};

const inputClass =
  "w-full rounded-2xl border border-[#D7DDE2] bg-[#F7F9FA] px-4 py-3.5 text-sm text-[#0B0C0E] outline-none transition placeholder:text-[#8A939D] focus:border-[#00B8AE] focus:bg-white";

export default function WamaLeadForm({
  source = "home-contact",
}: {
  source?: string;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [tracking, setTracking] = useState({
    pageUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTracking({
      pageUrl: window.location.href,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
    });
  }, []);

  const canSend = useMemo(
    () =>
      form.name.trim().length >= 2 &&
      form.company.trim().length >= 2 &&
      (form.email.trim().length > 0 || form.phone.trim().length > 0),
    [form]
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend || status === "sending") return;

    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          suggestedModule: form.module,
          source,
          ...tracking,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo enviar la consulta.");
      }

      setStatus("done");
      setMessage(
        data.message ||
          "Recibimos tus datos. El equipo WAMA podrá contactarte."
      );
      setForm(emptyForm);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la consulta."
      );
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-[2rem] border border-[#BDEFEA] bg-[#ECFBF9] p-7">
        <CheckCircle2 className="h-10 w-10 text-[#008F87]" />
        <h3 className="mt-5 text-2xl font-black">Consulta recibida.</h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#59616B]">
          {message}
        </p>
        <a
          href="/trial"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#00E5D6] px-6 py-3 text-sm font-black text-[#0B0C0E]"
        >
          Probar WAMA ahora <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-[#DCE2E6] bg-white p-6 shadow-[0_20px_60px_rgba(11,12,14,.08)] sm:p-7"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tu nombre"
            required
          />
        </Field>

        <Field label="Empresa">
          <input
            className={inputClass}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Nombre de la empresa"
            required
          />
        </Field>

        <Field label="Correo">
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="correo@empresa.cl"
          />
        </Field>

        <Field label="Celular">
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+56 9 1234 5678"
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="¿Qué te interesa?">
          <select
            className={inputClass}
            value={form.module}
            onChange={(e) => setForm({ ...form, module: e.target.value })}
          >
            <option value="">Aún no lo sé</option>
            <option value="Sales Hub">Sales Hub</option>
            <option value="Expense Hub">Expense Hub</option>
            <option value="Operations Hub">Operations Hub</option>
          </select>
        </Field>

        <Field label="¿Qué necesitas ordenar?">
          <input
            className={inputClass}
            value={form.need}
            onChange={(e) => setForm({ ...form, need: e.target.value })}
            placeholder="Ej: seguimiento comercial"
          />
        </Field>
      </div>

      <input
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />

      {message && (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${
            status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-[#ECFBF9] text-[#006F68]"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSend || status === "sending"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0B0C0E] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "sending" ? "Enviando…" : "Quiero conocer WAMA"}
        {status !== "sending" && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-[#7A838D]">
        También puedes comenzar directamente una prueba gratuita de 15 días.
      </p>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[.12em] text-[#59616B]">
        {label}
      </span>
      {children}
    </label>
  );
}
