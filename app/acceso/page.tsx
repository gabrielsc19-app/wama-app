"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findTrialClient, trialClients } from "../../src/lib/wamaTrialClients";

export default function AccesoPage() {
  const router = useRouter();

  const [email, setEmail] = useState("demo@andesfacility.cl");
  const [password, setPassword] = useState("WamaTrial2026!");
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#F5F6F7]">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="inline-flex rounded-full border border-[#00E5D6]/35 bg-[#00E5D6]/10 px-5 py-2 text-sm font-black text-[#00E5D6]">
            Acceso portal
          </p>

          <h1 className="mt-8 text-6xl font-black leading-tight tracking-[-0.06em] md:text-8xl">
            Entra a tu portal WAMA.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#C4C7CC]">
            Ingresa con el correo y clave asignados a tu empresa. Desde tu portal
            podrás acceder al módulo activo, revisar tu prueba gratuita y comenzar
            a trabajar.
          </p>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00E5D6]">
              Accesos demo
            </p>

            <p className="mt-2 text-sm leading-6 text-[#C4C7CC]">
              Para pruebas internas, selecciona una empresa demo. En producción,
              cada cliente recibirá su acceso privado.
            </p>

            <div className="mt-4 grid gap-3">
              {trialClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    setEmail(client.email);
                    setPassword(client.password);
                    setError("");
                  }}
                  className="rounded-2xl border border-white/10 bg-[#111318] p-4 text-left transition hover:border-[#00E5D6]/45"
                >
                  <p className="font-black">{client.companyName}</p>
                  <p className="mt-1 text-sm text-[#C4C7CC]">{client.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-[2rem] border border-white/10 bg-[#111318] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
            Portal privado
          </p>

          <h2 className="mt-3 text-4xl font-black">Iniciar sesión</h2>

          <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
            Ingresa para continuar al panel privado de tu empresa.
          </p>

          <div className="mt-8 grid gap-5">
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
            Acceder a mi portal
          </button>

          <p className="mt-5 text-center text-xs font-semibold text-[#C4C7CC]">
            Prueba gratuita activa por 14 días.
          </p>
        </form>
      </section>
    </main>
  );
}