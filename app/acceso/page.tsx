"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaDemoVideo from "../../src/components/marketing/WamaDemoVideo";
import {
  findTrialClient,
  trialClients,
} from "../../src/lib/wamaTrialClients";

export default function AccesoPage() {
  const router = useRouter();
  const demoClient = trialClients[0];

  const [email, setEmail] = useState(demoClient.email);
  const [password, setPassword] = useState(demoClient.password);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const client = findTrialClient(email.trim(), password);

    if (!client) {
      setError(
        "No pudimos validar el acceso. Revisa el correo y la clave asignada.",
      );
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

  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <section className="bg-[#0B0C0E] text-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
            <Link
              href="/"
              className="text-sm font-black text-[#AAB2BC] transition hover:text-[#00E5D6]"
            >
              ← Volver al inicio
            </Link>

            <div className="mt-14 grid gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
                  Demo WAMA Sales
                </p>
                <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.065em] md:text-7xl">
                  Explora WAMA antes de implementarlo.
                </h1>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-[#B7BEC8]">
                  Revisa un entorno comercial ficticio y conoce el flujo de Sales
                  Hub sin utilizar datos reales.
                </p>
              </div>

              <div className="border-l border-white/15 pl-0 lg:pl-9">
                <p className="text-sm leading-7 text-[#AEB6C0]">
                  Empresa demo: <strong className="text-white">Vertex Facilities</strong>
                </p>
                <p className="mt-2 text-sm leading-7 text-[#AEB6C0]">
                  Todos los clientes, contactos y oportunidades son ficticios.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F6F7]">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:py-32">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
                Demostración
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">
                Mira el producto antes de ingresar.
              </h2>
              <p className="mt-6 text-base leading-7 text-[#69717D]">
                Recorre el pipeline, una oportunidad, el dashboard y la base de
                clientes.
              </p>
            </div>

            <WamaDemoVideo />
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-32">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
                Acceso demo
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">
                Entra y prueba WAMA.
              </h2>

              <div className="mt-8 border-y border-[#DDE1E6] py-7">
                <p className="text-sm font-black">Empresa</p>
                <p className="mt-2 text-base text-[#69717D]">
                  {demoClient.companyName}
                </p>
                <p className="mt-5 text-sm font-black">Correo</p>
                <p className="mt-2 break-all text-base text-[#69717D]">
                  {demoClient.email}
                </p>
                <p className="mt-5 text-sm font-black">Clave</p>
                <p className="mt-2 text-base text-[#69717D]">
                  {demoClient.password}
                </p>

                <button
                  type="button"
                  onClick={fillDemoAccess}
                  className="mt-7 rounded-full border-2 border-[#0B0C0E] px-6 py-3 text-sm font-black transition hover:bg-[#0B0C0E] hover:text-white"
                >
                  Completar credenciales
                </button>
              </div>
            </div>

            <form
              onSubmit={handleLogin}
              className="rounded-[2rem] bg-[#0B0C0E] p-7 text-white shadow-[0_35px_110px_rgba(11,12,14,0.2)] sm:p-10"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00E5D6]">
                Portal WAMA
              </p>
              <h3 className="mt-4 text-4xl font-black tracking-[-0.05em]">
                Iniciar sesión
              </h3>

              <div className="mt-8 grid gap-5">
                <label className="grid gap-2">
                  <span className="text-sm font-black">Correo</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    required
                    className="rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 text-sm outline-none focus:border-[#00E5D6]/70"
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
                      className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 pr-24 text-sm outline-none focus:border-[#00E5D6]/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#00E5D6]"
                    >
                      {showPassword ? "Ocultar" : "Ver clave"}
                    </button>
                  </div>
                </label>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="mt-7 w-full rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E]"
              >
                Entrar a WAMA
              </button>
            </form>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}
