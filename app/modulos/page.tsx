import Link from "next/link";
import WamaShell from "../../src/components/brand/WamaShell";

const modules = [
  {
    number: "01",
    eyebrow: "Disponible",
    name: "WAMA Sales",
    title: "Gestiona todo tu proceso comercial.",
    description:
      "Centraliza prospectos, clientes, oportunidades, actividades y resultados en un solo flujo.",
    result: "Más seguimiento. Menos oportunidades perdidas.",
    href: "/sales-hub",
    action: "Conocer Sales Hub",
  },
  {
    number: "02",
    eyebrow: "Próximamente",
    name: "WAMA Ops",
    title: "Controla la operación en tiempo real.",
    description:
      "Ordena alertas, tareas, responsables, evidencias y cumplimiento operacional.",
    result: "Más control. Menos información dispersa.",
    href: "/operacion",
    action: "Conocer Operación",
  },
  {
    number: "03",
    eyebrow: "Próximamente",
    name: "WAMA Finance",
    title: "Mantén el control financiero de tu empresa.",
    description:
      "Gestiona documentos, pagos, vencimientos, aprobaciones y reportes financieros.",
    result: "Más visibilidad. Menos decisiones tardías.",
    href: "/finanzas",
    action: "Conocer Finanzas",
  },
  {
    number: "04",
    eyebrow: "En desarrollo",
    name: "WAMA Reports",
    title: "Convierte la gestión en decisiones.",
    description:
      "Consolida ventas, operación y finanzas en una lectura ejecutiva clara.",
    result: "Más claridad. Menos tiempo preparando reportes.",
    href: "/reportes",
    action: "Conocer Reportes",
  },
];

export default function ModulosPage() {
  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <HeroSection />
        <ModulesList />
        <ImplementationSection />
        <FinalCallToAction />
      </main>
    </WamaShell>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0B0C0E] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-10rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[#00E5D6]/10 blur-[170px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
          Plataforma modular
        </p>

        <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl md:text-7xl">
          Activa solo lo que tu empresa necesita.
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#B7BEC8]">
          Comienza con un proceso, valida el resultado y amplía WAMA cuando tu
          organización lo requiera.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/acceso"
            className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5"
          >
            Probar WAMA
          </Link>

          <a
            href="#modulos"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white transition hover:border-[#00E5D6]/60 hover:text-[#00E5D6]"
          >
            Ver módulos
          </a>
        </div>
      </div>
    </section>
  );
}

function ModulesList() {
  return (
    <section id="modulos" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.68fr_1.32fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
              Empieza por tu prioridad
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">
              Un sistema. Varios procesos.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-7 text-[#69717D]">
              Todos los módulos comparten la misma lógica visual, los mismos
              usuarios y una sola experiencia de gestión.
            </p>
          </div>

          <div className="divide-y divide-[#DDE1E6] border-y border-[#DDE1E6]">
            {modules.map((module) => (
              <article
                key={module.number}
                className="grid gap-6 py-10 md:grid-cols-[4rem_0.55fr_1fr] md:items-start"
              >
                <p className="text-sm font-black text-[#008F87]">
                  {module.number}
                </p>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#858E99]">
                    {module.eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                    {module.name}
                  </h3>
                </div>

                <div>
                  <p className="text-xl font-black tracking-[-0.03em]">
                    {module.title}
                  </p>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-[#69717D]">
                    {module.description}
                  </p>
                  <p className="mt-5 text-sm font-black text-[#008F87]">
                    {module.result}
                  </p>
                  <Link
                    href={module.href}
                    className="mt-6 inline-flex text-sm font-black transition hover:text-[#008F87]"
                  >
                    {module.action} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ImplementationSection() {
  return (
    <section className="border-y border-[#E1E5E9] bg-[#F5F6F7]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
              Implementación
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">
              Comienza sin complejidad.
            </h2>
          </div>

          <div className="divide-y divide-[#D5DAE0] border-y border-[#D5DAE0]">
            <Step
              number="01"
              title="Define la prioridad"
              text="Selecciona el proceso que hoy necesita más orden."
            />
            <Step
              number="02"
              title="Configura el portal"
              text="Creamos usuarios, permisos y estructura inicial."
            />
            <Step
              number="03"
              title="Activa el módulo"
              text="Tu equipo comienza a gestionar en un entorno centralizado."
            />
            <Step
              number="04"
              title="Amplía cuando lo necesites"
              text="Incorpora nuevos módulos sin cambiar de plataforma."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-5 py-8 sm:grid-cols-[4rem_0.55fr_1fr]">
      <p className="text-sm font-black text-[#008F87]">{number}</p>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="text-base leading-7 text-[#69717D]">{text}</p>
    </div>
  );
}

function FinalCallToAction() {
  return (
    <section className="bg-[#0B0C0E] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <h2 className="max-w-5xl text-5xl font-black leading-[1] tracking-[-0.06em] md:text-7xl">
          Empieza por un módulo. Construye una mejor gestión.
        </h2>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/acceso"
            className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]"
          >
            Probar WAMA
          </Link>

          <Link
            href="/trial"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white"
          >
            Solicitar mi portal
          </Link>
        </div>
      </div>
    </section>
  );
}
