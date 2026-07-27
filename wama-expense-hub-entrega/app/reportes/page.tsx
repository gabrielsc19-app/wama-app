import Link from "next/link";
import WamaShell from "../../src/components/brand/WamaShell";

const priorities = [
  {
    number: "01",
    area: "Ventas",
    title: "Oportunidades sin seguimiento",
    action: "Revisar negocios sin próxima actividad.",
  },
  {
    number: "02",
    area: "Operación",
    title: "Casos fuera de plazo",
    action: "Validar responsables y compromisos pendientes.",
  },
  {
    number: "03",
    area: "Finanzas",
    title: "Documentos por validar",
    action: "Priorizar vencimientos y conciliaciones.",
  },
];

export default function ReportesPage() {
  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <HeroSection />
        <ExecutiveReading />
        <PrioritiesSection />
        <DecisionSection />
        <FinalCallToAction />
      </main>
    </WamaShell>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0B0C0E] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-20 h-[30rem] w-[30rem] rounded-full bg-[#00E5D6]/10 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
          WAMA Reports
        </p>

        <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl md:text-7xl">
          Mira el negocio antes de decidir.
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#B7BEC8]">
          WAMA transforma ventas, operación y finanzas en una lectura ejecutiva
          clara, priorizada y accionable.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/acceso"
            className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]"
          >
            Probar WAMA
          </Link>

          <a
            href="#lectura-ejecutiva"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white"
          >
            Ver lectura ejecutiva
          </a>
        </div>
      </div>
    </section>
  );
}

function ExecutiveReading() {
  return (
    <section id="lectura-ejecutiva" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.68fr_1.32fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
              Lectura ejecutiva
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">
              Lo importante, sin ruido.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-7 text-[#69717D]">
              Un reporte WAMA no muestra datos por mostrar. Explica qué está
              pasando, dónde mirar y qué decisión requiere atención.
            </p>
          </div>

          <div className="border-y border-[#DDE1E6]">
            <ExecutiveMetric
              label="Salud general"
              value="86%"
              interpretation="Gestión controlada, con prioridades específicas por resolver."
            />
            <ExecutiveMetric
              label="Pipeline comercial"
              value="2.480 UF"
              interpretation="La mayor concentración está en propuesta y negociación."
            />
            <ExecutiveMetric
              label="Cumplimiento operativo"
              value="88%"
              interpretation="Tres casos requieren revisión por plazo y responsable."
            />
            <ExecutiveMetric
              label="Validación financiera"
              value="84%"
              interpretation="Existen documentos pendientes de conciliación."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExecutiveMetric({
  label,
  value,
  interpretation,
}: {
  label: string;
  value: string;
  interpretation: string;
}) {
  return (
    <article className="grid gap-5 border-b border-[#DDE1E6] py-9 last:border-b-0 md:grid-cols-[0.42fr_0.28fr_1fr] md:items-center">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7E8792]">
        {label}
      </p>
      <p className="text-3xl font-black tracking-[-0.045em]">{value}</p>
      <p className="text-base leading-7 text-[#69717D]">{interpretation}</p>
    </article>
  );
}

function PrioritiesSection() {
  return (
    <section className="border-y border-white/10 bg-[#0B0C0E] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#00E5D6]">
            Prioridades
          </p>

          <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">
            El reporte termina en una acción.
          </h2>
        </div>

        <div className="mt-16 divide-y divide-white/10 border-y border-white/10">
          {priorities.map((priority) => (
            <article
              key={priority.number}
              className="grid gap-6 py-9 md:grid-cols-[4rem_0.35fr_0.75fr_1fr]"
            >
              <p className="text-sm font-black text-[#00E5D6]">
                {priority.number}
              </p>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#8F98A4]">
                {priority.area}
              </p>
              <h3 className="text-xl font-black">{priority.title}</h3>
              <p className="text-base leading-7 text-[#AFB7C1]">
                {priority.action}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DecisionSection() {
  return (
    <section className="bg-[#F5F6F7]">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[0.7fr_1.3fr] lg:py-32">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
            Una sola lectura
          </p>

          <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">
            Menos tiempo preparando. Más tiempo decidiendo.
          </h2>
        </div>

        <div className="divide-y divide-[#D5DAE0] border-y border-[#D5DAE0]">
          <DecisionRow
            number="01"
            title="Consolida"
            text="Reúne información de ventas, operación y finanzas."
          />
          <DecisionRow
            number="02"
            title="Interpreta"
            text="Explica qué cambió y por qué requiere atención."
          />
          <DecisionRow
            number="03"
            title="Prioriza"
            text="Ordena riesgos, pendientes y oportunidades."
          />
          <DecisionRow
            number="04"
            title="Actúa"
            text="Convierte cada hallazgo en una decisión concreta."
          />
        </div>
      </div>
    </section>
  );
}

function DecisionRow({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-5 py-8 sm:grid-cols-[4rem_0.45fr_1fr]">
      <p className="text-sm font-black text-[#008F87]">{number}</p>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="text-base leading-7 text-[#69717D]">{text}</p>
    </div>
  );
}

function FinalCallToAction() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <h2 className="max-w-5xl text-5xl font-black leading-[1] tracking-[-0.06em] md:text-7xl">
          Convierte la gestión diaria en mejores decisiones.
        </h2>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/acceso"
            className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]"
          >
            Probar WAMA
          </Link>

          <Link
            href="/modulos"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#0B0C0E] px-8 py-4 text-sm font-black text-[#0B0C0E]"
          >
            Ver módulos
          </Link>
        </div>
      </div>
    </section>
  );
}
