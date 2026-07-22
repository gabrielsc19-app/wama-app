import Link from "next/link";
import WamaShell from "../src/components/brand/WamaShell";
import WamaDemoVideo from "../src/components/marketing/WamaDemoVideo";

export default function HomePage() {
  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <section className="relative overflow-hidden bg-[#0B0C0E] text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-12rem] top-20 h-[30rem] w-[30rem] rounded-full bg-[#00E5D6]/10 blur-[150px]" />
            <div className="absolute right-[-10rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#00E5D6]/10 blur-[170px]" />
          </div>

          <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.12fr_0.88fr] lg:items-end lg:py-28">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
                WAMA · Warn and Manage
              </p>

              <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl md:text-7xl">
                Gestiona tu empresa módulo por módulo.
              </h1>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-[#B7BEC8]">
                Ventas, operación, finanzas y reportes en una plataforma simple,
                trazable y preparada para crecer junto a tu empresa.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/acceso"
                  className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5"
                >
                  Probar WAMA
                </Link>

                <a
                  href="#demostracion"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white transition hover:border-[#00E5D6]/60 hover:text-[#00E5D6]"
                >
                  Ver demostración
                </a>
              </div>
            </div>

            <div className="border-l border-white/15 pl-0 lg:pl-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00E5D6]">
                Primer producto disponible
              </p>
              <h2 className="mt-5 text-3xl font-black tracking-[-0.04em]">
                WAMA Sales
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-[#AEB6C0]">
                Ordena clientes, oportunidades, tareas y resultados comerciales.
              </p>
              <Link
                href="/sales-hub"
                className="mt-7 inline-flex text-sm font-black transition hover:text-[#00E5D6]"
              >
                Conocer Sales Hub →
              </Link>
            </div>
          </div>
        </section>

        <section
          id="demostracion"
          className="scroll-mt-24 border-b border-[#E1E5E9] bg-[#F5F6F7]"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:py-32">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
                Producto real
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">
                Mira WAMA funcionando.
              </h2>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#626A76]">
                El video utiliza exclusivamente una empresa, clientes y
                oportunidades ficticias.
              </p>

              <Link
                href="/acceso"
                className="mt-9 inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(0,229,214,0.2)]"
              >
                Probar la demo
              </Link>
            </div>

            <WamaDemoVideo />
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
              Plataforma modular
            </p>
            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">
              Comienza por el proceso que más necesita tu empresa.
            </h2>

            <div className="mt-14 divide-y divide-[#DDE1E6] border-y border-[#DDE1E6]">
              <ModuleRow
                number="01"
                name="WAMA Sales"
                description="Gestiona todo tu proceso comercial."
                href="/sales-hub"
              />
              <ModuleRow
                number="02"
                name="WAMA Ops"
                description="Controla la operación en tiempo real."
                href="/operacion"
              />
              <ModuleRow
                number="03"
                name="WAMA Finance"
                description="Mantén el control financiero de tu empresa."
                href="/finanzas"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#0B0C0E] text-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <h2 className="max-w-5xl text-5xl font-black leading-[1] tracking-[-0.06em] md:text-7xl">
              Prueba WAMA y descubre cómo puede ordenar tu empresa.
            </h2>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/acceso"
                className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]"
              >
                Entrar a la demo
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
      </main>
    </WamaShell>
  );
}

function ModuleRow({
  number,
  name,
  description,
  href,
}: {
  number: string;
  name: string;
  description: string;
  href: string;
}) {
  return (
    <article className="grid gap-5 py-9 md:grid-cols-[4rem_0.45fr_1fr_auto] md:items-center">
      <p className="text-sm font-black text-[#008F87]">{number}</p>
      <h3 className="text-2xl font-black">{name}</h3>
      <p className="text-base leading-7 text-[#69717D]">{description}</p>
      <Link
        href={href}
        className="text-sm font-black transition hover:text-[#008F87]"
      >
        Conocer más →
      </Link>
    </article>
  );
}
