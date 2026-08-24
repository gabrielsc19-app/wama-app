import Link from "next/link";
import { ArrowRight, BarChart3, BriefcaseBusiness, FileText, Route, Users } from "lucide-react";
import WamaShell from "../../../src/components/brand/WamaShell";
import WamaInteractiveFlow from "../../../src/components/marketing/WamaInteractiveFlow";

export default function SalesHubModulePage() {
  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <section className="relative overflow-hidden bg-[#0B0C0E] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(0,229,214,.14),transparent_36%)]" />
          <div className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:py-28">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#00E5D6]">WAMA Sales Hub</p>
              <h1 className="mt-6 text-5xl font-black leading-[.96] tracking-[-.065em] md:text-7xl">Convierte seguimiento en ventas.</h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#B7BEC8]">Ordena prospectos, oportunidades, actividades, propuestas y resultados comerciales dentro de un único flujo.</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row"><Link href="/acceso/sales-hub" className="rounded-full bg-[#00E5D6] px-8 py-4 text-center text-sm font-black text-[#0B0C0E]">Entrar al portal Sales</Link><Link href="/trial?module=sales-hub" className="rounded-full border border-white/20 px-8 py-4 text-center text-sm font-black">Prueba gratis 15 días</Link></div>
            </div>
            <WamaInteractiveFlow kind="sales" compact />
          </div>
        </section>

        <section className="bg-[#E9EDF0]">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <p className="text-sm font-black uppercase tracking-[.22em] text-[#008F87]">Cómo funciona</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-.055em] md:text-6xl">Del primer contacto al cierre, sin perder el próximo paso.</h2>
            <div className="mt-12"><WamaInteractiveFlow kind="sales" /></div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <div className="grid gap-10 md:grid-cols-3">
              <Feature icon={BriefcaseBusiness} title="Pipeline vivo" text="Cada negocio muestra monto, etapa, probabilidad, responsable y próxima acción." />
              <Feature icon={Route} title="Seguimiento trazable" text="Reuniones, llamadas, tareas, comentarios y cambios de etapa quedan registrados." />
              <Feature icon={BarChart3} title="Gestión ejecutiva" text="Pipeline, cierres, win rate y actividad comercial en un dashboard listo para decidir." />
              <Feature icon={Users} title="Clientes y contactos" text="Información centralizada para que el equipo trabaje sobre la misma base." />
              <Feature icon={FileText} title="Documentos asociados" text="Propuestas, contratos y archivos quedan vinculados al negocio correcto." />
              <Feature icon={ArrowRight} title="Flujo posterior al cierre" text="Al ganar, la oportunidad puede continuar a revisión documental o implementación." />
            </div>
          </div>
        </section>

        <section className="bg-[#0B0C0E] text-white"><div className="mx-auto max-w-7xl px-6 py-24 lg:py-32"><h2 className="max-w-5xl text-5xl font-black leading-[1] tracking-[-.06em] md:text-7xl">Tu equipo sabe qué hacer después.</h2><Link href="/acceso/sales-hub" className="mt-9 inline-flex rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]">Explorar Sales Hub <ArrowRight className="ml-2 h-4 w-4" /></Link></div></section>
      </main>
    </WamaShell>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof BriefcaseBusiness; title: string; text: string }) {
  return <article className="border-t border-[#D8DEE4] pt-7"><Icon className="h-7 w-7 text-[#008F87]" /><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-[#69717D]">{text}</p></article>;
}
