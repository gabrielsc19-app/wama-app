import Link from "next/link";
import WamaShell from "../../src/components/brand/WamaShell";

export default function ReportesPage() {
  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
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
              WAMA reúne información de Sales Hub, Expense Hub y Operations Hub
              para entregar una lectura ejecutiva clara, priorizada y accionable.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/trial"
                className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]"
              >
                Probar WAMA 15 días
              </Link>

              <Link
                href="/modulos"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white"
              >
                Ver módulos
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
              Una sola lectura
            </p>

            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">
              Convierte la actividad diaria en decisiones.
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#69717D]">
              Ventas, rendiciones y operación viven en módulos independientes,
              pero WAMA puede presentarlos en una lectura común para que la
              gerencia sepa dónde mirar primero.
            </p>

            <div className="mt-10">
              <Link
                href="/trial"
                className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]"
              >
                Comenzar prueba gratuita
              </Link>
            </div>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}
