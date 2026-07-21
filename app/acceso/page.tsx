"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findTrialClient, trialClients } from "../../src/lib/wamaTrialClients";

export default function AccesoPage() {
  const router = useRouter();
  const demoClient = trialClients[0];

  const [email, setEmail] = useState(demoClient.email);
  const [password, setPassword] = useState(demoClient.password);
  const [error, setError] = useState("");

  const [leadName, setLeadName] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadNeed, setLeadNeed] = useState("");
  const [leadSent, setLeadSent] = useState(false);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const client = findTrialClient(email, password);

    if (!client) {
      setError("No pudimos validar el acceso. Revisa el correo y la clave asignada.");
      return;
    }

    window.localStorage.setItem("wamaActiveClient", JSON.stringify(client));
    router.push("/portal");
  }

  function fillDemoAccess() {
    setEmail(demoClient.email);
    setPassword(demoClient.password);
    setError("");
  }

  function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lead = {
      name: leadName,
      company: leadCompany,
      contact: leadContact,
      need: leadNeed,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem("wamaLastLead", JSON.stringify(lead));
    setLeadSent(true);
  }

  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#F5F6F7]">
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="inline-flex rounded-full border border-[#00E5D6]/35 bg-[#00E5D6]/10 px-5 py-2 text-sm font-black text-[#00E5D6]">
              Portal de acceso WAMA
            </p>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-tight tracking-[-0.06em] md:text-7xl">
              Prueba un CRM real antes de activarlo para tu empresa.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              WAMA es una plataforma modular para ordenar ventas, operación,
              finanzas y reportes. En esta demo puedes entrar a un portal de
              prueba, revisar el Sales Hub y entender cómo funcionaría para tu
              equipo.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">
                  01
                </p>
                <h3 className="mt-3 text-xl font-black">Qué es un CRM</h3>
                <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
                  Es una herramienta para ordenar clientes, prospectos,
                  oportunidades, contactos, propuestas y seguimiento comercial.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">
                  02
                </p>
                <h3 className="mt-3 text-xl font-black">Qué puedes probar</h3>
                <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
                  Puedes entrar a una empresa demo, crear deals, mover etapas,
                  revisar pipeline y ver un dashboard comercial.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">
                  03
                </p>
                <h3 className="mt-3 text-xl font-black">Tu propio portal</h3>
                <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
                  Si te interesa, puedes solicitar una activación con el nombre,
                  logo, usuarios y datos reales de tu empresa.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-[#00E5D6]/20 bg-[#00E5D6]/10 p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
                Demo disponible
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Entra con un usuario de prueba.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#C4C7CC]">
                Este acceso es solo una demostración. Te permite conocer el flujo
                de WAMA sin usar datos reales. Luego podemos activar un portal
                propio para tu empresa.
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-[#111318] p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00E5D6] text-xl font-black text-[#0B0C0E]">
                      {demoClient.logoText}
                    </div>

                    <div>
                      <p className="text-lg font-black">{demoClient.companyName}</p>
                      <p className="mt-1 text-sm text-[#C4C7CC]">
                        Empresa demo · Sales Hub
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fillDemoAccess}
                    className="rounded-full border border-[#00E5D6]/35 bg-[#00E5D6] px-6 py-4 text-sm font-black text-[#0B0C0E] transition hover:shadow-[0_0_28px_rgba(0,229,214,0.25)]"
                  >
                    Usar acceso demo
                  </button>
                </div>

                <div className="mt-5 grid gap-2 rounded-2xl bg-[#0B0C0E] p-4 text-sm text-[#C4C7CC]">
                  <p>
                    <strong className="text-[#F5F6F7]">Correo demo:</strong>{" "}
                    {demoClient.email}
                  </p>
                  <p>
                    <strong className="text-[#F5F6F7]">Clave demo:</strong>{" "}
                    {demoClient.password}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <form
              onSubmit={handleLogin}
              className="rounded-[2rem] border border-white/10 bg-[#111318] p-7 shadow-[0_30px_120px_rgba(0,0,0,0.35)]"
            >
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
                Acceso al portal
              </p>

              <h2 className="mt-3 text-4xl font-black">Iniciar sesión</h2>

              <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
                Usa el usuario demo para probar WAMA. Cuando tengas tu portal
                real, ingresarás con las credenciales de tu empresa.
              </p>

              <div className="mt-7 grid gap-5">
                <label className="grid gap-2">
                  <span className="text-sm font-black">Correo</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 text-sm outline-none focus:border-[#00E5D6]/50"
                    placeholder="usuario@empresa.cl"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black">Clave</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    className="rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 text-sm outline-none focus:border-[#00E5D6]/50"
                    placeholder="Clave asignada"
                  />
                </label>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="mt-7 w-full rounded-full bg-[#00E5D6] px-6 py-4 text-sm font-black text-[#0B0C0E]"
              >
                Entrar a la demo
              </button>
            </form>

            <form
              onSubmit={handleLeadSubmit}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"
            >
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
                Hazlo realidad
              </p>

              <h2 className="mt-3 text-4xl font-black">
                Lleva tu venta y tu gestión al siguiente nivel.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
                Déjanos tus datos y revisamos contigo cómo activar WAMA para tu
                empresa, con tus usuarios, módulos y flujo de trabajo.
              </p>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <input
                  value={leadName}
                  onChange={(event) => setLeadName(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 text-sm outline-none focus:border-[#00E5D6]/50"
                  placeholder="Nombre"
                  required
                />

                <input
                  value={leadCompany}
                  onChange={(event) => setLeadCompany(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 text-sm outline-none focus:border-[#00E5D6]/50"
                  placeholder="Empresa"
                  required
                />

                <input
                  value={leadContact}
                  onChange={(event) => setLeadContact(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 text-sm outline-none focus:border-[#00E5D6]/50 md:col-span-2"
                  placeholder="Correo o celular"
                  required
                />

                <textarea
                  value={leadNeed}
                  onChange={(event) => setLeadNeed(event.target.value)}
                  className="min-h-24 resize-none rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 text-sm outline-none focus:border-[#00E5D6]/50 md:col-span-2"
                  placeholder="¿Qué quieres ordenar primero: ventas, operación, finanzas o reportes?"
                  required
                />
              </div>

              {leadSent && (
                <div className="mt-5 rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 p-4 text-sm font-bold text-[#F5F6F7]">
                  Perfecto. Tus datos quedaron registrados para seguimiento comercial.
                </div>
              )}

              <button
                type="submit"
                className="mt-6 w-full rounded-full border border-white/15 bg-white px-6 py-4 text-sm font-black text-[#0B0C0E]"
              >
                Solicitar activación WAMA
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}