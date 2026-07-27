import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

const modules = [
  {
    name: "Operación",
    description:
      "Alertas, casos, responsables, evidencias, SLA y reportes operativos.",
    href: "/operacion",
    status: "Activo",
    metric: "18",
    metricLabel: "alertas abiertas",
  },
  {
    name: "Sales Hub",
    description:
      "Target accounts, contactos, deals, pipeline, propuestas y actividades.",
    href: "/sales-hub",
    status: "Demo funcional",
    metric: "$128M",
    metricLabel: "pipeline comercial",
  },
  {
    name: "Finanzas",
    description:
      "Documentos, cartola, conciliación, pendientes y dashboard financiero.",
    href: "/finanzas",
    status: "Base funcional",
    metric: "42",
    metricLabel: "documentos pendientes",
  },
];

const shortcuts = [
  {
    title: "Clientes",
    href: "/clientes",
    description: "Empresas, contactos y cuentas asociadas.",
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    description: "Roles, accesos y equipo interno.",
  },
  {
    title: "Reportes",
    href: "/reportes",
    description: "Vista ejecutiva consolidada.",
  },
];

export default function AppPortalPage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Portal interno
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Selecciona tu módulo de trabajo.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              WAMA separa la información por módulos para mantener orden,
              trazabilidad y foco operativo, comercial y financiero.
            </p>
          </div>

          <WamaButton href="/" variant="secondary">
            Volver al sitio
          </WamaButton>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {modules.map((module) => (
            <WamaCard key={module.name} className="p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                    {module.status}
                  </span>

                  <h2 className="mt-5 text-3xl font-black text-[#F5F6F7]">
                    {module.name}
                  </h2>
                </div>

                <div className="text-right">
                  <strong className="block text-3xl font-black text-[#F5F6F7]">
                    {module.metric}
                  </strong>
                  <span className="text-xs text-[#C4C7CC]">
                    {module.metricLabel}
                  </span>
                </div>
              </div>

              <p className="mt-5 min-h-[84px] text-sm leading-7 text-[#C4C7CC]">
                {module.description}
              </p>

              <div className="mt-7">
                <WamaButton href={module.href}>Abrir módulo</WamaButton>
              </div>
            </WamaCard>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {shortcuts.map((shortcut) => (
            <WamaCard key={shortcut.title} className="p-6">
              <h3 className="text-2xl font-black text-[#F5F6F7]">
                {shortcut.title}
              </h3>

              <p className="mt-3 min-h-[56px] text-sm leading-7 text-[#C4C7CC]">
                {shortcut.description}
              </p>

              <div className="mt-5">
                <WamaButton href={shortcut.href} variant="secondary">
                  Abrir
                </WamaButton>
              </div>
            </WamaCard>
          ))}
        </div>
      </section>
    </WamaShell>
  );
}