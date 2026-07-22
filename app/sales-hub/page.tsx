import Link from "next/link";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaDemoVideo from "../../src/components/marketing/WamaDemoVideo";

export default function SalesHubPage() {
  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <section className="bg-[#0B0C0E] text-white">
          <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-7xl px-6 py-20 lg:flex lg:items-center lg:py-28">
            <div className="max-w-5xl">
              <Link
                href="/"
                className="text-sm font-black text-[#AAB2BC] transition hover:text-[#00E5D6]"
              >
                ← Volver a WAMA
              </Link>

              <p className="mt-14 text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
                WAMA Sales
              </p>

              <h1 className="mt-7 text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl md:text-7xl">
                Gestiona todo tu proceso comercial.
              </h1>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-[#B7BEC8]">
                Centraliza prospectos, clientes, oportunidades, actividades,
                propuestas y resultados en un Sales Hub diseñado para vender con
                orden y seguimiento.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/acceso"
                  className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5"
                >
                  Probar la demo
                </Link>

                <Link
                  href="/sales-hub/crm"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white transition hover:border-[#00E5D6]/60 hover:text-[#00E5D6]"
                >
                  Entrar al CRM
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F6F7]">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:py-32">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
                Producto real
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">
                Mira Sales Hub funcionando.
              </h2>
              <p className="mt-7 text-lg leading-8 text-[#626A76]">
                La demostración utiliza exclusivamente datos ficticios de Vertex
                Facilities.
              </p>
            </div>

            <WamaDemoVideo caption="Pipeline, seguimiento, dashboard y clientes ficticios dentro de WAMA Sales Hub." />
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
              Capacidades
            </p>
            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">
              Todo lo importante, en un solo lugar.
            </h2>

            <div className="mt-14 divide-y divide-[#DDE1E6] border-y border-[#DDE1E6]">
              <Feature number="01" title="Pipeline visual" />
              <Feature number="02" title="Gestión de oportunidades" />
              <Feature number="03" title="Seguimiento de actividades" />
              <Feature number="04" title="Dashboard ejecutivo" />
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/acceso"
                className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5"
              >
                Probar la demo
              </Link>

              <Link
                href="/sales-hub/crm"
                className="inline-flex items-center justify-center rounded-full border-2 border-[#0B0C0E] bg-white px-8 py-4 text-sm font-black text-[#0B0C0E] transition hover:bg-[#0B0C0E] hover:text-white"
              >
                Entrar al CRM
              </Link>
            </div>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}

function Feature({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="grid grid-cols-[4rem_1fr] gap-5 py-8">
      <p className="text-sm font-black text-[#008F87]">{number}</p>
      <h3 className="text-2xl font-black">{title}</h3>
    </div>
  );
}
