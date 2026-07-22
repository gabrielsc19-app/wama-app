"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WamaTrialClient } from "../../src/lib/wamaTrialClients";

export default function PortalPage() {
  const [client, setClient] = useState<WamaTrialClient | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("wamaActiveClient");

    if (!raw) {
      window.location.replace("/acceso");
      return;
    }

    try {
      setClient(JSON.parse(raw) as WamaTrialClient);
    } catch {
      window.localStorage.removeItem("wamaActiveClient");
      window.location.replace("/acceso");
    }
  }, []);

  function logout() {
    window.localStorage.removeItem("wamaActiveClient");
    window.location.replace("/acceso");
  }

  if (!client) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F7] text-[#0B0C0E]">
        <p className="text-sm font-black">Cargando portal...</p>
      </main>
    );
  }

  const moduleHref =
    client.moduleName === "Operación"
      ? "/operacion"
      : client.moduleName === "Finanzas"
        ? "/finanzas"
        : "/sales-hub/crm";

  const dashboardHref =
    client.moduleName === "Sales Hub"
      ? "/sales-hub/crm/dashboard"
      : client.moduleName === "Finanzas"
        ? "/finanzas"
        : "/reportes";

  return (
    <main className="min-h-screen bg-[#F5F6F7] text-[#0B0C0E]">
      <header className="border-b border-[#D7DBE0] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B0C0E] text-xl font-black text-[#00E5D6]">
              {client.logoText}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#008F87]">
                Portal WAMA
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                {client.companyName}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-[#D7DBE0] px-5 py-3 text-sm font-black transition hover:border-[#0B0C0E]"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
              Acceso activo
            </p>

            <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[1] tracking-[-0.06em] md:text-6xl">
              Tu portal WAMA está listo.
            </h2>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#626A76]">
              Entra al módulo activo y comienza a trabajar. La configuración
              avanzada de empresa y usuarios se realizará dentro del portal.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={moduleHref}
                className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]"
              >
                Entrar a {client.moduleName}
              </Link>

              <Link
                href={dashboardHref}
                className="inline-flex items-center justify-center rounded-full border-2 border-[#0B0C0E] bg-white px-8 py-4 text-sm font-black text-[#0B0C0E]"
              >
                Ver reportes
              </Link>
            </div>

            <div className="mt-14 divide-y divide-[#D7DBE0] border-y border-[#D7DBE0]">
              <PortalStep
                number="01"
                title="Revisa tu empresa"
                text="Completa la información principal y la configuración del portal."
              />
              <PortalStep
                number="02"
                title="Invita a tu equipo"
                text="Agrega usuarios y define permisos según cada responsabilidad."
              />
              <PortalStep
                number="03"
                title="Comienza a gestionar"
                text="Carga información y trabaja desde el módulo seleccionado."
              />
            </div>
          </div>

          <aside className="border-y border-[#D7DBE0] py-7 lg:sticky lg:top-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#008F87]">
              Licencia
            </p>

            <div className="mt-6 divide-y divide-[#D7DBE0]">
              <Info label="Estado" value="Trial activo" />
              <Info label="Días disponibles" value={`${client.trialDays} días`} />
              <Info label="Módulo" value={client.moduleName} />
              <Info label="Usuarios" value={`${client.userLimit}`} />
              <Info label="Después del trial" value={client.monthlyPrice} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 text-sm">
      <span className="font-bold text-[#68717D]">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}

function PortalStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-5 py-7 sm:grid-cols-[4rem_0.55fr_1fr]">
      <p className="text-sm font-black text-[#008F87]">{number}</p>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="text-base leading-7 text-[#69717D]">{text}</p>
    </div>
  );
}
