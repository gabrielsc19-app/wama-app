import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";
import WamaButton from "../../src/components/brand/WamaButton";

const executiveKpis = [
  {
    label: "Riesgo operativo",
    value: "Medio",
    detail: "12 casos abiertos · 3 fuera de SLA",
    status: "Atención",
  },
  {
    label: "Pipeline comercial",
    value: "$128M",
    detail: "18 deals activos · 5 en negociación",
    status: "Crecimiento",
  },
  {
    label: "Finanzas",
    value: "$42M",
    detail: "Documentos pendientes por validar",
    status: "Pendiente",
  },
  {
    label: "Cumplimiento general",
    value: "86%",
    detail: "Indicador consolidado WAMA",
    status: "Controlado",
  },
];

const modules = [
  {
    title: "Sales Hub",
    summary: "Pipeline sano, pero con concentración en etapas iniciales.",
    decision: "Priorizar seguimiento a deals en negociación y propuestas enviadas.",
    items: [
      ["Deals abiertos", "18"],
      ["Monto pipeline", "$128M"],
      ["Propuestas enviadas", "6"],
      ["Win rate estimado", "32%"],
    ],
  },
  {
    title: "Operación",
    summary: "Casos activos con presión en tiempos de respuesta.",
    decision: "Reforzar responsables y revisar casos fuera de SLA.",
    items: [
      ["Alertas abiertas", "12"],
      ["Fuera de SLA", "3"],
      ["Responsables activos", "5"],
      ["Cierre semanal", "74%"],
    ],
  },
  {
    title: "Finanzas",
    summary: "Pendientes concentrados en documentos sin conciliación.",
    decision: "Validar cartola y priorizar documentos vencidos.",
    items: [
      ["Documentos pendientes", "42"],
      ["Por conciliar", "18"],
      ["Monto pendiente", "$42M"],
      ["Pagos validados", "64%"],
    ],
  },
];

const decisionItems = [
  "Revisar deals con alta probabilidad y monto alto.",
  "Atacar casos operativos fuera de SLA antes del cierre semanal.",
  "Validar documentos financieros pendientes antes de liberar pagos.",
  "Revisar si el cliente requiere más usuarios o módulos activos.",
];

export default function ReportsPage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 max-w-4xl">
          <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Reportes ejecutivos
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Información clara para tomar decisiones.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#C4C7CC]">
            WAMA consolida ventas, operación y finanzas en reportes simples,
            pensados para revisar riesgos, prioridades y próximos pasos sin
            perderse en datos innecesarios.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <WamaButton href="/trial">Activar prueba gratis</WamaButton>
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

              <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
                {kpi.detail}
              </p>

              <span className="mt-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                {kpi.status}
              </span>
            </WamaCard>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <WamaCard className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
              Vista consolidada
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
              Reporte tipo para comité o reunión gerencial
            </h2>

            <div className="mt-7 grid gap-5">
              {modules.map((module) => (
                <div
                  key={module.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-2xl font-black text-[#F5F6F7]">
                        {module.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[#C4C7CC]">
                        {module.summary}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                      Revisar
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    {module.items.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-[#0F1117] p-4"
                      >
                        <p className="text-xs text-[#C4C7CC]">{label}</p>
                        <p className="mt-2 text-xl font-black text-[#F5F6F7]">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#00E5D6]/20 bg-[#00E5D6]/10 p-4 text-sm leading-6 text-[#F5F6F7]">
                    <strong className="text-[#00E5D6]">Decisión sugerida:</strong>{" "}
                    {module.decision}
                  </div>
                </div>
              ))}
            </div>
          </WamaCard>

          <div className="grid gap-6">
            <WamaCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Próximas decisiones
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                Qué debería mirar el gerente
              </h2>

              <div className="mt-6 grid gap-3">
                {decisionItems.map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-6 text-[#F5F6F7]">{item}</p>
                  </div>
                ))}
              </div>
            </WamaCard>

            <WamaCard className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Experiencia WAMA
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                Menos ruido, más control
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#C4C7CC]">
                La idea no es llenar la pantalla de tablas. WAMA debe mostrar lo
                necesario para entender qué está pasando, qué requiere acción y
                dónde se debe tomar una decisión.
              </p>

              <div className="mt-6">
                <WamaButton href="/modulos" variant="secondary">
                  Ver módulos
                </WamaButton>
              </div>
            </WamaCard>
          </div>
        </div>
      </section>
    </WamaShell>
  );
}