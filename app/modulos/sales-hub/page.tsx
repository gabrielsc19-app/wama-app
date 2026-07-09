import WamaShell from "../../../src/components/brand/WamaShell";
import WamaButton from "../../../src/components/brand/WamaButton";
import WamaCard from "../../../src/components/brand/WamaCard";

const features = [
  {
    title: "Target accounts",
    description:
      "Carga empresas objetivo, clasifícalas por rubro, prioridad, potencial comercial y estado de avance.",
  },
  {
    title: "Contactos",
    description:
      "Centraliza contactos comerciales, cargos, correos, teléfonos y comentarios relevantes para la gestión.",
  },
  {
    title: "Deals y pipeline",
    description:
      "Controla oportunidades desde primer contacto hasta propuesta, negociación y cierre.",
  },
  {
    title: "Actividades",
    description:
      "Registra llamadas, reuniones, seguimientos, próximos pasos y responsables comerciales.",
  },
  {
    title: "Propuestas",
    description:
      "Mantén trazabilidad sobre propuestas enviadas, montos, fechas y estado de respuesta.",
  },
  {
    title: "Dashboard comercial",
    description:
      "Visualiza pipeline, monto potencial, avance por etapa, deals abiertos y actividad del equipo.",
  },
];

const stages = [
  "Prospecto",
  "Contactado",
  "Reunión",
  "Propuesta",
  "Negociación",
  "Cierre",
];

export default function SalesHubModulePage() {
  return (
    <WamaShell>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Módulo comercial
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Ordena tu gestión comercial desde el primer contacto hasta el cierre.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
            Sales Hub de WAMA permite gestionar target accounts, contactos,
            deals, pipeline, propuestas, actividades y dashboard comercial con
            trazabilidad completa.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <WamaButton href="/onboarding/sales-hub">
              Comenzar onboarding
            </WamaButton>

            <WamaButton href="/sales-hub" variant="secondary">
              Entrar al Sales Hub
            </WamaButton>
          </div>
        </div>

        <WamaCard className="p-6">
          <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-[#C4C7CC]">Pipeline comercial</p>
                <h2 className="text-2xl font-black text-[#F5F6F7]">
                  Vista ejecutiva
                </h2>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                SALES
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              {stages.map((stage, index) => (
                <div
                  key={stage}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#F5F6F7]">
                      {stage}
                    </span>
                    <span className="text-xs text-[#C4C7CC]">
                      {index + 2} deals
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-[#00E5D6]"
                      style={{ width: `${35 + index * 9}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </WamaCard>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
            Qué incluye
          </p>

          <h2 className="mt-3 text-3xl font-black text-[#F5F6F7]">
            Un CRM comercial simple, trazable y enfocado en resultados.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <WamaCard key={feature.title} className="p-6">
              <h3 className="text-2xl font-black text-[#F5F6F7]">
                {feature.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-[#C4C7CC]">
                {feature.description}
              </p>
            </WamaCard>
          ))}
        </div>
      </section>
    </WamaShell>
  );
}