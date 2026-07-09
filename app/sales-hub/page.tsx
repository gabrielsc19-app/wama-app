import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

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
    stage: "Propuesta",
    amount: "$18M",
    owner: "Ejecutivo comercial",
  },
  {
    company: "Servicios Andes",
    stage: "Reunión",
    amount: "$9M",
    owner: "Ejecutivo comercial",
  },
  {
    company: "Grupo Pacífico",
    stage: "Negociación",
    amount: "$32M",
    owner: "Dirección comercial",
  },
];

const activities = [
  "Llamar a contacto principal de Empresa Norte",
  "Enviar propuesta actualizada a Grupo Pacífico",
  "Agendar reunión de diagnóstico con Servicios Andes",
  "Revisar cuentas sin actividad en los últimos 7 días",
];

export default function SalesHubPage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Sales Hub
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Dashboard comercial.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              Vista inicial del módulo comercial WAMA: target accounts,
              contactos, deals abiertos, monto en pipeline y próximas
              actividades.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <WamaButton href="/onboarding/sales-hub" variant="secondary">
              Onboarding
            </WamaButton>

            <WamaButton href="/modulos/sales-hub">
              Ver página comercial
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
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  Pipeline
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                  Deals recientes
                </h2>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                DEMO
              </span>
            </div>

            <div className="grid gap-4">
              {deals.map((deal) => (
                <div
                  key={deal.company}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <h3 className="font-bold text-[#F5F6F7]">
                      {deal.company}
                    </h3>
                    <p className="mt-1 text-sm text-[#C4C7CC]">
                      {deal.owner}
                    </p>
                  </div>

                  <div className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#C4C7CC]">
                    {deal.stage}
                  </div>

                  <div className="text-right text-lg font-black text-[#F5F6F7]">
                    {deal.amount}
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
                  key={activity}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#C4C7CC]"
                >
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#00E5D6]" />
                  {activity}
                </div>
              ))}
            </div>
          </WamaCard>
        </div>
      </section>
    </WamaShell>
  );
}