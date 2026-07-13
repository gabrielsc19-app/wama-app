import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";
import WamaButton from "../../src/components/brand/WamaButton";

const executiveKpis = [
  {
    label: "Riesgo operativo",
    value: "Medio",
    detail: "3 casos fuera de SLA",
    progress: "64%",
  },
  {
    label: "Pipeline comercial",
    value: "$128M",
    detail: "18 deals activos",
    progress: "78%",
  },
  {
    label: "Finanzas",
    value: "$42M",
    detail: "Pendiente por validar",
    progress: "52%",
  },
  {
    label: "Cumplimiento",
    value: "86%",
    detail: "Indicador general",
    progress: "86%",
  },
];

const moduleReport = [
  {
    title: "Sales Hub",
    value: "$128M",
    subtitle: "Pipeline comercial",
    progress: "78%",
    decision: "Priorizar deals en negociación y propuestas enviadas.",
  },
  {
    title: "Operación",
    value: "12",
    subtitle: "Casos abiertos",
    progress: "64%",
    decision: "Revisar responsables y casos fuera de SLA.",
  },
  {
    title: "Finanzas",
    value: "$42M",
    subtitle: "Documentos pendientes",
    progress: "52%",
    decision: "Validar cartola y documentos vencidos.",
  },
];

const chartBars = [
  { label: "Ventas", value: "78%", amount: "$128M" },
  { label: "Operación", value: "64%", amount: "12 casos" },
  { label: "Finanzas", value: "52%", amount: "$42M" },
  { label: "Usuarios", value: "40%", amount: "4/10" },
];

const alerts = [
  {
    title: "Deals sin seguimiento",
    area: "Sales Hub",
    level: "Alta",
  },
  {
    title: "Casos fuera de SLA",
    area: "Operación",
    level: "Media",
  },
  {
    title: "Documentos sin conciliación",
    area: "Finanzas",
    level: "Media",
  },
];

export default function ReportsPage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Reportes ejecutivos
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
              Mira el negocio antes de decidir.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#C4C7CC]">
              WAMA resume ventas, operación y finanzas en una vista ejecutiva
              para detectar riesgos, prioridades y oportunidades.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <WamaButton href="/trial">Prueba gratis</WamaButton>
            <WamaButton href="/login" variant="secondary">
              Acceso portal
            </WamaButton>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {executiveKpis.map((kpi) => (
            <WamaCard key={kpi.label} className="p-6">
              <p className="text-sm text-[#C4C7CC]">{kpi.label}</p>

              <strong className="mt-3 block text-4xl font-black text-[#F5F6F7]">
                {kpi.value}
              </strong>

              <p className="mt-3 text-sm text-[#C4C7CC]">{kpi.detail}</p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-2 animate-[wamaGrow_1.2s_ease-out] rounded-full bg-[#00E5D6]"
                  style={{ width: kpi.progress }}
                />
              </div>
            </WamaCard>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <WamaCard className="p-6">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  Análisis consolidado
                </p>

                <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                  Estado general por módulo
                </h2>
              </div>

              <span className="rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-bold text-[#00E5D6]">
                Demo ejecutivo
              </span>
            </div>

            <div className="grid gap-5">
              {moduleReport.map((module) => (
                <div
                  key={module.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-2xl font-black text-[#F5F6F7]">
                        {module.title}
                      </h3>

                      <p className="mt-1 text-sm text-[#C4C7CC]">
                        {module.subtitle}
                      </p>
                    </div>

                    <strong className="text-3xl font-black text-[#F5F6F7]">
                      {module.value}
                    </strong>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-3 animate-[wamaGrow_1.3s_ease-out] rounded-full bg-[#00E5D6]"
                      style={{ width: module.progress }}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#00E5D6]/20 bg-[#00E5D6]/10 p-4 text-sm leading-6 text-[#F5F6F7]">
                    <strong className="text-[#00E5D6]">
                      Decisión sugerida:
                    </strong>{" "}
                    {module.decision}
                  </div>
                </div>
              ))}
            </div>
          </WamaCard>

          <div className="grid gap-6">
            <WamaCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Score WAMA
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                Salud general
              </h2>

              <div className="mx-auto mt-8 flex h-56 w-56 items-center justify-center rounded-full border-[18px] border-[#00E5D6] bg-[#00E5D6]/10 shadow-[0_0_60px_rgba(0,229,214,0.18)] animate-[wamaPulse_2.4s_ease-in-out_infinite]">
                <div className="text-center">
                  <strong className="block text-5xl font-black text-[#F5F6F7]">
                    86%
                  </strong>
                  <span className="text-sm font-semibold text-[#C4C7CC]">
                    Controlado
                  </span>
                </div>
              </div>

              <p className="mt-8 text-center text-sm leading-7 text-[#C4C7CC]">
                Indicador consolidado considerando actividad comercial,
                cumplimiento operativo y validación financiera.
              </p>
            </WamaCard>

            <WamaCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Alertas para decidir
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                Prioridades
              </h2>

              <div className="mt-6 grid gap-3">
                {alerts.map((alert, index) => (
                  <div
                    key={alert.title}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                        {index + 1}
                      </span>

                      <div>
                        <p className="font-bold text-[#F5F6F7]">
                          {alert.title}
                        </p>
                        <p className="text-sm text-[#C4C7CC]">{alert.area}</p>
                      </div>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-[#C4C7CC]">
                      {alert.level}
                    </span>
                  </div>
                ))}
              </div>
            </WamaCard>
          </div>
        </div>

        <WamaCard className="mt-6 p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Comparativo visual
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                Dónde está concentrada la gestión
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            {chartBars.map((bar) => (
              <div
                key={bar.label}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-bold text-[#F5F6F7]">{bar.label}</p>
                  <span className="text-sm font-bold text-[#00E5D6]">
                    {bar.value}
                  </span>
                </div>

                <div className="flex h-40 items-end rounded-2xl bg-[#0F1117] p-3">
                  <div
                    className="w-full animate-[wamaBar_1.2s_ease-out] rounded-xl bg-[#00E5D6]"
                    style={{ height: bar.value }}
                  />
                </div>

                <p className="mt-4 text-sm text-[#C4C7CC]">{bar.amount}</p>
              </div>
            ))}
          </div>
        </WamaCard>

        <style>{`
          @keyframes wamaGrow {
            from { width: 0; opacity: 0.4; }
            to { opacity: 1; }
          }

          @keyframes wamaBar {
            from { height: 0; opacity: 0.4; }
            to { opacity: 1; }
          }

          @keyframes wamaPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 55px rgba(0,229,214,0.14); }
            50% { transform: scale(1.025); box-shadow: 0 0 85px rgba(0,229,214,0.25); }
          }
        `}</style>
      </section>
    </WamaShell>
  );
}