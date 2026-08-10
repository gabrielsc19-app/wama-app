"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import WamaShell from "../../src/components/brand/WamaShell";

const inputClass = "w-full rounded-2xl border border-[#D7DBE0] bg-[#F7F8FA] px-4 py-4 text-sm text-[#0B0C0E] outline-none transition placeholder:text-[#8B929D] focus:border-[#00AFA4] focus:bg-white";

export default function TrialPage() {
  const [form, setForm] = useState({
    companyName: "",
    companyRut: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    website: "",
    moduleKey: "expense" as "expense" | "sales" | "operations",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("module");
    if (requested === "sales" || requested === "expense" || requested === "operations") setForm((current) => ({ ...current, moduleKey: requested }));
  }, []);

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
      const data = await response.json() as { ok?: boolean; error?: string; ownerEmail?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo activar la prueba.");
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
          <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:py-24">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">Prueba gratis por 15 días</p>
              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl">Activa el módulo que tu empresa necesita.</h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#B7BEC8]">Crea un único portal WAMA y prueba Sales Hub, Expense Hub u Operations Hub. Después podrás activar los demás módulos desde la misma empresa.</p>
              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                <Benefit number="01" text="15 días de prueba sin pago inicial" />
                <Benefit number="02" text="10 usuarios independientes por módulo" />
                <Benefit number="03" text="Correo inmediato con acceso administrador" />
                <Benefit number="04" text="Uso en computador, tablet y aplicación móvil" />
              </div>
            </div>

            <section className="rounded-[2rem] bg-white p-7 text-[#0B0C0E] shadow-[0_35px_110px_rgba(0,0,0,0.28)] sm:p-10">
              {successEmail ? (
                <div className="py-6 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#00E5D6] text-3xl font-black">✓</div>
                  <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#008F87]">Portal creado</p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">Revisa tu correo.</h2>
                  <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#69717D]">Enviamos las claves de acceso a <strong className="text-[#0B0C0E]">{successEmail}</strong> desde <strong className="text-[#0B0C0E]">contacto@wamaapp.com</strong>.</p>
                  <div className="mt-7 rounded-2xl bg-[#F3F6F7] p-5 text-left text-sm leading-7 text-[#59616B]">
                    <strong className="text-[#0B0C0E]">Siguiente paso</strong><br />Abre el correo, ingresa con la clave temporal y crea tu clave personal. Desde ahí entrarás directamente al Portal WAMA.
                  </div>
                  <Link href="/login" className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E]">Ir a Acceso al portal</Link>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#008F87]">Datos de activación</p>
                  <h2 className="mt-4 text-4xl font-black tracking-[-0.05em]">Crea tu portal.</h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[#69717D]">Completa estos datos una sola vez. WAMA creará la empresa y enviará el acceso al administrador.</p>

                  <div className="mt-8 grid gap-5">
                    <Field label="Módulo que quieres probar">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <ModuleChoice active={form.moduleKey === "expense"} title="Expense Hub" text="Rendiciones de gastos" onClick={() => setForm({ ...form, moduleKey: "expense" })} />
                        <ModuleChoice active={form.moduleKey === "sales"} title="Sales Hub" text="CRM y oportunidades" onClick={() => setForm({ ...form, moduleKey: "sales" })} />
                        <ModuleChoice active={form.moduleKey === "operations"} title="Operations Hub" text="Casos y alertas" onClick={() => setForm({ ...form, moduleKey: "operations" })} />
                      </div>
                    </Field>
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Empresa"><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputClass} placeholder="Nombre de la empresa" required /></Field>
                      <Field label="RUT empresa"><input value={form.companyRut} onChange={(e) => setForm({ ...form, companyRut: e.target.value })} className={inputClass} placeholder="76.123.456-7" /></Field>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Administrador principal"><input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className={inputClass} placeholder="Nombre y apellido" required /></Field>
                      <Field label="Teléfono"><input value={form.ownerPhone} onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })} className={inputClass} placeholder="+56 9 1234 5678" /></Field>
                    </div>
                    <Field label="Correo administrador"><input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} className={inputClass} placeholder="correo@empresa.cl" required /></Field>
                    <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" />

                    <div className="rounded-2xl border border-[#DDE3E7] bg-[#F7F9FA] p-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">Tu prueba incluye</p>
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <Included text={form.moduleKey === "expense" ? "Expense Hub" : form.moduleKey === "sales" ? "Sales Hub / CRM" : "Operations Hub"} />
                        <Included text="15 días de acceso" />
                        <Included text="10 usuarios incluidos" />
                        <Included text="Administrador principal" />
                      </div>
                      <p className="mt-4 text-xs leading-5 text-[#69717D]">Cada módulo posee sus propias 10 licencias. El administrador ocupa el primer cupo del módulo activado y puede invitar a 9 personas más.</p>
                    </div>
                  </div>

                  {error && <div className="mt-5 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
                  <button disabled={loading} type="submit" className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Creando portal y enviando acceso…" : "Crear mi portal"}</button>
                  <p className="mt-5 text-center text-xs leading-6 text-[#7C8490]">Recibirás el correo de acceso inmediatamente desde contacto@wamaapp.com.</p>
                </form>
              )}
            </section>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2"><span className="text-sm font-black">{label}</span>{children}</label>;
}
function Benefit({ number, text }: { number: string; text: string }) {
  return <div className="grid grid-cols-[3rem_1fr] gap-4 py-5"><span className="text-xs font-black text-[#00E5D6]">{number}</span><strong className="text-sm">{text}</strong></div>;
}
function Included({ text }: { text: string }) {
  return <div className="flex items-center gap-2 font-bold"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#00E5D6] text-[11px]">✓</span>{text}</div>;
}
function ModuleChoice({ active, title, text, onClick }: { active: boolean; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${active ? "border-[#00AFA4] bg-[#DFFFFA]" : "border-[#D7DBE0] bg-white hover:border-[#00AFA4]"}`}><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs text-[#69717D]">{text}</span></button>;
}
