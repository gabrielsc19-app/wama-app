"use client";

import { useEffect, useState } from "react";
import WamaShell from "../../../src/components/brand/WamaShell";
import WamaButton from "../../../src/components/brand/WamaButton";
import WamaCard from "../../../src/components/brand/WamaCard";

type TrialCompany = {
  companyName: string;
  companyRut?: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  selectedModule?: string;
  companyLogo?: string | null;
  status?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
};

const defaultPipeline = [
  "Prospecto",
  "Contactado",
  "Reunión",
  "Propuesta",
  "Negociación",
  "Cierre",
];

const setupBlocks = [
  {
    title: "Empresa",
    description:
      "Datos principales de la empresa que está activando WAMA Sales Hub.",
    status: "Configurado",
  },
  {
    title: "Usuarios comerciales",
    description:
      "Equipo que gestionará contactos, oportunidades, actividades y seguimiento.",
    status: "Pendiente",
  },
  {
    title: "Target accounts",
    description:
      "Empresas objetivo que el equipo comercial quiere prospectar o cerrar.",
    status: "Pendiente",
  },
  {
    title: "Contactos",
    description:
      "Personas clave asociadas a cada empresa objetivo: cargo, correo y teléfono.",
    status: "Pendiente",
  },
  {
    title: "Deals iniciales",
    description:
      "Oportunidades comerciales con monto estimado, etapa, probabilidad y responsable.",
    status: "Pendiente",
  },
  {
    title: "Pipeline",
    description:
      "Etapas comerciales que ordenan el avance desde prospecto hasta cierre.",
    status: "Base lista",
  },
];

function getRemainingDays(trialEndsAt?: string) {
  if (!trialEndsAt) return 14;

  const today = new Date();
  const endDate = new Date(trialEndsAt);
  const diff = endDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(days, 0);
}

export default function SalesHubOnboardingPage() {
  const [trialCompany, setTrialCompany] = useState<TrialCompany>({
    companyName: "Empresa Demo",
    selectedModule: "Sales Hub",
    companyLogo: null,
    status: "trial",
  });

  useEffect(() => {
    const storedTrial = localStorage.getItem("wamaTrialCompany");

    if (!storedTrial) return;

    try {
      const parsedTrial = JSON.parse(storedTrial) as TrialCompany;
      setTrialCompany(parsedTrial);
    } catch {
      localStorage.removeItem("wamaTrialCompany");
    }
  }, []);

  const remainingDays = getRemainingDays(trialCompany.trialEndsAt);

  const companyInitial = trialCompany.companyName
    ? trialCompany.companyName.slice(0, 1).toUpperCase()
    : "E";

  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-14">
        <WamaCard className="mb-8 p-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-2xl font-black text-[#00E5D6]">
                {trialCompany.companyLogo ? (
                  <img
                    src={trialCompany.companyLogo}
                    alt={`Logo ${trialCompany.companyName}`}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  companyInitial
                )}
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  Canvas de configuración
                </p>

                <h1 className="mt-1 text-3xl font-black text-[#F5F6F7] md:text-4xl">
                  {trialCompany.companyName || "Empresa Demo"} · Sales Hub
                </h1>

                <p className="mt-2 text-sm text-[#C4C7CC]">
                  Configuración inicial antes de entrar al CRM comercial.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00E5D6]">
                Trial activo
              </p>
              <p className="mt-1 text-sm font-bold text-[#F5F6F7]">
                {remainingDays} días restantes
              </p>
            </div>
          </div>
        </WamaCard>

        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Módulo Sales Hub
            </div>

            <h2 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Ordena la estructura comercial antes de cargar negocios.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              Este canvas resume la configuración base del módulo: empresa,
              usuarios comerciales, cuentas objetivo, contactos, deals iniciales
              y pipeline. Luego el cliente puede entrar al CRM y comenzar a
              operar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <WamaButton href="/sales-hub/crm">Continuar al CRM</WamaButton>

            <WamaButton href="/acceso/sales-hub" variant="secondary">
              Volver al acceso
            </WamaButton>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <WamaCard className="p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Canvas inicial
              </p>

              <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Estado de configuración
              </h3>
            </div>

            <div className="grid gap-4">
              {setupBlocks.map((block, index) => (
                <div
                  key={block.title}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[auto_1fr_auto]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                    {index + 1}
                  </div>

                  <div>
                    <h4 className="font-bold text-[#F5F6F7]">{block.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-[#C4C7CC]">
                      {block.description}
                    </p>
                  </div>

                  <span className="h-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#C4C7CC]">
                    {block.status}
                  </span>
                </div>
              ))}
            </div>
          </WamaCard>

          <div className="grid gap-6">
            <WamaCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Empresa
              </p>

              <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Datos cargados
              </h3>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#C4C7CC]">
                    Empresa
                  </p>
                  <p className="mt-2 font-bold text-[#F5F6F7]">
                    {trialCompany.companyName || "No informado"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#C4C7CC]">
                    RUT
                  </p>
                  <p className="mt-2 font-bold text-[#F5F6F7]">
                    {trialCompany.companyRut || "No informado"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#C4C7CC]">
                    Rubro
                  </p>
                  <p className="mt-2 font-bold text-[#F5F6F7]">
                    {trialCompany.industry || "No informado"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#C4C7CC]">
                    Responsable
                  </p>
                  <p className="mt-2 font-bold text-[#F5F6F7]">
                    {trialCompany.contactName || "No informado"}
                  </p>
                </div>
              </div>
            </WamaCard>

            <WamaCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Pipeline base
              </p>

              <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Etapas comerciales
              </h3>

              <div className="mt-6 grid gap-3">
                {defaultPipeline.map((stage, index) => (
                  <div
                    key={stage}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                      {index + 1}
                    </span>

                    <span className="text-sm font-semibold text-[#F5F6F7]">
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </WamaCard>
          </div>
        </div>

        <WamaCard className="mt-8 p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Siguiente paso
              </p>

              <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Entrar al CRM para cargar deals
              </h3>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#C4C7CC]">
                Una vez revisado el canvas, el cliente puede entrar al CRM para
                cargar oportunidades comerciales, moverlas por etapa, controlar
                monto de pipeline y registrar actividades.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <WamaButton href="/sales-hub/crm">Continuar al CRM</WamaButton>

              <WamaButton href="/licencia" variant="secondary">
                Ver licencia
              </WamaButton>
            </div>
          </div>
        </WamaCard>
      </section>
    </WamaShell>
  );
}