import Link from "next/link";
import WamaShell from "../src/components/brand/WamaShell";
import WamaInteractiveFlow from "../src/components/marketing/WamaInteractiveFlow";

export default function HomePage() {
  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <section className="relative overflow-hidden bg-[#0B0C0E] text-white">
          <div className="pointer-events-none absolute inset-0"><div className="absolute left-[-12rem] top-20 h-[30rem] w-[30rem] rounded-full bg-[#00E5D6]/10 blur-[150px]" /><div className="absolute right-[-10rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#00E5D6]/10 blur-[170px]" /></div>
          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:py-28">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">WAMA · Warn and Manage</p>
              <h1 className="mt-5 max-w-5xl text-[2.65rem] font-black leading-[0.96] tracking-[-0.065em] sm:mt-7 sm:text-6xl md:text-7xl">Gestiona tu empresa módulo por módulo.</h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-[#B7BEC8] sm:mt-8 sm:text-lg sm:leading-8">Ventas y gastos en productos independientes, conectados y preparados para crecer junto a tu empresa.</p>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:flex sm:flex-row sm:flex-wrap">
                <Link href="/acceso" className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5">Acceder a un portal</Link>
                <a href="#productos" className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white transition hover:border-[#00E5D6]/60 hover:text-[#00E5D6]">Ver productos</a>
                <a href="#contacto" className="inline-flex items-center justify-center rounded-full border border-[#00E5D6]/60 px-8 py-4 text-sm font-black text-[#00E5D6] transition hover:bg-[#00E5D6] hover:text-[#0B0C0E]">Enviar una consulta</a>
              </div>
              <a href="mailto:contacto@wamaapp.com" className="mt-5 inline-flex text-sm font-bold text-[#C4C7CC] underline decoration-[#00E5D6] underline-offset-4 transition hover:text-white">contacto@wamaapp.com</a>
            </div>
            <div className="hidden border-l border-white/15 pl-0 lg:block lg:pl-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00E5D6]">Productos disponibles</p>
              <h2 className="mt-5 text-3xl font-black tracking-[-0.04em]">Sales Hub + Expense Hub</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-[#AEB6C0]">Dos portales especializados. Una misma experiencia WAMA.</p>
              <Link href="/acceso" className="mt-7 inline-flex text-sm font-black transition hover:text-[#00E5D6]">Elegir portal →</Link>
            </div>
          </div>
        </section>

        <section id="productos" className="scroll-mt-24 bg-[#E9EDF0]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24 lg:py-32">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">Productos que muestran cómo trabajan</p>
            <h2 className="mt-4 max-w-5xl text-3xl font-black leading-[1.02] tracking-[-0.05em] sm:mt-5 sm:text-4xl md:text-6xl">No solo mires el software. Recorre el proceso completo.</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#66707C] sm:mt-6 sm:text-lg sm:leading-8">Cada Hub cuenta una historia distinta: desde la primera acción del usuario hasta la decisión final de la empresa.</p>
            <div className="mt-9 space-y-8 sm:mt-16 sm:space-y-12">
              <ProductStory eyebrow="WAMA Expense Hub" title="De una foto tomada con el celular a un gasto aprobado y controlado." description="Captura, lectura inteligente, confirmación, aprobación y control financiero en una sola experiencia." href="/acceso/expense-hub" action="Entrar al portal Expense" kind="expense" />
              <ProductStory eyebrow="WAMA Sales" title="De un prospecto nuevo a una oportunidad cerrada con seguimiento real." description="Clientes, actividades, propuestas, negociación y resultados comerciales conectados en un único flujo." href="/acceso/sales-hub" action="Entrar al portal Sales" kind="sales" />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">Plataforma modular</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">Comienza por el proceso que más necesita tu empresa.</h2>
            <div className="mt-14 divide-y divide-[#DDE1E6] border-y border-[#DDE1E6]">
              <ModuleRow number="01" name="WAMA Sales" description="Gestiona todo tu proceso comercial." href="/modulos/sales-hub" />
              <ModuleRow number="02" name="WAMA Expense Hub" description="Rinde, aprueba y controla gastos desde celular, tablet o computador." href="/modulos/expense-hub" />
              <ModuleRow number="03" name="WAMA Ops" description="Controla la operación en tiempo real." href="/operacion" />
              <ModuleRow number="04" name="WAMA Finance" description="Mantén el control financiero de tu empresa." href="/finanzas" />
            </div>
          </div>
        </section>

        <section id="contacto" className="scroll-mt-24 border-t border-[#DDE1E6] bg-[#F5F6F7]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
            <div className="rounded-[2rem] border border-[#D6DBE0] bg-white p-7 shadow-[0_24px_70px_rgba(11,12,14,0.09)] sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-14">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">Contáctanos</p>
                <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">¿Tienes consultas sobre WAMA?</h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66707C]">Escríbenos para resolver tus dudas sobre nuestros módulos, funcionalidades y planes.</p>
                <a href="mailto:contacto@wamaapp.com" className="mt-6 inline-flex break-all text-xl font-black text-[#0B0C0E] underline decoration-[#00E5D6] decoration-[3px] underline-offset-8 sm:text-2xl">contacto@wamaapp.com</a>
              </div>
              <a href="mailto:contacto@wamaapp.com?subject=Consulta%20sobre%20WAMA" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#0B0C0E] px-9 py-4 text-sm font-black !text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#202328] lg:mt-0 lg:w-auto">Enviar consulta →</a>
            </div>
          </div>
        </section>

        <section className="bg-[#0B0C0E] text-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <h2 className="max-w-5xl text-5xl font-black leading-[1] tracking-[-0.06em] md:text-7xl">Elige tu producto y comienza a trabajar.</h2>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row"><Link href="/acceso" className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]">Acceder a los portales</Link><Link href="/trial" className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white">Prueba gratis 15 días</Link><a href="#contacto" className="inline-flex items-center justify-center rounded-full border border-[#00E5D6]/60 px-8 py-4 text-sm font-black text-[#00E5D6]">Contáctanos</a></div>
            <p className="mt-12 text-sm text-[#AEB6C0]">Consultas: <a href="mailto:contacto@wamaapp.com" className="font-black text-white underline decoration-[#00E5D6] underline-offset-4">contacto@wamaapp.com</a></p>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}

function ProductStory({ eyebrow, title, description, href, action, kind }: { eyebrow:string; title:string; description:string; href:string; action:string; kind:"expense"|"sales" }) {
  return <article className="min-w-0 overflow-hidden rounded-[1.75rem] border border-[#D2D8DE] bg-white shadow-[0_20px_65px_rgba(11,12,14,0.10)] sm:rounded-[2.25rem]"><div className="grid gap-6 border-b border-[#E3E7EA] px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#008F87]">{eyebrow}</p><h3 className="mt-4 max-w-5xl text-[2.2rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-4xl lg:text-5xl">{title}</h3><p className="mt-4 max-w-3xl text-base leading-7 text-[#69717D]">{description}</p></div><Link href={href} className="inline-flex w-full items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5 lg:w-auto">{action} →</Link></div><div className="p-3 sm:p-5 lg:p-7"><WamaInteractiveFlow kind={kind} /></div></article>;
}

function ModuleRow({ number, name, description, href }: { number:string; name:string; description:string; href:string }) {
  return <article className="grid gap-5 py-9 md:grid-cols-[4rem_0.45fr_1fr_auto] md:items-center"><p className="text-sm font-black text-[#008F87]">{number}</p><h3 className="text-2xl font-black">{name}</h3><p className="text-base leading-7 text-[#69717D]">{description}</p><Link href={href} className="text-sm font-black transition hover:text-[#008F87]">Conocer más →</Link></article>;
}
