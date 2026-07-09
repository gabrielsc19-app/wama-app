import WamaShell from "../src/components/brand/WamaShell";
import WamaButton from "../src/components/brand/WamaButton";
import WamaCard from "../src/components/brand/WamaCard";

const modules = [
  {
    name: "Operación",
    description:
      "Gestiona alertas, casos, responsables, evidencias, SLA y reportes operativos.",
    href: "/operacion",
    status: "Base operativa",
  },
  {
    name: "Sales Hub",
    description:
      "Ordena target accounts, contactos, deals, pipeline, propuestas y actividades comerciales.",
    href: "/modulos/sales-hub",
    status: "Módulo comercial",
  },
  {
    name: "Finanzas",
    description:
      "Controla documentos, cartolas, conciliación, pendientes y dashboard financiero.",
    href: "/finanzas",
    status: "Cuentas por pagar",
  },
];

const metrics = [
  ["Alertas abiertas", "18"],
  ["Deals en pipeline", "$128M"],
  ["Documentos pendientes", "42"],
  ["SLA cumplimiento", "94%"],
];

export default function HomePage() {
  return (
    <WamaShell>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Warn and Manage
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Gestiona tu empresa módulo por módulo.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
            WAMA centraliza alertas, ventas, finanzas y reportes en un software
            modular diseñado para empresas que necesitan orden, trazabilidad y
            control.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <WamaButton href="/modulos">Ver módulos</WamaButton>

            <WamaButton href="/trial" variant="secondary">
              Probar gratis 14 días
            </WamaButton>
          </div>
        </div>

        <WamaCard className="p-6">
          <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-[#C4C7CC]">Dashboard ejecutivo</p>
                <h2 className="text-2xl font-bold text-[#F5F6F7]">
                  Control central
                </h2>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                LIVE
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {metrics.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4"
                >
                  <span className="text-sm text-[#C4C7CC]">{label}</span>

                  <span className="text-xl font-black text-[#F5F6F7]">
                    {value}
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
            Módulos base
          </p>

          <h2 className="mt-3 text-3xl font-black text-[#F5F6F7]">
            Comienza por el área que más necesita orden.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {modules.map((module) => (
            <WamaCard key={module.name} className="p-6">
              <div className="mb-5 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[#C4C7CC]">
                {module.status}
              </div>

              <h3 className="text-2xl font-black text-[#F5F6F7]">
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
    </WamaShell>
  );
}