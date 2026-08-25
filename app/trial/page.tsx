"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import WamaShell from "../../src/components/brand/WamaShell";

type ModuleKey = "sales" | "expense" | "operations";

const inputClass =
  "w-full rounded-2xl border border-[#D7DBE0] bg-[#F7F8FA] px-4 py-4 text-sm text-[#0B0C0E] outline-none transition placeholder:text-[#8B929D] focus:border-[#00AFA4] focus:bg-white";

const MODULES: Record<ModuleKey, { name: string; description: string }> = {
  sales: { name: "Sales Hub", description: "CRM y oportunidades" },
  expense: { name: "Expense Hub", description: "Rendiciones de gastos" },
  operations: { name: "Operations Hub", description: "Casos, alertas y equipos" },
};

export default function TrialPage() {
  const [form, setForm] = useState({
    companyName: "",
    companyRut: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    website: "",
    moduleKey: "sales" as ModuleKey,
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("module");
    if (requested === "sales" || requested === "expense" || requested === "operations") {
      setForm((current) => ({ ...current, moduleKey: requested }));
      setStep(2);
    }
  }, []);

  const selected = useMemo(() => MODULES[form.moduleKey], [form.moduleKey]);

  function continueWith(moduleKey: ModuleKey) {
    setForm((current) => ({ ...current, moduleKey }));
    setError("");
    setStep(2);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/trial/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        ownerEmail?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo activar la prueba.");
      }

      setSuccessEmail(data.ownerEmail || form.ownerEmail);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo activar la prueba.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WamaShell>
      <main className="overflow-hidden bg-[#0B0C0E] text-white">
        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden">
          <div className="pointer-events-none absolute right-[-12rem] top-[-12rem] h-[38rem] w-[38rem] rounded-full bg-[#00E5D6]/10 blur-[180px]" />

          <div className="relative mx-auto max-w-7xl px-6 py-14 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
                  Prueba WAMA por 15 días
                </p>

                <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl">
                  Empieza por el módulo que necesitas.
                </h1>

                <p className="mt-7 max-w-xl text-lg leading-8 text-[#B7BEC8]">
                  Crea tu empresa una sola vez. Cada módulo cuesta US$10 al mes e
                  incluye hasta 10 usuarios después de la prueba.
                </p>

                <div className="mt-9 grid gap-3">
                  <Progress active={step === 1 && !successEmail} done={step === 2 || Boolean(successEmail)} number="01" title="Elige tu módulo" />
                  <Progress active={step === 2 && !successEmail} done={Boolean(successEmail)} number="02" title="Crea tu empresa" />
                  <Progress active={Boolean(successEmail)} done={false} number="03" title="Recibe tu acceso" />
                </div>

                <div className="mt-9 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">
                    Modelo simple
                  </p>
                  <div className="mt-4 grid gap-3 text-sm text-[#D5DADF]">
                    <Benefit text="15 días sin cobro" />
                    <Benefit text="US$10/mes por módulo después del trial" />
                    <Benefit text="Hasta 10 usuarios incluidos por módulo" />
                    <Benefit text="Puedes activar otros módulos después" />
                  </div>
                </div>
              </div>

              <section className="rounded-[2rem] bg-white p-7 text-[#0B0C0E] shadow-[0_35px_110px_rgba(0,0,0,0.28)] sm:p-10">
                {successEmail ? (
                  <Success email={successEmail} moduleName={selected.name} />
                ) : step === 1 ? (
                  <ModuleStep onContinue={continueWith} />
                ) : (
                  <form onSubmit={submit}>
                    <div className="flex flex-col gap-4 border-b border-[#E2E6E9] pb-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#008F87]">
                          Paso 2 de 3
                        </p>
                        <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                          Crea tu empresa.
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-left text-sm font-black text-[#008F87] sm:text-right"
                      >
                        Cambiar módulo
                      </button>
                    </div>

                    <div className="mt-6 rounded-2xl bg-[#F2F7F7] p-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">
                        Módulo seleccionado
                      </p>
                      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <strong className="text-xl">{selected.name}</strong>
                          <p className="mt-1 text-sm text-[#69717D]">{selected.description}</p>
                        </div>
                        <div className="text-right">
                          <strong className="text-lg">US$10/mes</strong>
                          <p className="text-xs text-[#69717D]">hasta 10 usuarios</p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-6 text-sm leading-7 text-[#69717D]">
                      Estos datos se ingresan una sola vez. WAMA creará el portal
                      de tu empresa y enviará el acceso al administrador.
                    </p>

                    <div className="mt-7 grid gap-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Empresa">
                          <input
                            value={form.companyName}
                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                            className={inputClass}
                            placeholder="Nombre de la empresa"
                            required
                          />
                        </Field>

                        <Field label="RUT empresa">
                          <input
                            value={form.companyRut}
                            onChange={(e) => setForm({ ...form, companyRut: e.target.value })}
                            className={inputClass}
                            placeholder="76.123.456-7"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Administrador principal">
                          <input
                            value={form.ownerName}
                            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                            className={inputClass}
                            placeholder="Nombre y apellido"
                            required
                          />
                        </Field>

                        <Field label="Teléfono">
                          <input
                            value={form.ownerPhone}
                            onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                            className={inputClass}
                            placeholder="+56 9 1234 5678"
                          />
                        </Field>
                      </div>

                      <Field label="Correo administrador">
                        <input
                          type="email"
                          value={form.ownerEmail}
                          onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                          className={inputClass}
                          placeholder="correo@empresa.cl"
                          required
                        />
                      </Field>

                      <input
                        aria-hidden="true"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        className="hidden"
                      />

                      <div className="rounded-2xl border border-[#DDE3E7] bg-[#F7F9FA] p-5">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">
                          Esta prueba incluye
                        </p>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <Included text={selected.name} />
                          <Included text="15 días de acceso" />
                          <Included text="Hasta 10 usuarios" />
                          <Included text="Owner administrador" />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="mt-5 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {error}
                      </div>
                    )}

                    <button
                      disabled={loading}
                      type="submit"
                      className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Creando empresa y activando módulo…" : "Crear empresa y comenzar prueba"}
                    </button>

                    <p className="mt-5 text-center text-xs leading-6 text-[#7C8490]">
                      No solicitamos tarjeta para iniciar la prueba.
                    </p>
                  </form>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}

function ModuleStep({ onContinue }: { onContinue: (module: ModuleKey) => void }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#008F87]">
        Paso 1 de 3
      </p>
      <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
        ¿Qué quieres ordenar primero?
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-[#69717D]">
        Elige un módulo para comenzar. Los demás podrán activarse posteriormente
        desde el mismo Portal WAMA.
      </p>

      <div className="mt-8 grid gap-4">
        <ModuleCard
          name="Sales Hub"
          description="Prospectos, pipeline, actividades, propuestas y seguimiento comercial."
          onClick={() => onContinue("sales")}
        />
        <ModuleCard
          name="Expense Hub"
          description="Captura de documentos, OCR + IA, rendiciones, revisión y aprobación."
          onClick={() => onContinue("expense")}
        />
        <ModuleCard
          name="Operations Hub"
          description="Casos, alertas, equipos, responsables, evidencia y trazabilidad."
          onClick={() => onContinue("operations")}
        />
      </div>
    </div>
  );
}

function ModuleCard({
  name,
  description,
  onClick,
}: {
  name: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full gap-4 rounded-3xl border border-[#DCE1E5] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#00B8AE] hover:shadow-[0_16px_45px_rgba(0,184,174,0.10)] sm:grid-cols-[1fr_auto] sm:items-center"
    >
      <div>
        <strong className="text-xl">{name}</strong>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#69717D]">{description}</p>
      </div>
      <div className="sm:text-right">
        <strong className="text-lg">US$10/mes</strong>
        <p className="mt-1 text-xs text-[#69717D]">15 días gratis · hasta 10 usuarios</p>
        <span className="mt-3 inline-flex text-sm font-black text-[#008F87]">Elegir →</span>
      </div>
    </button>
  );
}

function Success({ email, moduleName }: { email: string; moduleName: string }) {
  return (
    <div className="py-5 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#00E5D6] text-3xl font-black">
        ✓
      </div>

      <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#008F87]">
        Paso 3 de 3 · Todo listo
      </p>

      <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
        Tu prueba está activa.
      </h2>

      <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#69717D]">
        Activamos <strong className="text-[#0B0C0E]">{moduleName}</strong> y
        enviamos el acceso a <strong className="text-[#0B0C0E]">{email}</strong>.
      </p>

      <div className="mt-7 rounded-2xl bg-[#F3F6F7] p-5 text-left text-sm leading-7 text-[#59616B]">
        <strong className="text-[#0B0C0E]">Qué ocurre ahora</strong>
        <br />
        1. Revisa el correo enviado por WAMA.
        <br />
        2. Ingresa con la clave temporal.
        <br />
        3. Crea tu clave personal.
        <br />
        4. Entrarás al Portal WAMA para gestionar el módulo e invitar a tu equipo.
      </div>

      <Link
        href="/login"
        className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E]"
      >
        Ir al acceso WAMA
      </Link>

      <p className="mt-5 text-xs leading-6 text-[#7C8490]">
        Si ya tenías una cuenta WAMA, utiliza tu contraseña actual.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black">{label}</span>
      {children}
    </label>
  );
}

function Progress({
  number,
  title,
  active,
  done,
}: {
  number: string;
  title: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border px-4 py-4 ${
        active
          ? "border-[#00E5D6]/50 bg-[#00E5D6]/10"
          : done
            ? "border-white/10 bg-white/[0.05]"
            : "border-white/10 bg-transparent"
      }`}
    >
      <span className={`text-xs font-black ${active || done ? "text-[#00E5D6]" : "text-[#6F787F]"}`}>
        {done ? "✓" : number}
      </span>
      <strong className={active || done ? "text-white" : "text-[#7F888F]"}>{title}</strong>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#00E5D6] text-[11px] font-black text-black">
        ✓
      </span>
      <span>{text}</span>
    </div>
  );
}

function Included({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 font-bold">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#00E5D6] text-[11px]">✓</span>
      {text}
    </div>
  );
}
