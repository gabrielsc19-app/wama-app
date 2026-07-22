"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WamaShell from "../../src/components/brand/WamaShell";
import {
  findTrialClient,
  trialClients,
  type WamaTrialClient,
} from "../../src/lib/wamaTrialClients";

export default function AccesoPage() {
  const router = useRouter();
  const demoClient = trialClients[0];

  const [email, setEmail] = useState(demoClient.email);
  const [password, setPassword] = useState(demoClient.password);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function findCreatedTrial(
    enteredEmail: string,
    enteredPassword: string,
  ): WamaTrialClient | null {
    const raw = window.localStorage.getItem("wamaTrialCompany");

    if (!raw) return null;

    try {
      const stored = JSON.parse(raw) as WamaTrialClient;

      if (
        stored.email.toLowerCase() === enteredEmail.trim().toLowerCase() &&
        stored.password === enteredPassword.trim()
      ) {
        return stored;
      }
    } catch {
      return null;
    }

    return null;
  }

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const staticClient = findTrialClient(email, password);
    const createdTrial = findCreatedTrial(email, password);
    const client = staticClient ?? createdTrial;

    if (!client) {
      setError(
        "No pudimos validar el acceso. Revisa el correo y la clave asignada.",
      );
      return;
    }

    window.localStorage.setItem(
      "wamaActiveClient",
      JSON.stringify(client),
    );

    router.push("/portal");
  }

  function fillDemoAccess() {
    setEmail(demoClient.email);
    setPassword(demoClient.password);
    setError("");
  }

  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <section className="bg-[#0B0C0E] text-white">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-28">
            <div>
              <Link
                href="/"
                className="text-sm font-black text-[#AAB2BC] transition hover:text-[#00E5D6]"
              >
                ← Volver al inicio
              </Link>

              <p className="mt-14 text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
                Acceso al portal
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.065em] md:text-7xl">
                Entra a WAMA.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#B7BEC8]">
                Ingresa con el usuario demo o con las credenciales creadas al
                activar tu prueba gratuita.
              </p>

              <div className="mt-10 border-y border-white/10 py-7">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00E5D6]">
                  Acceso demo disponible
                </p>

                <p className="mt-4 text-lg font-black">
                  {demoClient.companyName}
                </p>
                <p className="mt-2 text-sm text-[#AEB6C0]">
                  {demoClient.email}
                </p>

                <button
                  type="button"
                  onClick={fillDemoAccess}
                  className="mt-6 rounded-full border border-white/20 px-6 py-3 text-sm font-black transition hover:border-[#00E5D6] hover:text-[#00E5D6]"
                >
                  Usar credenciales demo
                </button>
              </div>
            </div>

            <form
              onSubmit={handleLogin}
              className="rounded-[2rem] bg-white p-7 text-[#0B0C0E] shadow-[0_35px_110px_rgba(0,0,0,0.28)] sm:p-10"
            >
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#008F87]">
                Portal WAMA
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em]">
                Iniciar sesión
              </h2>

              <div className="mt-8 grid gap-5">
                <label className="grid gap-2">
                  <span className="text-sm font-black">Correo</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    required
                    className={inputClass}
                    placeholder="correo@empresa.cl"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black">Clave</span>

                  <div className="relative">
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={showPassword ? "text" : "password"}
                      required
                      className={`${inputClass} pr-24`}
                      placeholder="Clave asignada"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#008F87]"
                    >
                      {showPassword ? "Ocultar" : "Ver clave"}
                    </button>
                  </div>
                </label>
              </div>

              {error && (
                <div className="mt-5 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="mt-7 w-full rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5"
              >
                Entrar al portal
              </button>

              <div className="mt-6 border-t border-[#E0E4E8] pt-6 text-center">
                <p className="text-sm text-[#69717D]">
                  ¿Todavía no tienes un portal?
                </p>

                <Link
                  href="/trial"
                  className="mt-3 inline-flex text-sm font-black text-[#008F87]"
                >
                  Activar prueba gratis →
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[#D7DBE0] bg-[#F7F8FA] px-4 py-4 text-sm text-[#0B0C0E] outline-none transition placeholder:text-[#8B929D] focus:border-[#00AFA4] focus:bg-white";
