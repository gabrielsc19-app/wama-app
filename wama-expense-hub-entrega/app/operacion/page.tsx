import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

const kpis = [
  {
    label: "Alertas abiertas",
    value: "18",
    detail: "Casos en seguimiento",
  },
  {
    label: "SLA cumplimiento",
    value: "94%",
    detail: "Promedio últimos 30 días",
  },
  {
    label: "Casos críticos",
    value: "3",
    detail: "Requieren atención",
  },
  {
    label: "Evidencias",
    value: "126",
    detail: "Fotos y respaldos",
  },
];

const cases = [
  {
    title: "Filtración en zona común",
    area: "Mantención",
    status: "En proceso",
    responsible: "Equipo operativo",
    priority: "Alta",
  },
  {
    title: "Solicitud de apoyo en local",
    area: "Seguridad",
    status: "Asignado",
    responsible: "Supervisor turno",
    priority: "Media",
  },
  {
    title: "Revisión de limpieza programada",
    area: "Aseo",
    status: "Pendiente",
    responsible: "Coordinación",
    priority: "Baja",
  },
];

const flows = [
  "Crear alerta o caso",
  "Asignar responsable",
  "Agregar evidencia",
  "Controlar SLA",
  "Cerrar con trazabilidad",
];

export default function OperationPage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Módulo Operación
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Alertas, casos y responsables en una sola vista.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              Controla la gestión diaria con alertas operativas, asignación de
              responsables, evidencia, SLA y reportes ejecutivos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <WamaButton href="/app" variant="secondary">
              Volver al portal
            </WamaButton>

            <WamaButton href="/reportes">Ver reportes</WamaButton>
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <WamaCard className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  Casos activos
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                  Seguimiento operativo
                </h2>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                DEMO
              </span>
            </div>

            <div className="grid gap-4">
              {cases.map((item) => (
                <div
                  key={item.title}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-[1fr_auto]"
                >
                  <div>
                    <h3 className="font-bold text-[#F5F6F7]">{item.title}</h3>

                    <p className="mt-1 text-sm text-[#C4C7CC]">
                      {item.area} · {item.responsible}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-[#C4C7CC]">
                      {item.priority}
                    </span>

                    <span className="rounded-full bg-[#00E5D6]/15 px-3 py-2 text-xs font-bold text-[#00E5D6]">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </WamaCard>

          <WamaCard className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
              Flujo WAMA
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
              Gestión con trazabilidad
            </h2>

            <div className="mt-6 grid gap-3">
              {flows.map((flow, index) => (
                <div
                  key={flow}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                    {index + 1}
                  </span>

                  <span className="text-sm font-semibold text-[#F5F6F7]">
                    {flow}
                  </span>
                </div>
              ))}
            </div>
          </WamaCard>
        </div>
      </section>
    </WamaShell>
  );
}