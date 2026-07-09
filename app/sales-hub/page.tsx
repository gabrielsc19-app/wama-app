"use client";

import { useEffect, useState } from "react";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

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
  trialDaysRemaining?: number;
};

const kpis = [
  {
    label: "Target accounts",
    value: "34",
    detail: "Empresas objetivo",
  },
  {
    label: "Contactos",
    value: "86",
    detail: "Personas registradas",
  },
  {
    label: "Deals abiertos",
    value: "18",
    detail: "Oportunidades activas",
  },
  {
    label: "Monto pipeline",
    value: "$128M",
    detail: "Potencial comercial",
  },
];

const deals = [
  {
    company: "Empresa Norte",
    contact: "Gerente Comercial",
    stage: "Propuesta",
    amount: "$18M",
    owner: "Ejecutivo comercial",
    probability: "65%",
  },
  {
    company: "Servicios Andes",
    contact: "Jefe de Operaciones",
    stage: "Reunión",
    amount: "$9M",
    owner: "Ejecutivo comercial",
    probability: "35%",
  },
  {
    company: "Grupo Pacífico",
    contact: "Dirección General",
    stage: "Negociación",
    amount: "$32M",
    owner: "Dirección comercial",
    probability: "80%",
  },
];

const activities = [
  {
    title: "Llamar a contacto principal de Empresa Norte",
    date: "Hoy",
    type: "Llamada",
  },
  {
    title: "Enviar propuesta actualizada a Grupo Pacífico",
    date: "Mañana",
    type: "Propuesta",
  },
  {
    title: "Agendar reunión de diagnóstico con Servicios Andes",
    date: "Esta semana",
    type: "Reunión",
  },
  {
    title: "Revisar cuentas sin actividad en los últimos 7 días",
    date: "Pendiente",
    type: "Seguimiento",
  },
];

const pipelineStages = [
  {
    name: "Prospecto",
    deals: 6,
    amount: "$22M",
    progress: "35%",
  },
  {
    name: "Contactado",
    deals: 4,
    amount: "$18M",
    progress: "45%",
  },
  {
    name: "Reunión",
    deals: 3,
    amount: "$24M",
    progress: "55%",
  },
  {
    name: "Propuesta",
    deals: 3,
    amount: "$31M",
    progress: "70%",
  },
  {
    name: "Negociación",
    deals: 2,
    amount: "$33M",
    progress: "82%",
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

export default function SalesHubPage() {
  const [trialCompany, setTrialCompany] = useState<TrialCompany>({
    companyName: "Empresa Demo",
    companyLogo: null,
    status: "trial",
    trialDaysRemaining: 14,
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
                  {trialCompany.companyName || "Empresa Demo"}
                </p>

                <h1 className="mt-1 text-3xl font-black text-[#F5F6F7] md:text-4xl">
                  Sales Hub by WAMA
                </h1>

                <p className="mt-2 text-sm text-[#C4C7CC]">
                  Portal comercial personalizado para la empresa cliente.
                </p>

                {(trialCompany.industry || trialCompany.companyRut) && (
                  <p className="mt-2 text-xs text-[#C4C7CC]/80">
                    {trialCompany.industry || "Rubro no informado"} ·{" "}
                    {trialCompany.companyRut || "RUT no informado"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00E5D6]">
                  Trial activo
                </p>
                <p className="mt-1 text-sm font-bold text-[#F5F6F7]">
                  {remainingDays} días restantes
                </p>
              </div>

              <WamaButton href="/licencia">Activar licencia</WamaButton>
            </div>
          </div>
        </WamaCard>

        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Dashboard comercial
            </div>

            <h2 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Pipeline, deals y actividades en una sola vista.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              Vista inicial del módulo comercial WAMA. Permite controlar cuentas
              objetivo, contactos, oportunidades, monto potencial y próximos
              pasos del equipo comercial.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <WamaButton href="/onboarding/sales-hub" variant="secondary">
              Onboarding
            </WamaButton>

            <WamaButton href="/trial" variant="secondary">
              Editar empresa
            </WamaButton>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <WamaCard key={kpi.label} className="p-6">
              <p className="text-sm text-[#C4C7CC]">{kpi.label}</p>

              <strong className="mt-3 block text-4xl font-black text-[#F5F6F7]">
                {kpi.value}
              </strong>

              <p className="mt-3 text-sm text-[#C4C7CC]">{kpi.detail}</p>
            </WamaCard>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <WamaCard className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  Pipeline
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                  Avance por etapa
                </h2>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                DEMO
              </span>
            </div>

            <div className="grid gap-4">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.name}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-[#F5F6F7]">
                        {stage.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#C4C7CC]">
                        {stage.deals} deals · {stage.amount}
                      </p>
                    </div>

                    <span className="text-sm font-bold text-[#00E5D6]">
                      {stage.progress}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-[#00E5D6]"
                      style={{ width: stage.progress }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </WamaCard>

          <WamaCard className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
              Actividades
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
              Próximos pasos
            </h2>

            <div className="mt-6 grid gap-3">
              {activities.map((activity) => (
                <div
                  key={activity.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[#C4C7CC]">
                      {activity.type}
                    </span>

                    <span className="text-xs font-bold text-[#00E5D6]">
                      {activity.date}
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-[#F5F6F7]">
                    {activity.title}
                  </p>
                </div>
              ))}
            </div>
          </WamaCard>
        </div>

        <div className="mt-8">
          <WamaCard className="p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  Deals recientes
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                  Oportunidades comerciales
                </h2>
              </div>

              <WamaButton href="/trial" variant="secondary">
                Configurar empresa
              </WamaButton>
            </div>

            <div className="grid gap-4">
              {deals.map((deal) => (
                <div
                  key={deal.company}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div>
                    <h3 className="font-bold text-[#F5F6F7]">
                      {deal.company}
                    </h3>

                    <p className="mt-1 text-sm text-[#C4C7CC]">
                      {deal.contact} · {deal.owner}
                    </p>
                  </div>

                  <div className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#C4C7CC]">
                    {deal.stage}
                  </div>

                  <div className="rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-2 text-sm font-bold text-[#00E5D6]">
                    {deal.probability}
                  </div>

                  <div className="text-right text-lg font-black text-[#F5F6F7]">
                    {deal.amount}
                  </div>
                </div>
              ))}
            </div>
          </WamaCard>
        </div>

        <WamaCard className="mt-8 p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Licencia
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Prueba gratis activa
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#C4C7CC]">
                La empresa puede usar Sales Hub durante 14 días. Al finalizar la
                prueba, el acceso completo requiere activar una licencia mensual
                o anual. En esta versión, la activación se gestiona
                comercialmente mediante factura, transferencia o link de pago.
              </p>
            </div>

            <WamaButton href="/licencia">Ver planes y activar</WamaButton>
          </div>
        </WamaCard>
      </section>
    </WamaShell>
  );
}