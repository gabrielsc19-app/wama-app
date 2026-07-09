import WamaShell from "../../../src/components/brand/WamaShell";
import WamaButton from "../../../src/components/brand/WamaButton";
import WamaCard from "../../../src/components/brand/WamaCard";

const steps = [
  {
    number: "01",
    title: "Empresa",
    description:
      "Define la empresa demo, rubro, tamaño, moneda de trabajo y equipo responsable.",
  },
  {
    number: "02",
    title: "Usuarios comerciales",
    description:
      "Agrega usuarios internos, roles comerciales y responsables de seguimiento.",
  },
  {
    number: "03",
    title: "Target accounts",
    description:
      "Carga empresas objetivo con prioridad, rubro, fuente y potencial estimado.",
  },
  {
    number: "04",
    title: "Contactos",
    description:
      "Asocia contactos a cada empresa objetivo con cargo, correo, teléfono y comentarios.",
  },
  {
    number: "05",
    title: "Deals iniciales",
    description:
      "Crea oportunidades comerciales con monto estimado, etapa, probabilidad y responsable.",
  },
  {
    number: "06",
    title: "Pipeline",
    description:
      "Revisa etapas comerciales, actividad pendiente y primera vista del dashboard.",
  },
];

export default function SalesHubOnboardingPage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Onboarding Sales Hub
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
              Prepara tu carga comercial inicial.
            </h1>

            <p className="mt-6 text-lg leading-8 text-[#C4C7CC]">
              Antes de entrar al módulo funcional, WAMA ordena la información
              base para que el Sales Hub parta con estructura clara: empresa,
              usuarios, cuentas objetivo, contactos, deals y pipeline.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <WamaButton href="/sales-hub">Ir al Sales Hub</WamaButton>
              <WamaButton href="/modulos/sales-hub" variant="secondary">
                Volver al módulo
              </WamaButton>
            </div>
          </div>

          <div className="grid gap-4">
            {steps.map((step) => (
              <WamaCard key={step.number} className="p-5">
                <div className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                    {step.number}
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-[#F5F6F7]">
                      {step.title}
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-[#C4C7CC]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </WamaCard>
            ))}
          </div>
        </div>
      </section>
    </WamaShell>
  );
}