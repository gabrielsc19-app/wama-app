import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";

const modules = [
  {
    eyebrow: "Gestión comercial",
    name: "Sales Hub",
    description:
      "Convierte prospectos en oportunidades con pipeline, contactos, deals y reportes comerciales.",
    href: "/modulos/sales-hub",
    cta: "Ver Sales Hub",
    metrics: ["Pipeline", "Deals", "Contactos", "Forecast"],
    score: "92%",
    status: "Listo para activar",
  },
  {
    eyebrow: "Gestión operativa",
    name: "Operación",
    description:
      "Controla alertas, casos, responsables, evidencias y cumplimiento operativo diario.",
    href: "/modulos/operacion",
    cta: "Ver Operación",
    metrics: ["Alertas", "SLA", "Evidencia", "Responsables"],
    score: "88%",
    status: "Listo para activar",
  },
  {
    eyebrow: "Control financiero",
    name: "Finanzas",
    description:
      "Ordena documentos, pagos, conciliaciones, pendientes y visibilidad financiera.",
    href: "/modulos/finanzas",
    cta: "Ver Finanzas",
    metrics: ["Documentos", "Pagos", "Conciliación", "Pendientes"],
    score: "84%",
    status: "Listo para activar",
  },
];

const journey = [
  "Elige módulo",
  "Activa prueba",
  "Carga datos",
  "Trabaja en portal",
  "Revisa reportes",
];

export default function ModulesPage() {
  return (
    <WamaShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,214,0.20),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
                Módulos WAMA
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.05em] text-[#F5F6F7] md:text-7xl">
                Activa solo lo que tu empresa necesita.
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#C4C7CC]">
                WAMA funciona por módulos conectados. Comienza con el área que
                hoy necesita más orden y crece cuando tu operación lo requiera.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <WamaButton href="/trial">Prueba gratis</WamaButton>
              <WamaButton href="/login" variant="secondary">
                Acceso portal
              </WamaButton>
            </div>
          </div>

          <div className="mb-14 grid gap-3 md:grid-cols-5">
            {journey.map((item, index) => (
              <div
                key={item}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#00E5D6]/35 hover:bg-[#00E5D6]/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6] transition group-hover:scale-110">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-bold text-[#F5F6F7]">{item}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {modules.map((module, index) => (
              <article
                key={module.name}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111318] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-2 hover:border-[#00E5D6]/40 hover:shadow-[0_28px_90px_rgba(0,229,214,0.12)]"
              >
                <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,214,0.16),transparent_55%)]" />

                <div className="relative">
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.25em] text-[#00E5D6]">
                        {module.eyebrow}
                      </p>

                      <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#F5F6F7]">
                        {module.name}
                      </h2>
                    </div>

                    <span className="rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                      {module.status}
                    </span>
                  </div>

                  <p className="min-h-[84px] text-base leading-7 text-[#C4C7CC]">
                    {module.description}
                  </p>

                  <div className="mt-8 rounded-3xl border border-white/10 bg-[#0B0C0E]/70 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-[#F5F6F7]">
                        Potencial de control
                      </p>

                      <span className="text-sm font-black text-[#00E5D6]">
                        {module.score}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-2 animate-[wamaModuleGrow_1.2s_ease-out] rounded-full bg-[#00E5D6]"
                        style={{ width: module.score }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {module.metrics.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-[#F5F6F7] transition group-hover:border-[#00E5D6]/20"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#00E5D6]" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <WamaButton href={module.href} variant="secondary">
                      {module.cta}
                    </WamaButton>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#111318] p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#00E5D6]">
                  Experiencia modular
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#F5F6F7]">
                  Un portal, varios módulos, una sola forma de controlar.
                </h2>

                <p className="mt-5 text-base leading-7 text-[#C4C7CC]">
                  La navegación debe ser simple: el usuario entra a su portal,
                  ve sus módulos activos y trabaja. Sin perderse en menús
                  innecesarios.
                </p>
              </div>

              <div className="grid gap-4">
                {modules.map((module, index) => (
                  <div
                    key={module.name}
                    className="animate-[wamaFloatSoft_4s_ease-in-out_infinite] rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                          {index + 1}
                        </span>

                        <div>
                          <p className="font-black text-[#F5F6F7]">
                            {module.name}
                          </p>
                          <p className="text-sm text-[#C4C7CC]">
                            {module.eyebrow}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-black text-[#00E5D6]">
                        Activo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes wamaModuleGrow {
              from { width: 0; opacity: 0.4; }
              to { opacity: 1; }
            }

            @keyframes wamaFloatSoft {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
          `}</style>
        </div>
      </section>
    </WamaShell>
  );
}