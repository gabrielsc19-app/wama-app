"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WamaTrialClient } from "../../src/lib/wamaTrialClients";

export default function PortalPage() {
  const [client, setClient] = useState<WamaTrialClient | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("wamaActiveClient");

    if (!raw) {
      window.location.href = "/acceso";
      return;
    }

    try {
      setClient(JSON.parse(raw));
    } catch {
      window.location.href = "/acceso";
    }
  }, []);

  function logout() {
    window.localStorage.removeItem("wamaActiveClient");
    window.location.href = "/acceso";
  }

  if (!client) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F7] text-[#0B0C0E]">
        <p className="text-sm font-black">Cargando portal...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F6F7] text-[#0B0C0E]">
      <header className="border-b border-[#D7DBE0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00E5D6] text-2xl font-black">
              {client.logoText}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
                Portal WAMA
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                {client.companyName}
              </h1>

              <p className="mt-1 text-sm text-[#5F6673]">
                {client.industry} · {client.rut}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-[#D7DBE0] px-5 py-3 text-sm font-black"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-10">
        <div className="rounded-[2rem] border border-[#D7DBE0] bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
                Acceso activo
              </p>

              <h2 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                Tu prueba WAMA está lista.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5F6673]">
                Desde aquí puedes entrar al módulo contratado, cargar información
                inicial, crear usuarios y comenzar a trabajar en tu portal.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sales-hub/crm"
                  className="rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E]"
                >
                  Entrar a Sales Hub
                </Link>

                <Link
                  href="/sales-hub/crm/dashboard"
                  className="rounded-full border border-[#D7DBE0] px-7 py-4 text-sm font-black"
                >
                  Ver dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#D7DBE0] bg-[#F7F9FB] p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
                Licencia
              </p>

              <div className="mt-5 grid gap-4">
                <Info label="Estado" value="Trial activo" />
                <Info label="Días restantes" value={`${client.trialDays} días`} />
                <Info label="Módulo" value={client.moduleName} />
                <Info label="Usuarios incluidos" value={`${client.userLimit}`} />
                <Info label="Precio luego del trial" value={client.monthlyPrice} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Step
            number="01"
            title="Configura tu empresa"
            text="Revisa los datos principales, usuarios y permisos iniciales."
          />

          <Step
            number="02"
            title="Carga información"
            text="Crea prospectos, contactos, deals o importa tu ficha comercial."
          />

          <Step
            number="03"
            title="Trabaja tu módulo"
            text="Entra al CRM, mueve etapas y revisa reportes ejecutivos."
          />
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#D7DBE0] pb-3 text-sm last:border-b-0">
      <span className="font-bold text-[#63708A]">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#D7DBE0] bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6FFFC] text-sm font-black text-[#00AFA4]">
        {number}
      </div>

      <h3 className="mt-5 text-2xl font-black">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-[#5F6673]">{text}</p>
    </div>
  );
}