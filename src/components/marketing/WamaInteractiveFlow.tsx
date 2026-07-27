"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Handshake,
  MailCheck,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Trophy,
  UserRoundCheck,
  Users,
} from "lucide-react";

export type FlowKind = "expense" | "sales";

type Step = {
  number: string;
  label: string;
  title: string;
  description: string;
  icon: typeof Camera;
};

const FLOW: Record<FlowKind, Step[]> = {
  expense: [
    { number: "01", label: "Captura", title: "Fotografía el documento", description: "Toma una foto desde el celular. WAMA valida la calidad y conserva la evidencia original.", icon: Camera },
    { number: "02", label: "Lectura IA", title: "WAMA extrae los datos", description: "OCR e inteligencia identifican comercio, fecha, categoría y monto en segundos.", icon: ScanLine },
    { number: "03", label: "Confirmación", title: "Revisa y envía", description: "Confirma centro de costo, proyecto y motivo antes de enviar la rendición.", icon: ReceiptText },
    { number: "04", label: "Aprobación", title: "La jefatura decide", description: "Aprueba, observa o rechaza con trazabilidad completa.", icon: UserRoundCheck },
    { number: "05", label: "Validación", title: "Finanzas controla", description: "WAMA compara documento, OCR y monto declarado para detectar diferencias.", icon: ShieldCheck },
    { number: "06", label: "Dashboard", title: "Gerencia ve el resultado", description: "Presupuesto, alertas y tendencias en una sola vista ejecutiva.", icon: BarChart3 },
  ],
  sales: [
    { number: "01", label: "Prospecto", title: "Crea una oportunidad", description: "Registra empresa, contacto, responsable, fuente y valor estimado.", icon: Users },
    { number: "02", label: "Seguimiento", title: "Define el próximo paso", description: "Llamadas, reuniones y tareas quedan visibles para todo el equipo.", icon: FileCheck2 },
    { number: "03", label: "Propuesta", title: "Adjunta y envía", description: "La propuesta comercial queda asociada al negocio y a su historial.", icon: MailCheck },
    { number: "04", label: "Negociación", title: "Avanza el deal", description: "Monto, probabilidad y fecha estimada se actualizan con trazabilidad.", icon: Handshake },
    { number: "05", label: "Cierre", title: "Convierte el negocio", description: "Ganado o perdido, WAMA conserva razones y aprendizajes.", icon: Trophy },
    { number: "06", label: "Dashboard", title: "Decide con datos", description: "Pipeline, win rate y actividad comercial en una vista ejecutiva.", icon: BarChart3 },
  ],
};

export default function WamaInteractiveFlow({ kind }: { kind: FlowKind; compact?: boolean }) {
  const steps = useMemo(() => FLOW[kind], [kind]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((value) => (value + 1) % steps.length), 7000);
    return () => window.clearInterval(id);
  }, [steps.length]);

  const current = steps[active];

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#D7DEE4] bg-[#0B0C0E] shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:rounded-[2rem]">
      <div className="flex h-[570px] min-w-0 flex-col p-4 sm:h-[620px] sm:p-6 lg:h-[650px] lg:p-8">
        <FlowRail steps={steps} active={active} onSelect={setActive} />

        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.35rem] bg-white sm:mt-5 sm:rounded-[1.6rem]">
          <div className="flex min-h-[118px] flex-col justify-between gap-4 border-b border-[#E3E8EC] px-5 py-5 sm:min-h-[126px] sm:flex-row sm:items-end sm:px-7 lg:px-9">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">{current.number} · {current.label}</span>
                <span className="hidden h-px w-10 bg-[#B9C5CB] sm:block" />
              </div>
              <h3 className="mt-2 text-[1.7rem] font-black leading-[1] tracking-[-0.045em] text-[#0B0C0E] sm:text-[2.15rem] lg:text-[2.45rem]">{current.title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64707B] sm:text-base">{current.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => setActive((active - 1 + steps.length) % steps.length)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D4DCE2] bg-white text-[#0B0C0E] transition hover:border-[#00BEB3]" aria-label="Paso anterior"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" onClick={() => setActive((active + 1) % steps.length)} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#00D7CC] px-4 text-sm font-black text-[#0B0C0E] transition hover:bg-[#72FFF7]">Siguiente <ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          <div key={`${kind}-${active}`} className="min-h-0 flex-1 overflow-hidden p-4 sm:p-5 lg:p-6 animate-[wamaFlowIn_320ms_ease-out]">
            {kind === "expense" ? <ExpenseVisual index={active} /> : <SalesVisual index={active} />}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes wamaFlowIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function FlowRail({ steps, active, onSelect }: { steps: Step[]; active: number; onSelect: (index: number) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const selected = index === active;
        return (
          <button key={step.number} type="button" onClick={() => onSelect(index)} className={`min-w-0 rounded-xl border px-1 py-2.5 text-center transition sm:rounded-2xl sm:px-2 sm:py-3 ${selected ? "border-[#00D7CC] bg-[#00D7CC]/12" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"}`}>
            <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8 ${selected ? "bg-[#00D7CC] text-[#0B0C0E]" : "bg-white/[0.07] text-[#9FAAB4]"}`}><Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></span>
            <span className={`mt-1.5 block text-[8px] font-black leading-tight sm:text-[10px] ${selected ? "text-white" : "text-[#AAB4BD]"}`}><span className="hidden sm:inline">{step.number} </span>{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ExpenseVisual({ index }: { index: number }) {
  if (index === 0) return <CaptureVisual />;
  if (index === 1) return <OcrVisual />;
  if (index === 2) return <ConfirmVisual />;
  if (index === 3) return <ApprovalVisual />;
  if (index === 4) return <ValidationVisual />;
  return <ExpenseDashboard />;
}

function SalesVisual({ index }: { index: number }) {
  if (index === 0) return <OpportunityVisual />;
  if (index === 1) return <FollowupVisual />;
  if (index === 2) return <ProposalVisual />;
  if (index === 3) return <NegotiationVisual />;
  if (index === 4) return <CloseVisual />;
  return <SalesDashboard />;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`h-full min-w-0 overflow-hidden rounded-2xl border border-[#E0E6EA] bg-[#F8FAFB] ${className}`}>{children}</div>;
}

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E1E7EB] bg-white p-3 sm:p-4">
      <p className="truncate text-[10px] font-bold text-[#65717C] sm:text-xs">{label}</p>
      <p className="mt-1 truncate text-[clamp(1.15rem,2.4vw,2rem)] font-black leading-none tracking-[-0.04em] text-[#0B0C0E]">{value}</p>
      {note ? <p className="mt-2 truncate text-[10px] font-black text-[#008F87] sm:text-xs">{note}</p> : null}
    </div>
  );
}

function CaptureVisual() {
  return <Panel className="grid place-items-center p-4 sm:p-6"><div className="grid w-full max-w-4xl gap-5 md:grid-cols-[0.85fr_1.15fr] md:items-center"><div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00D7CC]/15 text-[#00AFA5]"><Camera className="h-6 w-6" /></span><h4 className="mt-4 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Captura desde el celular</h4><p className="mt-3 max-w-md text-sm leading-6 text-[#68737E]">La cámara guía el encuadre, valida la nitidez y conserva la imagen original.</p></div><div className="rounded-2xl border-2 border-dashed border-[#00BEB3]/45 bg-white p-5"><div className="flex min-h-[180px] flex-col items-center justify-center text-center"><ScanLine className="h-10 w-10 text-[#00AFA5]" /><p className="mt-4 text-xl font-black">Documento detectado</p><p className="mt-2 text-sm text-[#6B7580]">Calidad correcta · listo para leer</p></div></div></div></Panel>;
}

function OcrVisual() {
  return <Panel className="grid gap-4 p-4 sm:grid-cols-[1.15fr_0.85fr] sm:p-5"><div className="grid grid-cols-2 gap-3"><Kpi label="Comercio" value="COPEC" /><Kpi label="Fecha" value="27/07/26" /><Kpi label="Categoría" value="Combustible" /><Kpi label="Total" value="$48.250" /></div><div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 text-center"><div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-[#00D7CC] text-2xl font-black">98%</div><p className="mt-4 font-black">Alta confianza</p><p className="mt-2 text-sm text-[#68737E]">Documento completo y campos clave identificados.</p></div></Panel>;
}

function ConfirmVisual() {
  return <Panel className="flex flex-col justify-between p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-3"><Kpi label="Centro de costo" value="Operaciones" /><Kpi label="Proyecto" value="Mall Costanera" /><Kpi label="Monto" value="$48.250" /></div><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className="inline-flex w-fit rounded-full bg-[#E8F9F7] px-4 py-2 text-sm font-black text-[#008F87]">Sin observaciones</span><button type="button" className="inline-flex w-fit rounded-full bg-[#00D7CC] px-6 py-3 text-sm font-black">Enviar rendición</button></div></Panel>;
}

function ApprovalVisual() {
  return <Panel className="grid place-items-center p-4 sm:p-6"><div className="w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">Flujo activo</p><h4 className="mt-2 text-2xl font-black sm:text-3xl">Rendición #EX-1042</h4><p className="mt-2 text-3xl font-black">$48.250</p></div><span className="inline-flex w-fit rounded-full bg-[#FFF2D9] px-4 py-2 text-sm font-black text-[#9C6400]">Pendiente de aprobación</span></div><div className="mt-6 flex gap-3"><button type="button" className="rounded-full border border-[#D4DAE0] px-5 py-3 text-sm font-black">Observar</button><button type="button" className="rounded-full bg-[#0B0C0E] px-5 py-3 text-sm font-black text-white">Aprobar</button></div></div></Panel>;
}

function ValidationVisual() {
  return <Panel className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5"><Kpi label="OCR" value="$48.250" note="Coincide" /><Kpi label="Declarado" value="$48.250" note="Coincide" /><div className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-[#BFEDE8] bg-[#EAFBF9] p-4"><CheckCircle2 className="h-6 w-6 shrink-0 text-[#00AFA5]" /><div><p className="font-black">Validación completada</p><p className="mt-1 text-sm text-[#62707A]">Sin diferencias entre evidencia, lectura OCR y monto declarado.</p></div></div></Panel>;
}

function ExpenseDashboard() {
  return <Panel className="grid gap-4 p-4 sm:grid-cols-[1.05fr_0.95fr] sm:p-5"><div className="flex min-w-0 flex-col justify-between rounded-2xl bg-white p-4 sm:p-5"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">Gasto mensual</p><p className="mt-2 truncate text-[clamp(2rem,5vw,4.2rem)] font-black leading-none tracking-[-0.055em]">$12.840.600</p><p className="mt-3 font-black text-[#008F87]">8% bajo presupuesto</p></div><div className="mt-5 grid grid-cols-2 gap-3"><Kpi label="Presupuesto" value="$14,0 MM" /><Kpi label="Disponible" value="$2,17 MM" /></div></div><div className="flex min-h-[180px] items-end gap-3 rounded-2xl bg-white p-5"><Bar height="38%" /><Bar height="55%" /><Bar height="48%" /><Bar height="72%" /><Bar height="64%" /><Bar height="88%" /></div></Panel>;
}

function OpportunityVisual() {
  return <Panel className="grid place-items-center p-4 sm:p-6"><div className="w-full max-w-4xl rounded-2xl bg-white p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">Nueva oportunidad</p><h4 className="mt-2 text-2xl font-black sm:text-3xl">Grupo Horizonte</h4><p className="mt-1 text-sm text-[#68737E]">Facility Management Integral</p></div><span className="rounded-full bg-[#FFF2D9] px-4 py-2 text-sm font-black text-[#9C6400]">Prospecto</span></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Kpi label="Responsable" value="Camila Torres" /><Kpi label="Valor estimado" value="UF 720" /><Kpi label="Probabilidad" value="15%" /></div></div></Panel>;
}

function FollowupVisual() {
  const events = ["Reunión comercial realizada", "Propuesta actualizada", "Llamada de seguimiento"];
  return <Panel className="grid place-items-center p-4 sm:p-6"><div className="w-full max-w-4xl space-y-3">{events.map((event, i) => <div key={event} className="flex items-center gap-4 rounded-2xl bg-white p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00D7CC]/15 text-[#00AFA5]"><CheckCircle2 className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate font-black">{event}</p><p className="mt-1 text-sm text-[#68737E]">{i === 0 ? "Hoy · 09:40" : i === 1 ? "Ayer · 16:15" : "19 jul · 11:20"}</p></div></div>)}</div></Panel>;
}

function ProposalVisual() {
  return <Panel className="grid place-items-center p-4 sm:p-6"><div className="w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-7"><MailCheck className="h-10 w-10 text-[#00AFA5]" /><h4 className="mt-4 text-2xl font-black">Propuesta enviada</h4><p className="mt-2 text-sm text-[#68737E]">Versión 3 · PDF · registrada en el historial</p><div className="mt-5 truncate rounded-xl border border-[#DDE4E8] bg-[#F8FAFB] px-4 py-3 text-sm font-semibold">Propuesta_Grupo_Horizonte_v3.pdf</div></div></Panel>;
}

function NegotiationVisual() {
  return <Panel className="grid place-items-center p-4 sm:p-6"><div className="w-full max-w-4xl rounded-2xl bg-white p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">Negociación</p><h4 className="mt-2 text-2xl font-black sm:text-3xl">Grupo Horizonte</h4></div><span className="rounded-full bg-[#FFF2D9] px-4 py-2 text-sm font-black text-[#9C6400]">70% probabilidad</span></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Kpi label="Valor" value="UF 720" /><Kpi label="Fecha cierre" value="30/09/26" /><Kpi label="Próximo paso" value="Reunión final" /></div></div></Panel>;
}

function CloseVisual() {
  return <Panel className="grid place-items-center p-4 sm:p-6"><div className="w-full max-w-3xl rounded-2xl bg-white p-6 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F9F7] text-[#00AFA5]"><Trophy className="h-7 w-7" /></span><p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">Cierre ganado</p><h4 className="mt-2 text-3xl font-black">Negocio adjudicado</h4><p className="mt-3 text-4xl font-black">UF 720</p><p className="mt-2 text-sm text-[#68737E]">Razón, responsables y próximos pasos quedan registrados.</p></div></Panel>;
}

function SalesDashboard() {
  return <Panel className="grid gap-4 p-4 sm:grid-cols-[0.9fr_1.1fr] sm:p-5"><div className="flex min-w-0 flex-col justify-between rounded-2xl bg-white p-4 sm:p-5"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#008F87]">Pipeline estimado</p><p className="mt-2 truncate text-[clamp(2rem,5vw,4rem)] font-black leading-none tracking-[-0.055em]">UF 4.250</p><p className="mt-3 font-black text-[#008F87]">Win rate 38%</p></div><div className="mt-5 grid grid-cols-2 gap-3"><Kpi label="Oportunidades" value="56" /><Kpi label="Ganadas" value="12" /></div></div><div className="flex min-h-[180px] items-end gap-3 rounded-2xl bg-white p-5"><Bar height="42%" /><Bar height="58%" /><Bar height="50%" /><Bar height="75%" /><Bar height="62%" /><Bar height="90%" /></div></Panel>;
}

function Bar({ height }: { height: string }) {
  return <div className="flex h-full flex-1 items-end rounded-lg bg-[#EAF3F3]"><div className="w-full rounded-lg bg-[#00BEB3]" style={{ height }} /></div>;
}
