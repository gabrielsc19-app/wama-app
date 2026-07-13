import WamaShell from "../src/components/brand/WamaShell";
import WamaCard from "../src/components/brand/WamaCard";
import WamaButton from "../src/components/brand/WamaButton";
import WamaVideoPreview from "../src/components/brand/WamaVideoPreview";

const modules = [
  {
    label: "Módulo comercial",
    name: "Sales Hub",
    description:
      "Controla prospectos, contactos, deals, pipeline, documentos y seguimiento comercial.",
    href: "/modulos/sales-hub",
  },
  {
    label: "Módulo operacional",
    name: "Operación",
    description:
      "Gestiona alertas, casos, responsables, evidencia, SLA y trazabilidad diaria.",
    href: "/modulos/operacion",
  },
  {
    label: "Módulo financiero",
    name: "Finanzas",
    description:
      "Ordena documentos, pendientes, conciliaciones y reportes financieros.",
    href: "/modulos/finanzas",
  },
];

const dashboardItems = [
  ["Alertas abiertas", "18"],
  ["Deals en pipeline", "$128M"],
  ["Documentos pendientes", "42"],
  ["SLA cumplimiento", "94%"],
];

export default function HomePage() {
  return (
    <WamaShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,214,0.20),transparent_45%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Warn and Manage
            </div>

            <h1 className="max-w-4xl text-6xl font-black leading-tight tracking-[-0.06em] text-[#F5F6F7] md:text-8xl">
              Gestiona tu empresa módulo por módulo.
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-[#C4C7CC]">
              WAMA centraliza ventas, operación, finanzas y reportes en un
              software modular diseñado para empresas que necesitan orden,
              trazabilidad y control.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <WamaButton href="/trial">Prueba gratis</WamaButton>

              <WamaButton href="/login" variant="secondary">
                Acceso portal
              </WamaButton>
            </div>
          </div>

          <WamaCard className="p-7">
            <div className="mb-6 flex items-start justify-between gap-5">
              <div>
                <p className="text-sm text-[#C4C7CC]">Dashboard ejecutivo</p>

                <h2 className="mt-1 text-3xl font-black text-[#F5F6F7]">
                  Control central
                </h2>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-black text-[#00E5D6]">
                LIVE
              </span>
            </div>

            <div className="grid gap-4">
              {dashboardItems.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                >
                  <span className="text-sm text-[#C4C7CC]">{label}</span>

                  <strong className="text-2xl font-black text-[#F5F6F7]">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </WamaCard>
        </div>
      </section>

      <WamaVideoPreview />

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 max-w-4xl">
          <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Módulos base
          </div>

          <h2 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
            Comienza por el área que más necesita orden.
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#C4C7CC]">
            Cada empresa puede activar solo los módulos que necesita. WAMA crece
            con el negocio, sin obligar a implementar todo desde el primer día.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {modules.map((module, index) => (
            <WamaCard key={module.name} className="p-6">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                {index + 1}
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                {module.label}
              </p>

              <h3 className="mt-3 text-3xl font-black text-[#F5F6F7]">
                {module.name}
              </h3>

              <p className="mt-4 min-h-[96px] text-sm leading-7 text-[#C4C7CC]">
                {module.description}
              </p>

              <div className="mt-6">
                <WamaButton href={module.href} variant="secondary">
                  Ver módulo
                </WamaButton>
              </div>
            </WamaCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <WamaCard className="p-8">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Prueba gratuita
              </p>

              <h2 className="mt-2 text-4xl font-black text-[#F5F6F7]">
                Activa WAMA y entra a tu portal.
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#C4C7CC]">
                Configura tu empresa, define qué vendes, selecciona el módulo
                inicial y comienza a trabajar con una prueba gratuita de 14 días.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <WamaButton href="/trial">Prueba gratis</WamaButton>

              <WamaButton href="/login" variant="secondary">
                Acceso portal
              </WamaButton>
            </div>
          </div>
        </WamaCard>
      </section>
    </WamaShell>
  );
}