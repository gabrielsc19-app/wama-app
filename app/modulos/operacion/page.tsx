
import WamaShell from "../../../src/components/brand/WamaShell";
import WamaButton from "../../../src/components/brand/WamaButton";
import WamaCard from "../../../src/components/brand/WamaCard";

const features = [
  {
    title: "Alertas operativas",
    description:
      "Centraliza reportes, solicitudes y eventos críticos para que nada quede perdido en correos, WhatsApp o planillas.",
  },
  {
    title: "Casos y responsables",
    description:
      "Asigna cada caso a un equipo o responsable, controla estados y evita duplicidad en la gestión diaria.",
  },
  {
    title: "Evidencia y trazabilidad",
    description:
      "Registra fotos, comentarios, fechas, responsables y cierres para mantener respaldo operativo.",
  },
  {
    title: "SLA y seguimiento",
    description:
      "Mide tiempos de respuesta, casos pendientes, criticidad y cumplimiento por área.",
  },
  {
    title: "Reportes ejecutivos",
    description:
      "Entrega una vista clara para gerencia con indicadores, casos críticos y evolución operativa.",
  },
  {
    title: "Gestión modular",
    description:
      "Activa operación como primer módulo y luego escala hacia ventas, finanzas y reportes consolidados.",
  },
];

const flow = [
  "Reportar alerta",
  "Asignar responsable",
  "Adjuntar evidencia",
  "Controlar avance",
  "Cerrar caso",
];

export default function OperationModulePage() {
  return (
    <WamaShell>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Módulo operativo
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Controla alertas, casos y responsables con trazabilidad completa.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
            Operación WAMA permite ordenar la gestión diaria de una empresa:
            reportes, responsables, evidencias, SLA, estados y reportes
            ejecutivos en una sola plataforma.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <WamaButton href="/operacion">Entrar al módulo</WamaButton>

            <WamaButton href="/modulos" variant="secondary">
              Volver a módulos
            </WamaButton>
          </div>
        </div>

        <WamaCard className="p-6">
          <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-[#C4C7CC]">Flujo operativo</p>
                <h2 className="text-2xl font-black text-[#F5F6F7]">
                  De alerta a cierre
                </h2>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                OPS
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              {flow.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                    {index + 1}
                  </span>

                  <span className="text-sm font-semibold text-[#F5F6F7]">
                    {item}
                  </span>
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
            Un módulo operativo simple, trazable y pensado para la gestión real.
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