import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

const modules = [
  {
    name: "Operación",
    category: "Gestión operativa",
    status: "Disponible",
    description:
      "Administra alertas, casos, responsables, evidencias, estados, SLA y reportes operativos en una sola plataforma.",
    features: [
      "Alertas y casos",
      "Responsables por área",
      "Evidencia fotográfica",
      "SLA y trazabilidad",
    ],
    href: "/operacion",
  },
  {
    name: "Sales Hub",
    category: "Gestión comercial",
    status: "En implementación",
    description:
      "Ordena target accounts, contactos, deals, propuestas, actividades y pipeline comercial desde el primer contacto hasta el cierre.",
    features: [
      "Target accounts",
      "Contactos comerciales",
      "Deals y pipeline",
      "Dashboard comercial",
    ],
    href: "/modulos/sales-hub",
  },
  {
    name: "Finanzas",
    category: "Cuentas por pagar",
    status: "Base funcional",
    description:
      "Controla documentos, cartolas, conciliación bancaria, pagos pendientes y reportes financieros para tomar mejores decisiones.",
    features: [
      "Carga de documentos",
      "Cartola bancaria",
      "Conciliación",
      "Dashboard financiero",
    ],
    href: "/finanzas",
  },
];

export default function ModulesPage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Catálogo modular
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Activa solo los módulos que tu empresa necesita.
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#C4C7CC]">
            WAMA funciona como una plataforma modular. Puedes comenzar con
            operación, ventas o finanzas, y luego escalar hacia una visión
            ejecutiva completa de la empresa.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {modules.map((module) => (
            <WamaCard key={module.name} className="flex flex-col p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#00E5D6]">
                    {module.category}
                  </p>

                  <h2 className="mt-4 text-3xl font-black text-[#F5F6F7]">
                    {module.name}
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#C4C7CC]">
                  {module.status}
                </span>
              </div>

              <p className="mt-5 min-h-[120px] text-sm leading-7 text-[#C4C7CC]">
                {module.description}
              </p>

              <div className="mt-6 grid gap-3">
                {module.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-[#F5F6F7]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#00E5D6]" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-8">
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