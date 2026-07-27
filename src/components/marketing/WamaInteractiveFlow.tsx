"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  HandCoins,
  MailCheck,
  MessageSquareText,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

export type FlowKind = "expense" | "sales";

type Step = {
  label: string;
  title: string;
  description: string;
  icon: typeof Camera;
};

const FLOW: Record<FlowKind, Step[]> = {
  expense: [
    { label: "01 · Captura", title: "Fotografía la boleta", description: "El colaborador abre WAMA desde su celular y toma una foto. Sin formularios largos.", icon: Camera },
    { label: "02 · Lectura inteligente", title: "WAMA extrae los datos", description: "OCR e IA detectan comercio, fecha, monto y categoría en segundos.", icon: ScanLine },
    { label: "03 · Confirmación", title: "El usuario revisa y envía", description: "Solo confirma los datos sugeridos y agrega centro de costo o proyecto.", icon: ReceiptText },
    { label: "04 · Aprobación", title: "La jefatura decide", description: "Aprueba, solicita corrección o rechaza con trazabilidad completa.", icon: UserRoundCheck },
    { label: "05 · Control financiero", title: "Finanzas valida", description: "WAMA compara evidencia, OCR y monto declarado antes de programar el pago.", icon: ShieldCheck },
    { label: "06 · Gestión", title: "Gerencia ve el resultado", description: "Dashboards, alertas y tendencias reemplazan planillas y correos dispersos.", icon: BarChart3 },
  ],
  sales: [
    { label: "01 · Prospecto", title: "Crea una oportunidad", description: "Registra una empresa objetivo, responsable y fuente comercial en segundos.", icon: BriefcaseBusiness },
    { label: "02 · Seguimiento", title: "Define el próximo paso", description: "Reuniones, llamadas y tareas quedan visibles para todo el equipo.", icon: MessageSquareText },
    { label: "03 · Propuesta", title: "Adjunta y envía documentos", description: "La propuesta comercial queda asociada al negocio y a su historial.", icon: MailCheck },
    { label: "04 · Negociación", title: "Mueve el deal por etapas", description: "Probabilidad, monto y fecha estimada se actualizan con trazabilidad.", icon: HandCoins },
    { label: "05 · Cierre", title: "Convierte el negocio", description: "Ganado o perdido, WAMA conserva las razones y aprendizajes del proceso.", icon: CheckCircle2 },
    { label: "06 · Inteligencia", title: "Decide con datos", description: "Pipeline, win rate y actividad comercial aparecen en un dashboard ejecutivo.", icon: BarChart3 },
  ],
};

export default function WamaInteractiveFlow({ kind, compact = false }: { kind: FlowKind; compact?: boolean }) {
  const steps = useMemo(() => FLOW[kind], [kind]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((value) => (value + 1) % steps.length), 4200);
    return () => window.clearInterval(id);
  }, [steps.length]);

  const step = steps[active];
  const Icon = step.icon;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#DDE3E8] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.14)]">
      <div className="grid min-w-0 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
        <div className={`min-w-0 bg-white ${compact ? "p-6" : "p-7 sm:p-9 lg:p-10"}`}>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#008F87]">
            <Sparkles className="h-4 w-4" /> Flujo interactivo
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#7C8794]">{step.label}</p>
          <h3 className={`${compact ? "text-3xl" : "text-[clamp(2rem,4vw,3.25rem)]"} mt-3 max-w-[12ch] font-black leading-[0.98] tracking-[-0.055em] text-[#0B0C0E]`}>
            {step.title}
          </h3>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#5F6975]">{step.description}</p>

          <div className="mt-8 flex flex-wrap gap-2" aria-label="Etapas del flujo">
            {steps.map((item, index) => (
              <button
                key={item.label}
                type="button"
                aria-label={`Ver ${item.title}`}
                aria-current={index === active ? "step" : undefined}
                onClick={() => setActive(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${index === active ? "w-12 bg-[#00CFC3]" : "w-2.5 bg-[#C9D0D7] hover:bg-[#95A1AC]"}`}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 bg-[#0B0C0E] p-4 sm:p-6 lg:p-8">
          <div className="relative min-h-[390px] min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#11161B] p-4 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(0,207,195,0.18),transparent_34%)]" />
            <div className="relative flex min-h-[340px] min-w-0 items-center justify-center overflow-hidden">
              <div key={`${kind}-${active}`} className="w-full min-w-0 max-w-full animate-[wamaFlowIn_500ms_ease-out]">
                {kind === "expense" ? <ExpenseScene index={active} Icon={Icon} /> : <SalesScene index={active} Icon={Icon} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes wamaFlowIn {
          from { opacity: 0; transform: translateY(12px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wamaScan {
          0% { transform: translateY(-110px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(110px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}

function ExpenseScene({ index, Icon }: { index: number; Icon: typeof Camera }) {
  if (index === 0) {
    return (
      <PhoneFrame>
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#101419] px-5 text-center text-white">
          <div className="absolute inset-5 rounded-3xl border-2 border-white/70" />
          <Camera className="h-14 w-14 text-[#00E5D6]" />
          <p className="mt-5 text-lg font-black">Fotografía el documento</p>
          <p className="mt-2 text-sm text-[#AEB6C0]">La cámara detecta los bordes automáticamente.</p>
          <div className="mt-8 h-16 w-16 rounded-full border-4 border-white bg-white/15" />
        </div>
      </PhoneFrame>
    );
  }

  if (index === 1) {
    return (
      <DocumentPanel scan>
        <Icon className="h-10 w-10 text-[#00E5D6]" />
        <p className="mt-4 text-xl font-black text-white">Leyendo documento...</p>
        <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniData label="Comercio" value="COPEC" />
          <MiniData label="Fecha" value="27/07/2026" />
          <MiniData label="Categoría" value="Combustible" />
          <MiniData label="Total" value="$48.250" />
        </div>
      </DocumentPanel>
    );
  }

  if (index === 2) {
    return (
      <PhoneFrame>
        <div className="space-y-3 p-3">
          <MiniData label="Comercio" value="COPEC" />
          <MiniData label="Monto" value="$48.250" />
          <MiniData label="Centro de costo" value="Operaciones" />
          <button className="mt-4 w-full rounded-full bg-[#00D7CC] px-4 py-3 text-sm font-black text-[#0B0C0E] transition hover:bg-[#7AFFF6]">Confirmar y enviar</button>
        </div>
      </PhoneFrame>
    );
  }

  if (index === 3) return <DecisionCard title="Rendición #EX-1042" amount="$48.250" status="Pendiente de aprobación" buttons />;

  if (index === 4) {
    return (
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Compare label="OCR" value="$48.250" />
        <Compare label="Declarado" value="$48.250" />
        <div className="min-w-0 rounded-2xl border border-[#00D7CC]/30 bg-[#00D7CC]/10 p-5 sm:col-span-2">
          <BadgeCheck className="h-7 w-7 text-[#00E5D6]" />
          <p className="mt-3 font-black text-white">Sin diferencias detectadas</p>
          <p className="mt-1 text-sm text-[#AEB6C0]">La evidencia original queda protegida.</p>
        </div>
      </div>
    );
  }

  return <DashboardScene kind="expense" />;
}

function SalesScene({ index, Icon }: { index: number; Icon: typeof Camera }) {
  if (index === 0) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl bg-white p-6 text-[#0B0C0E]">
        <Icon className="h-8 w-8 text-[#008F87]" />
        <p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Nueva oportunidad</p>
        <h4 className="mt-2 text-2xl font-black">Grupo Horizonte</h4>
        <p className="mt-2 text-sm text-[#66707C]">Facility Management · UF 720</p>
        <div className="mt-5 h-2 rounded-full bg-[#E3E7EB]"><div className="h-2 w-[22%] rounded-full bg-[#00BEB3]" /></div>
      </div>
    );
  }

  if (index === 1) return <TimelineScene />;

  if (index === 2) {
    return (
      <DocumentPanel>
        <MailCheck className="h-10 w-10 text-[#00E5D6]" />
        <p className="mt-4 text-xl font-black text-white">Propuesta enviada</p>
        <p className="mt-2 text-sm text-[#AEB6C0]">Versión 3 · PDF · registrada en el historial</p>
        <div className="mt-6 max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white" title="Propuesta_Grupo_Horizonte_v3.pdf">
          Propuesta_Grupo_Horizonte_v3.pdf
        </div>
      </DocumentPanel>
    );
  }

  if (index === 3) return <DecisionCard title="Grupo Horizonte" amount="UF 720" status="Negociación · 70%" />;

  if (index === 4) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-7 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-[#00E5D6]" />
        <p className="mt-5 text-3xl font-black text-white">Cierre ganado</p>
        <p className="mt-2 text-[#B7BEC8]">Contrato enviado a evaluación documental.</p>
      </div>
    );
  }

  return <DashboardScene kind="sales" />;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto h-[310px] w-full max-w-[210px] overflow-hidden rounded-[2.2rem] border-[7px] border-[#050607] bg-[#F5F6F7] p-2 text-[#0B0C0E] shadow-2xl">
      <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-[#252A30]" />
      {children}
    </div>
  );
}

function DocumentPanel({ children, scan = false }: { children: React.ReactNode; scan?: boolean }) {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0B0C0E] p-5 sm:p-6">
      {scan && <div className="pointer-events-none absolute left-6 right-6 top-1/2 h-px bg-[#00E5D6] shadow-[0_0_18px_4px_rgba(0,229,214,.55)] animate-[wamaScan_2.2s_linear_infinite]" />}
      {children}
    </div>
  );
}

function MiniData({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[#DDE2E7] bg-white px-3 py-3 text-[#0B0C0E] sm:px-4">
      <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#7A8490]">{label}</p>
      <p className="mt-1 truncate text-sm font-black" title={value}>{value}</p>
    </div>
  );
}

function DecisionCard({ title, amount, status, buttons = false }: { title: string; amount: string; status: string; buttons?: boolean }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-xl overflow-hidden rounded-3xl bg-white p-5 text-[#0B0C0E] shadow-xl sm:p-6">
      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Flujo activo</p>
          <h4 className="mt-2 break-words text-[clamp(1.55rem,4vw,2.15rem)] font-black leading-tight">{title}</h4>
        </div>
        <p className="whitespace-nowrap text-left text-[clamp(1.3rem,3vw,1.75rem)] font-black tabular-nums sm:text-right">{amount}</p>
      </div>
      <p className="mt-5 inline-flex max-w-full rounded-full bg-[#FFF4DE] px-4 py-2 text-sm font-black text-[#9B6500]">{status}</p>
      {buttons && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="rounded-full border border-[#00BEB3]/40 bg-[#E6FFFC] px-4 py-3 text-sm font-black text-[#007E77] transition hover:bg-white">Observar</button>
          <button className="rounded-full bg-[#00D7CC] px-4 py-3 text-sm font-black text-[#0B0C0E] transition hover:bg-[#7AFFF6]">Aprobar</button>
        </div>
      )}
    </div>
  );
}

function Compare({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs text-[#9EA7B1]">{label}</p>
      <p className="mt-2 whitespace-nowrap text-[clamp(1.45rem,4vw,2.15rem)] font-black leading-none tracking-[-0.03em] tabular-nums text-white">{value}</p>
      <p className="mt-3 text-xs font-black text-[#00E5D6]">Coincide</p>
    </div>
  );
}

function DashboardScene({ kind }: { kind: FlowKind }) {
  const expense = kind === "expense";
  const value = expense ? "$12.840.600" : "UF 4.250";
  const label = expense ? "Gasto mensual" : "Pipeline estimado";
  const detail = expense ? "8% bajo presupuesto" : "Win rate 38%";
  const summary = expense
    ? [
        ["Presupuesto", "$14.000.000"],
        ["Comprometido", "$9.250.000"],
        ["Disponible", "$2.170.000"],
      ]
    : [
        ["Oportunidades", "56"],
        ["En negociación", "18"],
        ["Ganadas", "12"],
      ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl overflow-hidden rounded-3xl bg-white p-5 text-[#0B0C0E] sm:p-7">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(250px,1.1fr)] xl:items-center">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Dashboard ejecutivo</p>
          <p className="mt-5 text-sm text-[#69717D]">{label}</p>
          <p className="mt-2 whitespace-nowrap text-[clamp(2rem,6vw,3.75rem)] font-black leading-none tracking-[-0.055em] tabular-nums">{value}</p>
          <p className="mt-3 text-sm font-black text-[#008F87]">{detail}</p>
        </div>

        <div className="h-40 min-w-0 overflow-hidden rounded-2xl border border-[#DCE5E8] bg-[#F4F8F9] p-4">
          <div className="flex h-full items-end gap-2">
            {[35, 62, 49, 78, 65, 91, 82, 96].map((height, index) => (
              <div key={index} className="min-w-0 flex-1 rounded-t-md bg-[#00BEB3]" style={{ height: `${height}%`, opacity: 0.42 + index * 0.06 }} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
        {summary.map(([name, amount]) => (
          <div key={name} className="min-w-0 overflow-hidden rounded-2xl border border-[#E0E5E9] bg-[#FAFBFC] p-4">
            <p className="truncate text-xs text-[#69717D]" title={name}>{name}</p>
            <p className="mt-1 whitespace-nowrap text-[clamp(1rem,3vw,1.35rem)] font-black tabular-nums">{amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineScene() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      {["Reunión comercial realizada", "Propuesta actualizada", "Llamada de seguimiento"].map((item, index) => (
        <div key={item} className="flex min-w-0 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#00E5D6]" />
          <div className="min-w-0">
            <p className="break-words font-black text-white">{item}</p>
            <p className="mt-1 text-xs text-[#AEB6C0]">{index === 0 ? "Hoy · 09:40" : index === 1 ? "Ayer · 16:15" : "19 jul · 11:20"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
