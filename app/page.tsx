import Link from "next/link";
import WamaShell from "../src/components/brand/WamaShell";

const modules = [
  {
    name: "Sales Hub",
    label: "Ventas",
    description:
      "Centraliza prospectos, clientes, oportunidades, tareas y seguimiento comercial.",
    href: "/sales-hub",
  },
  {
    name: "Operación",
    label: "Gestión",
    description:
      "Gestiona alertas, responsables, evidencias y cumplimiento desde un solo lugar.",
    href: "/operacion",
  },
  {
    name: "Finanzas",
    label: "Control",
    description:
      "Ordena documentos, pagos, vencimientos y reportes para tomar mejores decisiones.",
    href: "/finanzas",
  },
];

const benefits = [
  "Información centralizada",
  "Responsables definidos",
  "Historial y trazabilidad",
  "Reportes ejecutivos",
];

export default function HomePage() {
  return (
    <WamaShell>
      <div className="overflow-hidden">
        <HeroSection />
        <ProductIntroduction />
        <ModulesSection />
        <ProductSection />
        <HowItWorksSection />
        <FinalCallToAction />
        <Footer />
      </div>
    </WamaShell>
  );
}

function HeroSection() {
  return (
    <section className="relative border-b border-white/10 bg-[#0B0C0E]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-24 h-80 w-80 rounded-full bg-[#00E5D6]/10 blur-[120px]" />
        <div className="absolute right-[-8rem] top-[-4rem] h-96 w-96 rounded-full bg-[#00E5D6]/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:pb-32 lg:pt-28">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
            WAMA · Plataforma de gestión modular
          </p>

          <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
            Una forma más simple de gestionar tu empresa.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
            Conecta ventas, operación, finanzas y reportes en una plataforma que
            crece junto a tu empresa. Activa solamente los módulos que necesitas.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/acceso"
              className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:translate-y-[-1px]"
            >
              Probar WAMA
            </Link>

            <Link
              href="#producto"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 text-sm font-black text-white transition hover:border-[#00E5D6]/50 hover:text-[#00E5D6]"
            >
              Ver cómo funciona
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-[#9EA4AE]">
            <span>14 días gratis</span>
            <span>Sin datos reales en la demo</span>
            <span>Hasta 10 usuarios incluidos</span>
          </div>
        </div>

        <SalesHubPreview />
      </div>
    </section>
  );
}

function SalesHubPreview() {
  const stages = [
    {
      title: "Marca objetivo",
      count: 4,
      deals: ["Centro Empresarial", "Grupo Horizonte"],
    },
    {
      title: "Primer contacto",
      count: 3,
      deals: ["Clínica Cordillera", "Nexo Operaciones"],
    },
    {
      title: "Propuesta",
      count: 2,
      deals: ["Parque Los Robles", "Edificio Central"],
    },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 translate-y-8 rounded-[2rem] bg-[#00E5D6]/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#F4F6F8] shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-[#DDE1E6] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0C0E] text-sm font-black text-[#00E5D6]">
              W
            </div>

            <div>
              <p className="text-sm font-black text-[#0B0C0E]">Sales Hub</p>
              <p className="text-xs font-semibold text-[#7B8390]">
                Pipeline comercial
              </p>
            </div>
          </div>

          <div className="rounded-full bg-[#E1FFFC] px-3 py-2 text-xs font-black text-[#008C84]">
            Demo activa
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-[#DDE1E6] bg-white px-5 py-4">
          <Metric label="Pipeline" value="1.620 UF" />
          <Metric label="Oportunidades" value="9" />
          <Metric label="Win rate" value="32%" />
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {stages.map((stage) => (
            <div key={stage.title} className="min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <p className="truncate text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#5D6673]">
                  {stage.title}
                </p>
                <span className="text-xs font-black text-[#8A929E]">
                  {stage.count}
                </span>
              </div>

              <div className="grid gap-3">
                {stage.deals.map((deal, index) => (
                  <div
                    key={deal}
                    className="rounded-2xl border border-[#DDE1E6] bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E1FFFC] text-xs font-black text-[#008C84]">
                        {deal
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 2)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-[#14171B]">
                          {deal}
                        </p>
                        <p className="mt-1 text-[0.66rem] font-semibold text-[#828A96]">
                          {index === 0 ? "420 UF" : "260 UF"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E9EDF1]">
                      <div
                        className="h-full rounded-full bg-[#00CABC]"
                        style={{ width: `${30 + index * 25}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-center text-xs font-semibold text-[#7E8793] lg:text-left">
        Vista demostrativa del módulo WAMA Sales Hub.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[#848C98]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[#111418]">{value}</p>
    </div>
  );
}

function ProductIntroduction() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:py-32">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#009B91]">
            Menos planillas. Más gestión.
          </p>
        </div>

        <div>
          <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.055em] text-[#0B0C0E] md:text-6xl">
            Tu equipo necesita saber qué hacer, quién es responsable y qué está
            pendiente.
          </h2>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-[#626A76]">
            WAMA organiza la información y convierte cada proceso en una gestión
            clara, medible y trazable. Sin depender de múltiples planillas,
            correos o conversaciones aisladas.
          </p>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DFFFFC] text-xs font-black text-[#008C84]">
                  ✓
                </span>
                <span className="text-sm font-black text-[#303640]">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  return (
    <section className="border-y border-[#E4E7EB] bg-[#F7F8FA]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#009B91]">
            Empieza por lo que necesitas
          </p>

          <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] text-[#0B0C0E] md:text-6xl">
            Un sistema que crece módulo por módulo.
          </h2>

          <p className="mt-6 text-lg leading-8 text-[#626A76]">
            No necesitas implementar todo desde el primer día. Elige un módulo,
            valida el resultado y amplía WAMA cuando tu operación lo requiera.
          </p>
        </div>

        <div className="mt-16 divide-y divide-[#DDE1E6] border-y border-[#DDE1E6]">
          {modules.map((module, index) => (
            <article
              key={module.name}
              className="grid gap-6 py-9 md:grid-cols-[0.16fr_0.32fr_0.4fr_0.12fr] md:items-center"
            >
              <p className="text-sm font-black text-[#009B91]">
                0{index + 1}
              </p>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8A929D]">
                  {module.label}
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#0B0C0E]">
                  {module.name}
                </h3>
              </div>

              <p className="max-w-xl text-base leading-7 text-[#626A76]">
                {module.description}
              </p>

              <Link
                href={module.href}
                className="text-sm font-black text-[#0B0C0E] transition hover:text-[#009B91] md:text-right"
              >
                Conocer más →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSection() {
  return (
    <section id="producto" className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#009B91]">
            Primer módulo disponible
          </p>

          <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] text-[#0B0C0E] md:text-6xl">
            Ordena tu proceso comercial con WAMA Sales Hub.
          </h2>

          <p className="mt-7 text-lg leading-8 text-[#626A76]">
            Un CRM centraliza prospectos, clientes, oportunidades y actividades
            comerciales. Así cada persona del equipo sabe qué oportunidad debe
            gestionar y cuál es el siguiente paso.
          </p>

          <div className="mt-9 grid gap-5">
            <Feature
              title="Pipeline visual"
              description="Visualiza cada oportunidad según su etapa comercial."
            />
            <Feature
              title="Seguimiento centralizado"
              description="Registra contactos, actividades, tareas y propuestas."
            />
            <Feature
              title="Dashboard ejecutivo"
              description="Analiza pipeline, cierres, pérdidas y desempeño comercial."
            />
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/acceso"
              className="inline-flex items-center justify-center rounded-full bg-[#0B0C0E] px-7 py-4 text-sm font-black text-white"
            >
              Probar Sales Hub
            </Link>

            <Link
              href="/sales-hub"
              className="inline-flex items-center justify-center rounded-full border border-[#CFD4DA] px-7 py-4 text-sm font-black text-[#0B0C0E]"
            >
              Conocer el módulo
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-[#0B0C0E] p-7 text-white lg:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00E5D6]">
            Qué puedes probar
          </p>

          <div className="mt-8 divide-y divide-white/10">
            <DemoAction number="01" text="Entrar a un portal de demostración" />
            <DemoAction number="02" text="Revisar oportunidades comerciales" />
            <DemoAction number="03" text="Crear y actualizar deals" />
            <DemoAction number="04" text="Mover oportunidades por etapas" />
            <DemoAction number="05" text="Consultar el dashboard comercial" />
          </div>

          <p className="mt-8 text-sm leading-7 text-[#AEB5BF]">
            La demo utiliza información ficticia. Después puedes solicitar un
            portal privado con el nombre, usuarios y configuración de tu empresa.
          </p>
        </div>
      </div>
    </section>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid grid-cols-[1.5rem_1fr] gap-4">
      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#00CABC]" />
      <div>
        <h3 className="text-base font-black text-[#111418]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#69717D]">{description}</p>
      </div>
    </div>
  );
}

function DemoAction({ number, text }: { number: string; text: string }) {
  return (
    <div className="grid grid-cols-[3rem_1fr] gap-4 py-5 first:pt-0 last:pb-0">
      <span className="text-xs font-black text-[#00E5D6]">{number}</span>
      <p className="text-base font-black">{text}</p>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section className="border-y border-[#E4E7EB] bg-[#F7F8FA]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#009B91]">
              Cómo funciona
            </p>

            <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] text-[#0B0C0E] md:text-5xl">
              Comienza sin complejidad.
            </h2>
          </div>

          <div className="divide-y divide-[#DDE1E6] border-y border-[#DDE1E6]">
            <ProcessStep
              number="01"
              title="Prueba la plataforma"
              description="Ingresa a la demo de WAMA y conoce el flujo del Sales Hub."
            />
            <ProcessStep
              number="02"
              title="Define tu primer módulo"
              description="Selecciona ventas, operación o finanzas según tu prioridad."
            />
            <ProcessStep
              number="03"
              title="Activa tu portal"
              description="Configuramos tu empresa, usuarios, permisos y acceso privado."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-5 py-8 sm:grid-cols-[4rem_0.55fr_1fr] sm:items-start">
      <p className="text-sm font-black text-[#009B91]">{number}</p>
      <h3 className="text-xl font-black text-[#0B0C0E]">{title}</h3>
      <p className="text-base leading-7 text-[#69717D]">{description}</p>
    </div>
  );
}

function FinalCallToAction() {
  return (
    <section className="bg-[#0B0C0E] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#00E5D6]">
            Hazlo realidad
          </p>

          <h2 className="mt-6 text-5xl font-black leading-tight tracking-[-0.06em] md:text-7xl">
            Lleva tu venta y tu gestión al siguiente nivel.
          </h2>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#B9C0CA]">
            Conoce la plataforma, prueba el primer módulo y descubre cómo WAMA
            puede adaptarse a los procesos de tu empresa.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/acceso"
              className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]"
            >
              Probar demo
            </Link>

            <Link
              href="/trial"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-black text-white"
            >
              Solicitar mi portal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B0C0E] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-2xl font-black tracking-[-0.04em]">WAMA</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-[#00E5D6]">
            Warn and Manage
          </p>

          <p className="mt-5 max-w-xl text-sm leading-6 text-[#979FAA]">
            Plataforma modular para ventas, operación, finanzas y reportes.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#B8BFC8]">
          <Link href="/modulos" className="hover:text-[#00E5D6]">
            Módulos
          </Link>
          <Link href="/acceso" className="hover:text-[#00E5D6]">
            Acceso portal
          </Link>
          <Link href="/trial" className="hover:text-[#00E5D6]">
            Prueba gratis
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs font-semibold text-[#747C87] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 WAMA. Todos los derechos reservados.</p>
          <p>www.wamaapp.com</p>
        </div>
      </div>
    </footer>
  );
}