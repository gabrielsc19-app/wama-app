"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ExpenseRole, expenseRoles } from "@/src/lib/expenseRoles";
import {
  AlertTriangle, ArrowLeft, Bell, Camera, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, FileText, Home, LayoutDashboard, Menu, Plus,
  ReceiptText, Search, Settings, ShieldCheck, Upload, UserRound, WalletCards, X
} from "lucide-react";

type View = "dashboard" | "new" | "mine" | "money" | "approvals" | "finance";
type Status = "Pendiente" | "En revisión" | "Aprobada" | "Observada" | "Rechazada" | "Pagada";
type Expense = {
  id: string; person: string; merchant: string; category: string; costCenter: string;
  amount: number; detectedAmount: number; status: Status; date: string; reason: string;
  fileName: string; createdAt: string; audit: string[];
};

const seed: Expense[] = [
  { id:"RG-000184", person:"Camila Soto", merchant:"COPEC", category:"Combustible", costCenter:"Operaciones", amount:48250, detectedAmount:48250, status:"En revisión", date:"27 Jul", reason:"Visita operacional", fileName:"boleta-copec.jpg", createdAt:"2026-07-27T12:15:00", audit:["Documento cargado", "OCR completado", "Enviada a aprobación"] },
  { id:"RG-000183", person:"Martín Rojas", merchant:"Hotel Plaza", category:"Alojamiento", costCenter:"Comercial", amount:189900, detectedAmount:189900, status:"Aprobada", date:"26 Jul", reason:"Reunión con cliente", fileName:"factura-hotel.pdf", createdAt:"2026-07-26T09:20:00", audit:["Documento cargado", "Aprobada por jefatura"] },
  { id:"RG-000182", person:"Sofía Muñoz", merchant:"Cabify", category:"Movilización", costCenter:"Administración", amount:14320, detectedAmount:14320, status:"Observada", date:"26 Jul", reason:"Traslado a reunión", fileName:"cabify.png", createdAt:"2026-07-26T08:10:00", audit:["Documento cargado", "Finanzas solicitó aclaración"] },
  { id:"RG-000181", person:"Diego Pérez", merchant:"Lider", category:"Insumos", costCenter:"Operaciones", amount:58250, detectedAmount:48250, status:"En revisión", date:"25 Jul", reason:"Materiales de operación", fileName:"boleta-lider.jpg", createdAt:"2026-07-25T18:42:00", audit:["OCR detectó $48.250", "Usuario declaró $58.250", "Alerta generada"] },
];

const nav: Array<{ id:View; label:string; icon:typeof Home; mobile?:boolean; roles:ExpenseRole[] }> = [
  { id:"dashboard", label:"Inicio", icon:LayoutDashboard, mobile:true, roles:["manager","admin","finance","supervisor"] },
  { id:"new", label:"Rendir", icon:Camera, mobile:true, roles:["collaborator","admin"] },
  { id:"mine", label:"Mis rendiciones", icon:ReceiptText, mobile:true, roles:["collaborator","admin"] },
  { id:"money", label:"Mi dinero", icon:WalletCards, mobile:true, roles:["collaborator","admin"] },
  { id:"approvals", label:"Aprobaciones", icon:CheckCircle2, mobile:true, roles:["supervisor","admin"] },
  { id:"finance", label:"Finanzas", icon:ShieldCheck, mobile:true, roles:["finance","admin"] },
];

const money = (value:number) => `$${value.toLocaleString("es-CL")}`;
const todayLabel = () => new Intl.DateTimeFormat("es-CL", { day:"2-digit", month:"short" }).format(new Date()).replace(".", "");

export default function ExpenseHubDemo() {
  const [role, setRole] = useState<ExpenseRole | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>(seed);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("wama-expenses-v1");
    if (saved) try { setExpenses(JSON.parse(saved)); } catch { setExpenses(seed); }
    const savedRole = localStorage.getItem("wama-expense-role") as ExpenseRole | null;
    if (savedRole && expenseRoles[savedRole]) {
      setRole(savedRole);
      setView(expenseRoles[savedRole].defaultView);
    }
  }, []);
  useEffect(() => { localStorage.setItem("wama-expenses-v1", JSON.stringify(expenses)); }, [expenses]);

  const allowedNav = role ? nav.filter(item => item.roles.includes(role)) : [];
  const active = nav.find(n => n.id === view)?.label ?? "Inicio";
  const selectRole = (nextRole: ExpenseRole) => {
    localStorage.setItem("wama-expense-role", nextRole);
    setRole(nextRole);
    setView(expenseRoles[nextRole].defaultView);
  };
  const go = (next:View) => { setView(next); setMenuOpen(false); setSelected(null); };
  const flash = (text:string) => { setNotice(text); window.setTimeout(() => setNotice(""), 2600); };
  const addExpense = (expense:Expense) => { setExpenses(prev => [expense, ...prev]); go("mine"); flash("Rendición enviada correctamente"); };
  const updateExpense = (id:string, status:Status, audit:string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status, audit:[...e.audit, audit] } : e));
    setSelected(prev => prev?.id === id ? { ...prev, status, audit:[...prev.audit, audit] } : prev);
    flash(`Rendición ${status.toLowerCase()}`);
  };

  return <div className="expense-hub-root min-h-screen bg-[#F3F5F6] text-[#0B0C0E] pb-24 lg:pb-0">
    {!role && <RoleSelector onSelect={selectRole}/>} 
    <aside className={`fixed inset-y-0 left-0 z-50 w-[286px] border-r border-white/10 bg-[#0B0C0E] text-white transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6"><Link href="/app" className="text-2xl font-black tracking-[-.06em]">WAMA<span className="text-[#00E5D6]">.</span></Link><button onClick={()=>setMenuOpen(false)} className="lg:hidden"><X/></button></div>
        <div className="px-5 py-6"><div className="rounded-2xl border border-[#00E5D6]/15 bg-[#00E5D6]/[.08] p-4"><p className="text-[11px] font-black uppercase tracking-[.18em] text-[#00E5D6]">Expense Hub</p><p className="mt-2 text-sm font-black">Empresa Demo SpA</p><p className="mt-1 text-xs text-[#9EA6B0]">{role ? expenseRoles[role].label : "Selecciona tu rol"}</p></div></div>
        <nav className="flex-1 space-y-1 px-4">{allowedNav.map(({id,label,icon:Icon}) => <button key={id} onClick={()=>go(id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${view===id ? "bg-[#00E5D6] text-[#0B0C0E]" : "text-[#BFC5CC] hover:bg-white/[.06] hover:text-white"}`}><Icon className="h-5 w-5"/>{label}</button>)}</nav>
        <div className="border-t border-white/10 p-4"><button onClick={()=>setRole(null)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-[#BFC5CC]"><UserRound className="h-5 w-5"/>Cambiar rol</button><div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#BFC5CC]"><Settings className="h-5 w-5"/>Configuración</div></div>
      </div>
    </aside>
    {menuOpen && <button onClick={()=>setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/45 lg:hidden"/>}

    <div className="lg:pl-[286px]">
      <header className="expense-hub-header sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#DDE1E6] bg-white/95 px-5 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3"><button onClick={()=>setMenuOpen(true)} className="rounded-xl border border-[#DDE1E6] p-2 lg:hidden"><Menu className="h-5 w-5"/></button><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Expense Hub</p><h1 className="text-xl font-black tracking-[-.035em]">{active}</h1></div></div>
        <div className="flex items-center gap-3"><button className="relative rounded-full border border-[#DDE1E6] bg-white p-3"><Bell className="h-5 w-5"/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF9E45]"/></button><button onClick={()=>setRole(null)} className="hidden items-center gap-3 sm:flex"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#0B0C0E] text-sm font-black text-white">GS</div><div className="text-left"><p className="text-sm font-black">Gabriel Sánchez</p><p className="text-xs text-[#737C87]">{role ? expenseRoles[role].label : "Sin rol"}</p></div></button></div>
      </header>
      {notice && <div className="fixed right-5 top-24 z-[70] flex items-center gap-2 rounded-2xl bg-[#0B0C0E] px-5 py-4 text-sm font-black text-white shadow-2xl"><Check className="h-4 w-4 text-[#00E5D6]"/>{notice}</div>}
      <main className="p-5 sm:p-8 lg:p-10">
        {view==="dashboard" && <Dashboard expenses={expenses} onNew={()=>go("new")} onOpen={setSelected}/>} 
        {view==="new" && <NewExpense onSubmit={addExpense}/>} 
        {view==="mine" && <ExpenseList expenses={expenses} title="Mis rendiciones" subtitle="Sigue el estado de cada gasto y responde observaciones." onOpen={setSelected}/>} 
        {view==="money" && <MyMoney expenses={expenses}/>} 
        {view==="approvals" && <ExpenseList expenses={expenses.filter(e=>["Pendiente","En revisión","Observada"].includes(e.status))} title="Pendientes de aprobación" subtitle="Revisa las rendiciones del equipo antes de enviarlas a Finanzas." approvals onOpen={setSelected}/>} 
        {view==="finance" && <FinanceReview expenses={expenses} onOpen={setSelected}/>} 
      </main>
    </div>

    {allowedNav.length > 0 && <nav className={`expense-hub-mobile-nav fixed inset-x-3 bottom-3 z-40 grid rounded-2xl border border-[#DDE1E6] bg-white/95 p-2 shadow-2xl backdrop-blur lg:hidden ${allowedNav.length===1?"grid-cols-1":allowedNav.length===2?"grid-cols-2":allowedNav.length===3?"grid-cols-3":"grid-cols-4"}`}>{allowedNav.slice(0,4).map(({id,label,icon:Icon})=><button key={id} onClick={()=>go(id)} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black ${view===id?"bg-[#0B0C0E] text-white":"text-[#68717C]"}`}><Icon className="h-5 w-5"/>{label}</button>)}</nav>}
    {selected && <ExpenseDrawer expense={selected} onClose={()=>setSelected(null)} onUpdate={updateExpense}/>} 
  </div>;
}

function RoleSelector({onSelect}:{onSelect:(role:ExpenseRole)=>void}) {
  const options: Array<{role:ExpenseRole; icon:typeof UserRound}> = [
    {role:"collaborator", icon:UserRound},
    {role:"supervisor", icon:CheckCircle2},
    {role:"finance", icon:ShieldCheck},
    {role:"manager", icon:LayoutDashboard},
    {role:"admin", icon:Settings},
  ];
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0B0C0E]/95 p-5 backdrop-blur-xl sm:p-8">
    <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center py-10">
      <div className="w-full rounded-[2rem] bg-white p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">Configuración de acceso</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-5xl">¿Cuál es tu rol en Expense Hub?</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#68717C]">WAMA adapta el menú y las acciones para que cada persona vea solo lo que necesita.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{options.map(({role,icon:Icon})=>{
          const item=expenseRoles[role];
          return <button key={role} onClick={()=>onSelect(role)} className="group rounded-2xl border border-[#DDE1E6] p-5 text-left transition hover:border-[#00B8AD] hover:bg-[#F4FFFE]">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#DFFBF8] text-[#008F87]"><Icon className="h-5 w-5"/></div>
            <p className="mt-4 text-lg font-black">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-[#68717C]">{item.description}</p>
          </button>;
        })}</div>
      </div>
    </div>
  </div>;
}

function Dashboard({expenses,onNew,onOpen}:{expenses:Expense[];onNew:()=>void;onOpen:(e:Expense)=>void}) {
  const total=expenses.reduce((s,e)=>s+e.amount,0), pending=expenses.filter(e=>["Pendiente","En revisión","Observada"].includes(e.status)), alerts=expenses.filter(e=>e.amount!==e.detectedAmount);
  return <>
    <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><div><p className="text-sm font-black uppercase tracking-[.18em] text-[#008F87]">Resumen general</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">Control claro. Menos trabajo manual.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-[#69717D]">Captura, aprueba y controla gastos desde teléfono, tablet o computador.</p></div><button onClick={onNew} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0C0E] px-7 py-4 text-sm font-black text-white"><Camera className="h-4 w-4"/>Rendir un gasto</button></section>
    <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi icon={CircleDollarSign} label="Gasto registrado" value={money(total)} helper={`${expenses.length} rendiciones`}/><Kpi icon={Clock3} label="Pendiente" value={money(pending.reduce((s,e)=>s+e.amount,0))} helper={`${pending.length} por revisar`}/><Kpi icon={CheckCircle2} label="Aprobado / pagado" value={money(expenses.filter(e=>["Aprobada","Pagada"].includes(e.status)).reduce((s,e)=>s+e.amount,0))} helper="Flujo actualizado"/><Kpi icon={AlertTriangle} label="Alertas" value={String(alerts.length)} helper="Diferencias OCR" warning/></section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><div className="rounded-[1.75rem] border border-[#DDE1E6] bg-white p-6 sm:p-8"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Actividad reciente</p><h3 className="mt-2 text-2xl font-black">Últimas rendiciones</h3></div><div className="mt-6 divide-y divide-[#E6E9EC]">{expenses.slice(0,5).map(e=><button key={e.id} onClick={()=>onOpen(e)} className="block w-full text-left"><ExpenseRow expense={e}/></button>)}</div></div><div className="rounded-[1.75rem] bg-[#0B0C0E] p-6 text-white sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#00E5D6]">WAMA analiza</p><h3 className="mt-2 text-2xl font-black">Alertas inteligentes</h3></div><ShieldCheck className="h-7 w-7 text-[#00E5D6]"/></div><div className="mt-7 space-y-4"><Insight title="Diferencias de monto" text={`${alerts.length} rendiciones requieren validación entre OCR y monto declarado.`}/><Insight title="Pendientes" text={`${pending.length} rendiciones esperan una acción.`}/><Insight title="Evidencia protegida" text="Los documentos originales se conservan junto al historial de cambios."/></div></div></section>
  </>;
}

function NewExpense({onSubmit}:{onSubmit:(e:Expense)=>void}) {
  const [step,setStep]=useState(1);
  const [fileName,setFileName]=useState("");
  const [preview,setPreview]=useState("");
  const [file,setFile]=useState<File|null>(null);
  const [processing,setProcessing]=useState(false);
  const [processLabel,setProcessLabel]=useState("");
  const [ocrError,setOcrError]=useState("");
  const [quotaError,setQuotaError]=useState(false);
  const [confidence,setConfidence]=useState<number|null>(null);
  const [warnings,setWarnings]=useState<string[]>([]);
  const [form,setForm]=useState({merchant:"",rut:"",date:new Date().toISOString().slice(0,10),folio:"",category:"Otros",costCenter:"Operaciones",detected:"",declared:"",reason:""});
  const difference=Number(form.declared||0)-Number(form.detected||0);

  const prepareImage=async(selected:File):Promise<File>=>{
    if(!selected.type.startsWith("image/") || selected.size < 1_500_000) return selected;
    const bitmap=await createImageBitmap(selected);
    const max=1600;
    const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext("2d");
    if(!ctx) return selected;
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",0.86));
    return blob?new File([blob],selected.name.replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg"}):selected;
  };

  const applyOcr=(data:any)=>{
    const total=data.totalAmount==null?"":String(Math.round(data.totalAmount));
    setForm(v=>({
      ...v,
      merchant:data.merchant||"",
      rut:data.rut||"",
      date:data.date||v.date,
      folio:data.folio||"",
      category:data.suggestedCategory||"Otros",
      costCenter:data.suggestedCostCenter||"Operaciones",
      detected:total,
      declared:total,
      reason:data.merchant?`Gasto en ${data.merchant}`:"",
    }));
    setConfidence(Number(data.confidence||0));
    setWarnings(Array.isArray(data.warnings)?data.warnings:[]);
    setStep(2);
  };

  const analyzeFile=async(selected:File)=>{
    setProcessing(true);setOcrError("");setQuotaError(false);setWarnings([]);
    try{
      setProcessLabel("Preparando documento…");
      const optimized=await prepareImage(selected);
      setFile(optimized);
      setProcessLabel("WAMA está leyendo el documento…");
      const body=new FormData(); body.append("file",optimized);
      const response=await fetch("/api/expense/ocr",{method:"POST",body});
      setProcessLabel("Extrayendo comercio, fecha y monto…");
      const payload=await response.json();
      if(!response.ok){
        const err=new Error(payload.error||"No fue posible leer el documento.") as Error & {code?:string};
        err.code=payload.code;
        throw err;
      }
      applyOcr(payload.data);
    }catch(error){
      const code=(error as Error & {code?:string})?.code;
      setQuotaError(code==="quota_exceeded");
      setOcrError(error instanceof Error?error.message:"Error inesperado de OCR.");
    } finally {
      setProcessing(false);setProcessLabel("");
    }
  };

  const readFile=async(ev:ChangeEvent<HTMLInputElement>)=>{
    const selected=ev.target.files?.[0];
    if(!selected)return;
    setFile(selected);setFileName(selected.name);setOcrError("");setQuotaError(false);setConfidence(null);setWarnings([]);
    if(selected.type.startsWith("image/")){
      const reader=new FileReader();
      reader.onload=()=>setPreview(String(reader.result));
      reader.readAsDataURL(selected);
    } else setPreview("");
    await analyzeFile(selected);
  };

  const retry=()=>{ if(file) void analyzeFile(file); };
  const submit=()=>{
    const next=Math.max(...seed.map(e=>Number(e.id.split("-")[1])),...[]) + Math.floor(Math.random()*900)+1;
    onSubmit({id:`RG-${String(next).padStart(6,"0")}`,person:"Gabriel Sánchez",merchant:form.merchant||"Sin comercio",category:form.category,costCenter:form.costCenter,amount:Number(form.declared||0),detectedAmount:Number(form.detected||0),status:difference===0?"Pendiente":"En revisión",date:todayLabel(),reason:form.reason,fileName:fileName||"documento.jpg",createdAt:new Date().toISOString(),audit:["Documento original cargado",`OCR ejecutado${confidence!==null?` · confianza ${confidence}%`:""}`,...(difference!==0?[`Monto editado: diferencia ${money(Math.abs(difference))}`]:[]),"Rendición enviada"]});
  };

  return <div className="mx-auto max-w-5xl pb-10"><p className="text-sm font-black uppercase tracking-[.18em] text-[#008F87]">Nueva rendición</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">Saca la foto. WAMA hace el resto.</h2><p className="mt-4 text-[#69717D]">La lectura comienza automáticamente. Solo revisa los datos y envía.</p>
    <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#DDE1E6] bg-white p-2">{["Documento","Confirmación","Enviar"].map((label,index)=><div key={label} className={`rounded-xl px-2 py-3 text-center text-xs font-black sm:text-sm ${step===index+1?"bg-[#0B0C0E] text-white":step>index+1?"bg-[#DFFBF8] text-[#008F87]":"text-[#8A939E]"}`}>{index+1}. {label}</div>)}</div>
    <div className="mt-5 rounded-[2rem] border border-[#DDE1E6] bg-white p-5 sm:p-8">
      {step===1&&<div><div className="flex items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#DFFBF8] text-[#008F87]"><Camera className="h-7 w-7"/></div><div><h3 className="text-2xl font-black">Fotografía el documento</h3><p className="mt-1 text-sm text-[#69717D]">Boleta, factura o comprobante. JPG, PNG, WEBP o PDF.</p></div></div>
        <label className="mt-5 flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-[#AEB6C0] bg-[#F8F9FA] p-4 text-left">{preview?<img src={preview} alt="Vista previa" className="h-28 w-24 shrink-0 rounded-xl object-cover"/>:<div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-white text-[#008F87]"><Upload className="h-8 w-8"/></div>}<div className="min-w-0"><p className="truncate font-black">{fileName||"Tomar foto o seleccionar archivo"}</p><p className="mt-1 text-sm text-[#69717D]">El análisis comienza automáticamente.</p></div><input className="hidden" type="file" accept="image/*,.pdf" capture="environment" onChange={readFile}/></label>
        {processing&&<div className="mt-5 rounded-2xl bg-[#0B0C0E] p-5 text-white"><div className="flex items-center gap-3"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-[#00E5D6]"/><div><p className="font-black">{processLabel||"Analizando documento…"}</p><p className="mt-1 text-xs text-[#B9C0C7]">No cierres WAMA. Esto puede tardar algunos segundos.</p></div></div></div>}
        {ocrError&&!processing&&<div className={`mt-5 rounded-2xl border p-5 ${quotaError?"border-[#F0BF68] bg-[#FFF8E9]":"border-[#F2B5B5] bg-[#FFF1F1]"}`}><div className="flex gap-3"><AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${quotaError?"text-[#A56500]":"text-[#A33030]"}`}/><div><p className="font-black">{quotaError?"OCR temporalmente sin saldo":"No pudimos leer el documento"}</p><p className="mt-2 text-sm leading-6 text-[#5F6670]">{ocrError}</p>{quotaError&&<p className="mt-2 text-xs leading-5 text-[#7A6135]">Activa saldo en la cuenta API de OpenAI y vuelve a intentar. La fotografía permanece cargada.</p>}<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={retry} className="rounded-full bg-[#0B0C0E] px-5 py-3 text-sm font-black text-white">Reintentar OCR</button><button type="button" onClick={()=>setStep(2)} className="rounded-full border border-[#C8CED5] px-5 py-3 text-sm font-black">Continuar manualmente</button></div></div></div></div>}
      </div>}
      {step===2&&<div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#008F87]">Datos detectados</p><h3 className="mt-2 text-3xl font-black">Revisa y confirma</h3>{confidence!==null&&<p className="mt-2 text-sm text-[#69717D]">Confianza de lectura: <strong>{confidence}%</strong></p>}</div>{confidence!==null&&<span className={`w-fit rounded-full px-4 py-2 text-xs font-black ${confidence>=80?"bg-[#E4F9EA] text-[#217A39]":"bg-[#FFF2DF] text-[#9A6200]"}`}>{confidence>=80?"Lectura confiable":"Revisar campos"}</span>}</div>
        {warnings.length>0&&<div className="mt-5 rounded-xl border border-[#F0BF68] bg-[#FFF8E9] p-4 text-sm text-[#7A6135]">{warnings.map((w,i)=><p key={i}>• {w}</p>)}</div>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Comercio" value={form.merchant} onChange={v=>setForm({...form,merchant:v})}/><Input label="RUT" value={form.rut} onChange={v=>setForm({...form,rut:v})}/><Input label="Fecha" type="date" value={form.date} onChange={v=>setForm({...form,date:v})}/><Input label="Folio" value={form.folio} onChange={v=>setForm({...form,folio:v})}/><Select label="Categoría" value={form.category} options={["Combustible","Movilización","Alimentación","Alojamiento","Insumos","Servicios","Otros"]} onChange={v=>setForm({...form,category:v})}/><Select label="Centro de costo" value={form.costCenter} options={["Operaciones","Comercial","Administración","TI","Proyecto"]} onChange={v=>setForm({...form,costCenter:v})}/><Input label="Monto OCR" value={form.detected} disabled onChange={()=>{}}/><Input label="Monto declarado" value={form.declared} type="number" onChange={v=>setForm({...form,declared:v})}/></div><label className="mt-4 block"><span className="text-xs font-black uppercase tracking-[.12em] text-[#69717D]">Motivo</span><textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} className="mt-2 min-h-28 w-full rounded-xl border border-[#D5DAE0] p-4 outline-none focus:border-[#00B8AD]"/></label>
        <div className="sticky bottom-[92px] z-20 -mx-2 mt-6 rounded-2xl border border-[#DDE1E6] bg-white/95 p-3 shadow-xl backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"><div className="flex gap-3"><button onClick={()=>setStep(1)} className="rounded-full border border-[#D5DAE0] px-5 py-3 font-black">Volver</button><button onClick={()=>setStep(3)} disabled={!form.merchant||!form.declared} className="flex-1 rounded-full bg-[#0B0C0E] px-6 py-4 font-black text-white disabled:opacity-40">Continuar</button></div></div>
      </div>}
      {step===3&&<div><p className="text-xs font-black uppercase tracking-[.14em] text-[#008F87]">Confirmación final</p><h3 className="mt-2 text-3xl font-black">Listo para enviar</h3><div className="mt-6 divide-y divide-[#E1E5E8] rounded-2xl border border-[#E1E5E8]"><Summary label="Comercio" value={form.merchant}/><Summary label="Monto" value={money(Number(form.declared||0))}/><Summary label="Categoría" value={form.category}/><Summary label="Centro de costo" value={form.costCenter}/>{difference!==0&&<Summary label="Diferencia OCR" value={money(Math.abs(difference))}/>}</div><div className="sticky bottom-[92px] z-20 -mx-2 mt-6 rounded-2xl border border-[#DDE1E6] bg-white/95 p-3 shadow-xl backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"><div className="flex gap-3"><button onClick={()=>setStep(2)} className="rounded-full border border-[#D5DAE0] px-5 py-3 font-black">Volver</button><button onClick={submit} className="flex-1 rounded-full bg-[#00B8AD] px-6 py-4 font-black text-white">Enviar rendición</button></div></div></div>}
    </div>
  </div>;
}

function ExpenseList({expenses,title,subtitle,approvals=false,onOpen}:{expenses:Expense[];title:string;subtitle:string;approvals?:boolean;onOpen:(e:Expense)=>void}) {
  const [query,setQuery]=useState("");
  const filtered=expenses.filter(e=>`${e.id} ${e.merchant} ${e.person} ${e.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-sm font-black uppercase tracking-[.18em] text-[#008F87]">Seguimiento</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">{title}</h2><p className="mt-4 text-[#69717D]">{subtitle}</p></div><div className="flex items-center gap-2 rounded-full border border-[#D5DAE0] bg-white px-4 py-3"><Search className="h-4 w-4 text-[#7B8490]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar rendición" className="w-44 bg-transparent text-sm outline-none"/></div></div><div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#DDE1E6] bg-white"><div className="hidden grid-cols-[1fr_1.1fr_1fr_.8fr_.85fr_auto] gap-4 border-b border-[#E4E7EA] bg-[#F7F8F9] px-6 py-4 text-xs font-black uppercase tracking-[.1em] text-[#707985] md:grid"><span>Rendición</span><span>{approvals?"Colaborador":"Comercio"}</span><span>Categoría</span><span>Monto</span><span>Estado</span><span/></div><div className="divide-y divide-[#E4E7EA]">{filtered.length?filtered.map(e=><button key={e.id} onClick={()=>onOpen(e)} className="grid w-full gap-4 px-6 py-5 text-left hover:bg-[#F9FAFA] md:grid-cols-[1fr_1.1fr_1fr_.8fr_.85fr_auto] md:items-center"><div><p className="text-sm font-black">{e.id}</p><p className="mt-1 text-xs text-[#7B8490]">{e.date}</p></div><p className="text-sm font-bold">{approvals?e.person:e.merchant}</p><p className="text-sm text-[#626B77]">{e.category}</p><p className="text-sm font-black">{money(e.amount)}</p><Status status={e.status} alert={e.amount!==e.detectedAmount}/><span className="inline-flex items-center justify-end gap-1 text-sm font-black text-[#008F87]">Revisar <ChevronRight className="h-4 w-4"/></span></button>):<div className="p-12 text-center text-sm text-[#69717D]">No se encontraron rendiciones.</div>}</div></div></div>;
}

function MyMoney({expenses}:{expenses:Expense[]}) { const advance=500000, spent=expenses.filter(e=>!["Rechazada"].includes(e.status)).reduce((s,e)=>s+e.amount,0), remaining=Math.max(advance-spent,0); return <div><p className="text-sm font-black uppercase tracking-[.18em] text-[#008F87]">Anticipos y saldos</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">Mi dinero</h2><p className="mt-4 text-[#69717D]">Controla lo recibido, rendido y pendiente.</p><div className="mt-8 grid gap-4 md:grid-cols-3"><Kpi icon={WalletCards} label="Anticipo recibido" value={money(advance)} helper="Asignado este mes"/><Kpi icon={ReceiptText} label="Rendido" value={money(spent)} helper={`${expenses.length} documentos`}/><Kpi icon={CircleDollarSign} label="Disponible" value={money(remaining)} helper="Saldo por utilizar"/></div><div className="mt-6 rounded-[1.75rem] border border-[#DDE1E6] bg-white p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Anticipo vigente</p><h3 className="mt-2 text-2xl font-black">Gastos operacionales julio</h3></div><Status status="En revisión" alert={false}/></div><div className="mt-8 h-3 overflow-hidden rounded-full bg-[#E8ECEF]"><div className="h-full rounded-full bg-[#00B8AD]" style={{width:`${Math.min(spent/advance*100,100)}%`}}/></div><div className="mt-3 flex justify-between text-xs font-bold text-[#69717D]"><span>{money(spent)} rendido</span><span>{money(advance)} total</span></div></div></div> }

function FinanceReview({expenses,onOpen}:{expenses:Expense[];onOpen:(e:Expense)=>void}) { const flagged=expenses.filter(e=>e.amount!==e.detectedAmount); return <div><p className="text-sm font-black uppercase tracking-[.18em] text-[#008F87]">Control financiero</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">Revisión de diferencias</h2><p className="mt-4 max-w-2xl text-[#69717D]">Compara evidencia, OCR y declaración antes de aprobar.</p><div className="mt-8 grid gap-5">{flagged.length?flagged.map(e=><button key={e.id} onClick={()=>onOpen(e)} className="grid gap-4 rounded-[1.5rem] border border-[#F4C16D] bg-white p-6 text-left md:grid-cols-[1fr_1fr_1fr_auto] md:items-center"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#A06400]">Diferencia detectada</p><p className="mt-1 text-xl font-black">{e.id} · {e.merchant}</p></div><div><p className="text-xs text-[#69717D]">OCR</p><p className="font-black">{money(e.detectedAmount)}</p></div><div><p className="text-xs text-[#69717D]">Declarado</p><p className="font-black text-[#A46100]">{money(e.amount)}</p></div><span className="inline-flex items-center gap-1 text-sm font-black text-[#008F87]">Revisar <ChevronRight className="h-4 w-4"/></span></button>):<div className="rounded-2xl border border-[#DDE1E6] bg-white p-10 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-[#00B8AD]"/><p className="mt-4 font-black">No existen diferencias pendientes</p></div>}</div></div> }

function ExpenseDrawer({expense,onClose,onUpdate}:{expense:Expense;onClose:()=>void;onUpdate:(id:string,status:Status,audit:string)=>void}) { return <div className="fixed inset-0 z-[80] bg-black/45" onClick={onClose}><aside onClick={e=>e.stopPropagation()} className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Detalle de rendición</p><h3 className="mt-2 text-3xl font-black">{expense.id}</h3></div><button onClick={onClose} className="rounded-full border border-[#DDE1E6] p-2"><X/></button></div><div className="mt-6 rounded-2xl border border-[#DDE1E6] bg-[#F7F8F9] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-2xl font-black">{expense.merchant}</p><p className="mt-1 text-sm text-[#69717D]">{expense.person} · {expense.category}</p></div><Status status={expense.status} alert={expense.amount!==expense.detectedAmount}/></div><p className="mt-5 text-4xl font-black tracking-[-.05em]">{money(expense.amount)}</p></div><div className="mt-6 grid grid-cols-2 gap-3"><Info label="Centro de costo" value={expense.costCenter}/><Info label="Fecha" value={expense.date}/><Info label="Documento" value={expense.fileName}/><Info label="Motivo" value={expense.reason}/></div>{expense.amount!==expense.detectedAmount&&<div className="mt-6 rounded-2xl border border-[#F4C16D] bg-[#FFF8EA] p-5"><p className="font-black text-[#9A6200]">Diferencia: {money(Math.abs(expense.amount-expense.detectedAmount))}</p><p className="mt-2 text-sm text-[#7A6135]">OCR: {money(expense.detectedAmount)} · Declarado: {money(expense.amount)}</p></div>}<div className="mt-7"><p className="text-sm font-black">Auditoría</p><div className="mt-3 space-y-3">{expense.audit.map((a,i)=><div key={`${a}-${i}`} className="flex gap-3 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00B8AD]"/><span>{a}</span></div>)}</div></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><button onClick={()=>onUpdate(expense.id,"Observada","Corrección solicitada por supervisor")} className="rounded-full border border-[#D5DAE0] px-4 py-3 text-sm font-black">Corregir</button><button onClick={()=>onUpdate(expense.id,"Rechazada","Rendición rechazada")} className="rounded-full border border-[#D5DAE0] px-4 py-3 text-sm font-black">Rechazar</button><button onClick={()=>onUpdate(expense.id,"Aprobada","Rendición aprobada")} className="rounded-full bg-[#0B0C0E] px-4 py-3 text-sm font-black text-white">Aprobar</button></div>{expense.status==="Aprobada"&&<button onClick={()=>onUpdate(expense.id,"Pagada","Pago registrado por Finanzas")} className="mt-3 w-full rounded-full bg-[#00B8AD] px-4 py-3 text-sm font-black text-white">Marcar como pagada</button>}</aside></div> }

function Kpi({icon:Icon,label,value,helper,warning=false}:{icon:typeof Clock3;label:string;value:string;helper:string;warning?:boolean}) { return <div className="rounded-[1.5rem] border border-[#DDE1E6] bg-white p-6"><div className={`grid h-11 w-11 place-items-center rounded-full ${warning?"bg-[#FFF2DF] text-[#B36A00]":"bg-[#DFFBF8] text-[#008F87]"}`}><Icon className="h-5 w-5"/></div><p className="mt-5 text-sm font-bold text-[#69717D]">{label}</p><p className="mt-2 text-3xl font-black tracking-[-.04em]">{value}</p><p className={`mt-2 text-xs font-bold ${warning?"text-[#B36A00]":"text-[#008F87]"}`}>{helper}</p></div> }
function Insight({title,text}:{title:string;text:string}) { return <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs leading-5 text-[#AFB6BE]">{text}</p></div> }
function ExpenseRow({expense}:{expense:Expense}) { return <div className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${expense.amount!==expense.detectedAmount?"bg-[#FFF2DF] text-[#B36A00]":"bg-[#DFFBF8] text-[#008F87]"}`}>{expense.amount!==expense.detectedAmount?<AlertTriangle className="h-5 w-5"/>:<ReceiptText className="h-5 w-5"/>}</div><div className="min-w-0"><p className="truncate text-sm font-black">{expense.merchant}</p><p className="mt-1 truncate text-xs text-[#7B8490]">{expense.person} · {expense.category}</p></div></div><div className="text-right"><p className="text-sm font-black">{money(expense.amount)}</p><p className="mt-1 text-xs text-[#7B8490]">{expense.status}</p></div></div> }
function Status({status,alert}:{status:Status;alert:boolean}) { const cls=alert?"bg-[#FFF2DF] text-[#A46100]":status==="Aprobada"||status==="Pagada"?"bg-[#E4F9EA] text-[#217A39]":status==="Rechazada"?"bg-[#FDE8E8] text-[#A33030]":"bg-[#E8F8F6] text-[#087A73]"; return <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${cls}`}>{status}</span> }
function Input({label,value,onChange,disabled=false,type="text"}:{label:string;value:string;onChange:(v:string)=>void;disabled?:boolean;type?:string}) { return <label><span className="text-xs font-black uppercase tracking-[.12em] text-[#69717D]">{label}</span><input type={type} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)} className={`mt-2 w-full rounded-xl border border-[#D5DAE0] px-4 py-3 text-sm font-bold outline-none focus:border-[#00B8AD] ${disabled?"bg-[#F3F5F6] text-[#7A838E]":"bg-white"}`}/></label> }
function Select({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}) { return <label><span className="text-xs font-black uppercase tracking-[.12em] text-[#69717D]">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-[#D5DAE0] bg-white px-4 py-3 text-sm font-bold outline-none">{options.map(o=><option key={o}>{o}</option>)}</select></label> }
function Summary({label,value}:{label:string;value:string}) { return <div className="flex items-center justify-between gap-5 px-5 py-4"><span className="text-sm text-[#69717D]">{label}</span><span className="text-right text-sm font-black">{value}</span></div> }
function Info({label,value}:{label:string;value:string}) { return <div className="rounded-xl border border-[#E1E5E8] p-4"><p className="text-xs font-bold text-[#737C87]">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div> }
