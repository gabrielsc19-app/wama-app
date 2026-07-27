import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Camera, CheckCircle2, ReceiptText, Sparkles } from "lucide-react";
import WamaShell from "../../src/components/brand/WamaShell";

const portals = [
  {
    label: "Sales Hub",
    kicker: "Vende con seguimiento real",
    title: "Convierte oportunidades en negocios cerrados.",
    text: "Pipeline, actividades, propuestas, negociación y resultados comerciales en un solo flujo.",
    href: "/acceso/sales-hub",
    action: "Entrar a Sales Hub",
    icon: BriefcaseBusiness,
    steps: ["Prospecto", "Seguimiento", "Propuesta", "Cierre"],
  },
  {
    label: "Expense Hub",
    kicker: "Rinde desde el celular",
    title: "De una foto a un gasto aprobado y controlado.",
    text: "Captura documentos, lectura inteligente, aprobación, control financiero y auditoría.",
    href: "/acceso/expense-hub",
    action: "Entrar a Expense Hub",
    icon: ReceiptText,
    steps: ["Foto", "OCR + IA", "Aprobación", "Control"],
  },
];

export default function AccesoPage() {
  return (
    <WamaShell>
      <main className="min-h-[calc(100vh-5rem)] overflow-hidden bg-[#0B0C0E] text-white">
        <section className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#00E5D6]/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">Acceso a productos</p>
              <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-[-0.065em] md:text-7xl">Elige cómo quieres trabajar hoy.</h1>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#00E5D6] p-3 text-[#0B0C0E]"><Sparkles className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-black">Una cuenta. Dos experiencias especializadas.</h2>
                  <p className="mt-3 max-w-2xl leading-7 text-[#B7BEC8]">Cada Hub mantiene su propio flujo, permisos y portal. Tu empresa puede activar uno o ambos y acceder desde computador, tablet o celular.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-14 grid gap-6 lg:grid-cols-2">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <article key={portal.label} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#12161B] transition duration-300 hover:-translate-y-1 hover:border-[#00E5D6]/45 hover:shadow-[0_30px_100px_rgba(0,229,214,0.10)]">
                  <div className="border-b border-white/10 p-7 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">{portal.label}</p>
                        <p className="mt-2 text-sm font-bold text-[#AEB6C0]">{portal.kicker}</p>
                      </div>
                      <div className="rounded-2xl border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-3 text-[#00E5D6]"><Icon className="h-7 w-7" /></div>
                    </div>
                    <h2 className="mt-6 text-4xl font-black leading-[1] tracking-[-0.055em] sm:text-5xl">{portal.title}</h2>
                    <p className="mt-5 text-base leading-7 text-[#B7BEC8]">{portal.text}</p>
                  </div>

                  <div className="p-7 sm:p-8">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {portal.steps.map((step, index) => (
                        <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                          <div className="flex items-center gap-2 text-[#00E5D6]"><CheckCircle2 className="h-4 w-4" /><span className="text-xs font-black">0{index + 1}</span></div>
                          <p className="mt-3 text-sm font-black">{step}</p>
                        </div>
                      ))}
                    </div>
                    <Link href={portal.href} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:bg-white sm:w-auto">
                      {portal.action}<ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="relative mt-10 rounded-[2rem] border border-[#00E5D6]/20 bg-[#00E5D6]/[0.07] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div className="flex items-start gap-4"><Camera className="mt-1 h-7 w-7 shrink-0 text-[#00E5D6]" /><div><h3 className="text-2xl font-black">WAMA también vive en tu celular.</h3><p className="mt-2 text-sm leading-6 text-[#B7BEC8]">Instala la aplicación web y captura gastos, revisa tareas o entra a tus Hubs sin abrir el navegador.</p></div></div>
            <Link href="/descargar-app" className="mt-6 inline-flex shrink-0 items-center gap-2 rounded-full border border-[#00E5D6]/40 bg-[#0B0C0E] px-6 py-4 text-sm font-black text-white transition hover:border-[#00E5D6] hover:text-[#00E5D6] sm:mt-0">Descargar app <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}
