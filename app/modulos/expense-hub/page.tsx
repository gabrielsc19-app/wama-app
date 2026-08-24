import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Camera,
  Check,
  FileSearch,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import WamaShell from "../../../src/components/brand/WamaShell";
import WamaInteractiveFlow from "../../../src/components/marketing/WamaInteractiveFlow";

const benefits = [
  {
    icon: Camera,
    title: "Captura en segundos",
    text: "Fotografía una boleta o sube una factura desde el celular, tablet o computador.",
  },
  {
    icon: BrainCircuit,
    title: "Lectura inteligente",
    text: "WAMA prepara comercio, RUT, fecha, folio, neto, IVA y total para que el usuario solo confirme.",
  },
  {
    icon: ShieldCheck,
    title: "Control y trazabilidad",
    text: "La evidencia original nunca se sobrescribe. Cada modificación queda registrada y visible para Finanzas.",
  },
];

const steps = [
  ["01", "Captura", "Toma una foto o carga el documento."],
  ["02", "WAMA procesa", "Extrae y clasifica los datos principales."],
  ["03", "Confirma", "Completa motivo, centro de costo y proyecto."],
  ["04", "Aprueba", "Jefatura y Finanzas revisan en un solo flujo."],
];

export default function ExpenseHubLandingPage() {
  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <section className="relative overflow-hidden bg-[#0B0C0E] text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-[#00E5D6]/12 blur-[170px]" />
            <div className="absolute bottom-[-16rem] left-[12%] h-[28rem] w-[28rem] rounded-full bg-[#00E5D6]/8 blur-[150px]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-32">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00E5D6]/25 bg-[#00E5D6]/8 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#00E5D6]">
                <Sparkles className="h-4 w-4" />
                Nuevo módulo WAMA
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
                Rinde gastos. WAMA se encarga del resto.
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#B7BEC8]">
                Digitaliza boletas, facturas, viáticos, anticipos y reembolsos con una experiencia simple para colaboradores y control total para Finanzas.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-[#D8DCE1]">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#00E5D6]" /> 10 usuarios incluidos</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#00E5D6]" /> Prueba gratis 15 días</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#00E5D6]" /> Sin capacitación</span>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/trial?module=expense-hub" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5">
                  Probar gratis 15 días <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/expense-hub" className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white transition hover:border-[#00E5D6]/60 hover:text-[#00E5D6]">
                  Ver demo funcional
                </Link>
              </div>

              <p className="mt-7 text-sm text-[#9098A3]">
                USD 10 al mes · 10 usuarios incluidos · bloques adicionales de 10 usuarios
              </p>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/12 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[1.5rem] bg-[#F5F6F7] p-5 text-[#0B0C0E]">
                  <div className="flex items-center justify-between border-b border-[#DDE1E6] pb-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">Nueva rendición</p>
                      <p className="mt-1 text-xl font-black">Documento procesado</p>
                    </div>
                    <div className="rounded-full bg-[#DFFBF8] p-3 text-[#008F87]"><BadgeCheck className="h-6 w-6" /></div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-[0.82fr_1.18fr]">
                    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#AAB2BC] bg-white p-5 text-center">
                      <ReceiptText className="h-12 w-12 text-[#008F87]" />
                      <p className="mt-4 text-sm font-black">Boleta original</p>
                      <p className="mt-1 text-xs text-[#707985]">Evidencia protegida</p>
                    </div>
                    <div className="space-y-3">
                      <DataRow label="Comercio" value="COPEC" />
                      <DataRow label="Fecha" value="27/07/2026" />
                      <DataRow label="Categoría" value="Combustible" />
                      <DataRow label="Total" value="$48.250" strong />
                      <div className="rounded-xl border border-[#BDEDE8] bg-[#EFFFFD] p-3 text-xs font-bold text-[#087A73]">
                        WAMA no detectó diferencias entre el documento y los datos declarados.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">Simple para todos</p>
                <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">Una rendición en menos de 30 segundos.</h2>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {benefits.map(({ icon: Icon, title, text }) => (
                  <article key={title} className="border-t border-[#DDE1E6] pt-7">
                    <Icon className="h-7 w-7 text-[#008F87]" />
                    <h3 className="mt-5 text-xl font-black tracking-[-0.03em]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#69717D]">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#E9EDF0]">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">Mira el flujo completo</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">Una foto desde el celular. Todo el proceso resuelto.</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#66707C]">Recorre cada etapa: captura, lectura inteligente, confirmación, aprobación, control financiero y dashboard.</p>
            <div className="mt-12"><WamaInteractiveFlow kind="expense" /></div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E9] bg-[#F5F6F7]">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">Cómo funciona</p>
                <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">Del documento al pago, sin perder trazabilidad.</h2>
              </div>
              <Link href="/expense-hub" className="inline-flex items-center gap-2 text-sm font-black text-[#008F87]">Explorar la experiencia <ArrowRight className="h-4 w-4" /></Link>
            </div>

            <div className="mt-14 divide-y divide-[#D5DAE0] border-y border-[#D5DAE0]">
              {steps.map(([number, title, text]) => (
                <div key={number} className="grid gap-5 py-8 sm:grid-cols-[4rem_0.55fr_1fr]">
                  <p className="text-sm font-black text-[#008F87]">{number}</p>
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="text-base leading-7 text-[#69717D]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">Control financiero</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">Los datos se pueden corregir. La evidencia no se altera.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#69717D]">
                WAMA conserva la fotografía original, compara los datos detectados con los declarados y genera alertas automáticas cuando encuentra diferencias relevantes.
              </p>
              <div className="mt-8 space-y-4 text-sm font-bold">
                <Feature icon={FileSearch} text="Comparación OCR versus datos declarados" />
                <Feature icon={ShieldCheck} text="Historial completo de cambios y responsables" />
                <Feature icon={Users} text="Flujos por colaborador, jefatura y Finanzas" />
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#0B0C0E] p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFBE55]">Revisión requerida</p>
                  <h3 className="mt-2 text-2xl font-black">Diferencia detectada</h3>
                </div>
                <ShieldCheck className="h-7 w-7 text-[#00E5D6]" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <CompareBox label="Documento original" value="$48.250" />
                <CompareBox label="Declarado por usuario" value="$58.250" warning />
              </div>
              <div className="mt-4 rounded-2xl border border-[#FFBE55]/25 bg-[#FFBE55]/10 p-4">
                <p className="text-sm font-black text-[#FFD58F]">Diferencia: $10.000</p>
                <p className="mt-1 text-xs leading-5 text-[#E4E7EA]">La rendición fue enviada a Finanzas y el cambio quedó registrado en auditoría.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0B0C0E] text-white">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#00E5D6]">Precio simple</p>
            <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <h2 className="max-w-4xl text-5xl font-black leading-[1] tracking-[-0.06em] md:text-7xl">USD 10 al mes. Tu equipo rinde desde el primer día.</h2>
              <div className="lg:pb-2">
                <p className="text-lg leading-8 text-[#B7BEC8]">Incluye 10 usuarios, todas las funciones esenciales y 15 días de prueba gratuita.</p>
                <Link href="/trial?module=expense-hub" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E]">Activar prueba gratis <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}

function DataRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-xl border border-[#E1E5E9] bg-white px-4 py-3"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#858E99]">{label}</p><p className={`mt-1 ${strong ? "text-xl" : "text-sm"} font-black`}>{value}</p></div>;
}

function Feature({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return <div className="flex items-center gap-3"><span className="rounded-full bg-[#DFFBF8] p-2 text-[#008F87]"><Icon className="h-4 w-4" /></span>{text}</div>;
}

function CompareBox({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${warning ? "border-[#FFBE55]/30 bg-[#FFBE55]/10" : "border-white/10 bg-white/[0.05]"}`}><p className="text-xs text-[#AEB5BE]">{label}</p><p className={`mt-2 text-2xl font-black ${warning ? "text-[#FFD58F]" : "text-white"}`}>{value}</p></div>;
}
