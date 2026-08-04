"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Camera, CheckCircle2, ChevronRight, ClipboardCheck, Eye, FileImage, ImageUp, Info, LayoutDashboard, Loader2, ReceiptText, RefreshCw, Sparkles, UploadCloud, WalletCards, X, XCircle } from "lucide-react";
import { supabase } from "../../../app/lib/supabase";
import EnterpriseShell from "../enterprise/EnterpriseShell";

type Evidence = { id:string; file_name:string; mime_type:string; file_size:number; storage_path:string; created_at:string; evidence_type?:string; url?:string|null };
type FundSummary = { delivered:number; approved_spent:number; pending_spent:number; returned:number; available:number };
type Rendition = { id:string; report_number:string; request_type?:string; merchant:string; expense_date:string; category:string; amount_clp:number; approved_amount_clp?:number|null; paid_amount_clp?:number; parent_fund_id?:string|null; fund_summary?:FundSummary; description:string|null; cost_center:string|null; status:string; review_comment?:string|null; reviewed_at?:string|null; wama_projects:{name:string;code:string}|null; wama_profiles:{full_name:string;email:string}|null; wama_expense_evidence?:Evidence[] };
type Project = { id:string; name:string; code:string };
type OcrData = { merchant?:string; date?:string; totalAmount?:number|null; suggestedCategory?:string; suggestedCostCenter?:string; confidence?:number; warnings?:string[]; documentType?:string; folio?:string; rut?:string; reviewRequired?:boolean };

const money = (n:number) => new Intl.NumberFormat("es-CL", { style:"currency", currency:"CLP", maximumFractionDigits:0 }).format(n);

function normalizeConfidence(value: unknown): number {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw <= 1 ? raw * 100 : raw)));
}
const initialForm = () => ({ requestType:"expense_reimbursement", merchant:"", expenseDate:new Date().toISOString().slice(0,10), category:"Movilización", amountClp:"", description:"", costCenter:"", projectId:"", parentFundId:"", dueDate:"" });

export default function PilotExpenseHub() {
  const [items,setItems] = useState<Rendition[]>([]);
  const [projects,setProjects] = useState<Project[]>([]);
  const [role,setRole] = useState("");
  const [view,setView] = useState<"home"|"mine"|"funds"|"approvals"|"treasury">("home");
  const [loading,setLoading] = useState(true);
  const [open,setOpen] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [form,setForm] = useState(initialForm);
  const [file,setFile] = useState<File|null>(null);
  const [preview,setPreview] = useState("");
  const [ocr,setOcr] = useState<OcrData|null>(null);
  const [reading,setReading] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [selected,setSelected] = useState<Rendition|null>(null);
  const [evidence,setEvidence] = useState<Evidence[]>([]);
  const [detailLoading,setDetailLoading] = useState(false);
  const [reviewComment,setReviewComment] = useState("");
  const [paymentAmount,setPaymentAmount] = useState("");
  const [paymentReference,setPaymentReference] = useState("");
  const [paymentReceipt,setPaymentReceipt] = useState<File|null>(null);
  const [actionLoading,setActionLoading] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);

  async function token() { const {data}=await supabase.auth.getSession(); return data.session?.access_token||""; }
  async function load() {
    setLoading(true);
    const t=await token();
    if(!t){ location.href="/login"; return; }
    const r=await fetch("/api/expense/renditions",{headers:{Authorization:`Bearer ${t}`}});
    const d=await r.json();
    setItems(d.renditions||[]); setProjects(d.projects||[]); setRole(d.role||""); setLoading(false);
  }
  useEffect(()=>{ void load(); },[]);
  useEffect(()=>()=>{ if(preview) URL.revokeObjectURL(preview); },[preview]);

  function chooseFile(selected?:File) {
    if(!selected) return;
    if(preview) URL.revokeObjectURL(preview);
    setFile(selected); setPreview(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : ""); setOcr(null); setError("");
    void readWithOpenAI(selected);
  }

  async function readWithOpenAI(selected = file) {
    if(!selected) return;
    setReading(true); setError(""); setMessage("");
    try {
      const body=new FormData(); body.append("file",selected);
      const r=await fetch("/api/expense/ocr",{method:"POST",body});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"No fue posible leer el documento.");
      const result:OcrData=d.data||{};
      setOcr(result);
      setForm(current=>({
        ...current,
        merchant:result.merchant||current.merchant,
        expenseDate:result.date||current.expenseDate,
        amountClp:result.totalAmount ? String(result.totalAmount) : current.amountClp,
        category:result.suggestedCategory||current.category,
        costCenter:result.suggestedCostCenter||current.costCenter,
        description:[result.documentType,result.folio?`Folio ${result.folio}`:"",result.rut?`RUT ${result.rut}`:""].filter(Boolean).join(" · ")||current.description,
      }));
      setMessage("OpenAI leyó el documento. Revisa los datos antes de enviarlo.");
    } catch(reason) { setError(reason instanceof Error?reason.message:"No fue posible analizar el documento."); }
    finally { setReading(false); }
  }

  async function create(e:FormEvent) {
    e.preventDefault();
    if(submitLock.current) return;
    submitLock.current=true; setSubmitting(true); setError(""); setMessage("");
    try {
      const t=await token();
      if(!t) throw new Error("No pudimos validar tu sesión. Vuelve a ingresar e inténtalo nuevamente.");
      const r=await fetch("/api/expense/renditions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({...form,amountClp:Number(form.amountClp)})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||"No fue posible enviar la solicitud. Revisa los datos e inténtalo nuevamente.");
      if(file){
        const evidence=new FormData(); evidence.append("file",file); evidence.append("renditionId",d.rendition.id);
        const upload=await fetch("/api/expense/evidence",{method:"POST",headers:{Authorization:`Bearer ${t}`},body:evidence});
        const uploadData=await upload.json().catch(()=>({}));
        if(!upload.ok){
          setError(uploadData.error||"La solicitud fue creada, pero no se pudo guardar la evidencia. Puedes abrirla y adjuntar el documento nuevamente.");
          await load();
          return;
        }
      }
      closeModal(true);
      setMessage("Solicitud enviada correctamente.");
      await load();
    } catch(reason) {
      setError(reason instanceof Error?reason.message:"No fue posible enviar la solicitud. Inténtalo nuevamente.");
    } finally {
      submitLock.current=false; setSubmitting(false);
    }
  }

  async function openDetail(item:Rendition){
    setSelected(item); setEvidence([]); setReviewComment(item.review_comment||""); setDetailLoading(true); setError("");
    const t=await token();
    const r=await fetch(`/api/expense/evidence?renditionId=${encodeURIComponent(item.id)}`,{headers:{Authorization:`Bearer ${t}`}});
    const d=await r.json();
    if(r.ok)setEvidence(d.evidence||[]);else setError(d.error||"No se pudo abrir la evidencia.");
    setDetailLoading(false);
  }
  async function review(id:string,status:string){
    if(actionLoading)return;
    setActionLoading(true); setError("");
    const t=await token();
    const r=await fetch("/api/expense/renditions",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({id,status,comment:reviewComment})});
    const d=await r.json();
    if(!r.ok){setError(d.error||"No se pudo actualizar la rendición.");setActionLoading(false);return;}
    setSelected(null); setEvidence([]); setReviewComment("");
    setMessage(status==="approved"?"Rendición aprobada correctamente.":"Rendición rechazada y registrada en el historial.");
    await load(); setActionLoading(false);
  }
  async function operate(action:string){
    if(!selected||actionLoading)return; setActionLoading(true); const t=await token(); setError("");
    let evidenceId:string|undefined;
    if(action==="pay"||action==="return_fund"){
      if(!paymentReceipt){setError("Adjunta el comprobante de transferencia.");setActionLoading(false);return;}
      const uploadBody=new FormData(); uploadBody.append("file",paymentReceipt); uploadBody.append("renditionId",selected.id); uploadBody.append("evidenceType",action==="return_fund"?"return_receipt":"transfer_receipt");
      const upload=await fetch("/api/expense/evidence",{method:"POST",headers:{Authorization:`Bearer ${t}`},body:uploadBody});
      const uploadData=await upload.json().catch(()=>({}));
      if(!upload.ok){setError(uploadData.error||"No se pudo guardar el comprobante de transferencia.");setActionLoading(false);return;}
      evidenceId=uploadData.evidence?.id;
    }
    const r=await fetch("/api/expense/renditions",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({id:selected.id,action,comment:reviewComment,amount:Number(paymentAmount||0),reference:paymentReference,paymentType:selected.request_type==="fund_request"?"advance":"installment",evidenceId})});
    const d=await r.json(); if(!r.ok){setError(d.error||"No se pudo registrar la acción.");setActionLoading(false);return;} setSelected(null);setEvidence([]);setPaymentAmount("");setPaymentReference("");setPaymentReceipt(null);setMessage("Movimiento actualizado correctamente.");await load();setActionLoading(false);
  }
  function closeModal(force=false){if(submitLock.current&&!force)return;setOpen(false);setForm(initialForm());setFile(null);setOcr(null);setError("");if(preview)URL.revokeObjectURL(preview);setPreview("");}

  const total=useMemo(()=>items.reduce((s,i)=>s+Number(i.amount_clp),0),[items]);
  const pending=items.filter(i=>["submitted","in_review","observed"].includes(i.status)).length;
  const canReview=["owner","admin","super_admin","manager","approver"].includes(role);
  const canFinance=["owner","admin","super_admin","finance","treasury"].includes(role);
  const funds=items.filter(i=>i.request_type==="fund_request");
  const availableFunds=funds.filter(f=>["open","partially_rendered"].includes(f.status)&&Number(f.fund_summary?.available||0)>0);
  const visibleItems=view==="funds"?funds:view==="approvals"?items.filter(i=>["submitted","assigned","in_review","observed"].includes(i.status)):view==="treasury"?items.filter(i=>["approved","pending_payment","partially_paid","open"].includes(i.status)):items;
  const openCreate=(requestType:string)=>{setForm({...initialForm(),requestType,category:requestType==="fund_request"?"Fondo por rendir":"Movilización"});setOpen(true)};

  return <EnterpriseShell title="Expense Hub" subtitle="Rinde, revisa y aprueba gastos con su evidencia original.">
    <div className="space-y-5 sm:space-y-6">
      <nav className="flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgba(11,12,14,.06)]">
        <Nav active={view==="home"} icon={LayoutDashboard} label="Inicio" onClick={()=>setView("home")}/><Nav active={view==="mine"} icon={ReceiptText} label="Mis movimientos" onClick={()=>setView("mine")}/><Nav active={view==="funds"} icon={WalletCards} label="Fondos" onClick={()=>setView("funds")}/>{canReview&&<Nav active={view==="approvals"} icon={ClipboardCheck} label="Aprobaciones" onClick={()=>setView("approvals")}/>} {canFinance&&<Nav active={view==="treasury"} icon={Banknote} label="Tesorería" onClick={()=>setView("treasury")}/>} 
      </nav>
      {view==="home"&&<section className="grid gap-4 lg:grid-cols-2"><Quick icon={WalletCards} title="Solicitar dinero antes de gastar" text="Pide un fondo a la empresa y, cuando lo recibas, podrás justificar su uso." onClick={()=>openCreate("fund_request")}/><Quick icon={ReceiptText} title="Justificar un fondo recibido" text="Presenta las boletas de un fondo que la empresa ya te entregó." onClick={()=>openCreate("fund_rendition")}/></section>}
      <section className="grid overflow-hidden rounded-[2rem] bg-[#0B0C0E] text-white lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="p-6 sm:p-9"><p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">Reembolso de gasto · Foto + OpenAI</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">¿Pagaste con tu dinero? Ríndelo aquí.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#B7BEC8]">Toma una foto o selecciona una boleta, factura o PDF. WAMA completa los datos y prepara tu solicitud de reembolso.</p></div>
        <div className="grid grid-cols-2 gap-3 p-5 lg:w-[380px]"><button onClick={()=>cameraInput.current?.click()} className="rounded-2xl bg-[#00E5D6] p-5 text-left font-black text-[#0B0C0E]"><Camera className="mb-8 h-7 w-7"/>Tomar foto</button><button onClick={()=>galleryInput.current?.click()} className="rounded-2xl border border-white/15 bg-white/5 p-5 text-left font-black"><ImageUp className="mb-8 h-7 w-7 text-[#00E5D6]"/>Subir archivo</button></div>
      </section>
      <input ref={cameraInput} className="hidden" type="file" accept="image/*" capture="environment" onChange={e=>{chooseFile(e.target.files?.[0]);setOpen(true);e.currentTarget.value="";}}/>
      <input ref={galleryInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>{chooseFile(e.target.files?.[0]);setOpen(true);e.currentTarget.value="";}}/>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4"><Card label="Movimientos" value={String(items.length)}/><Card label="Requieren atención" value={String(pending)}/><Card label="Fondos vigentes" value={String(funds.filter(f=>["approved","partially_paid","open"].includes(f.status)).length)}/><Card label="Monto gestionado" value={money(total)}/></section>
      {view!=="home"&&<section className="rounded-[2rem] bg-white p-5 shadow-[0_12px_40px_rgba(11,12,14,.06)] sm:p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">Bandeja de trabajo</p><h2 className="mt-2 text-2xl font-black">{view==="funds"?"Fondos por rendir":view==="approvals"?"Solicitudes que requieren aprobación":view==="treasury"?"Pagos y abonos pendientes":"Mis movimientos"}</h2><div className="mt-5 divide-y divide-[#EDF0F2]">{visibleItems.length?visibleItems.map(i=><button key={i.id} onClick={()=>openDetail(i)} className="grid w-full cursor-pointer gap-3 py-4 text-left sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong>{i.report_number} · {i.merchant}</strong><p className="mt-1 text-xs text-[#74808A]">{requestLabel(i.request_type)} · {i.wama_profiles?.full_name||"Usuario"}</p></div><span className="text-sm font-black">{money(Number(i.amount_clp))}</span><span className="rounded-full bg-[#EEF5F4] px-3 py-2 text-xs font-black text-[#087169]">{statusLabel(i.status)}</span></button>):<p className="py-8 text-center text-sm text-[#74808A]">No hay movimientos en esta bandeja.</p>}</div></section>}
      {message&&<div className="rounded-2xl bg-[#DFFFFA] p-4 text-sm font-bold text-[#08645F]">{message}</div>}
      {error&&!open&&<div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-[2rem] border border-[#DCE1E6] bg-white">
        <div className="flex items-center justify-between border-b p-5 sm:p-7"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">Tu empresa</p><h2 className="mt-1 text-2xl font-black">Rendiciones y aprobaciones</h2></div><button onClick={()=>load()} className="rounded-full border p-3"><RefreshCw className="h-4 w-4"/></button></div>
        {loading?<p className="p-7">Cargando…</p>:<><div className="divide-y sm:hidden">{items.map(i=><button key={i.id} onClick={()=>openDetail(i)} className="grid w-full gap-3 p-5 text-left"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-[#008F87]">{i.report_number}</p><h3 className="mt-1 font-black">{i.merchant}</h3><p className="mt-1 text-xs text-[#69717D]">{i.category} · {i.expense_date}</p></div><strong className="text-lg">{money(Number(i.amount_clp))}</strong></div><div className="flex items-center justify-between"><span className="rounded-full bg-[#EEF2F3] px-3 py-1 text-xs font-black">{statusLabel(i.status)}</span><span className="inline-flex items-center gap-1 text-xs font-black text-[#008F87]"><Eye className="h-4 w-4"/>Ver rendición</span></div></button>)}{items.length===0&&<p className="p-8 text-center text-sm text-[#69717D]">Aún no hay rendiciones.</p>}</div><div className="hidden overflow-x-auto sm:block"><table className="min-w-[900px] w-full text-left text-sm"><thead><tr className="border-b bg-[#F8F9FA] text-xs uppercase tracking-[.12em] text-[#69717D]"><th className="p-4">N°</th><th>Persona</th><th>Comercio</th><th>Proyecto</th><th>Monto</th><th>Estado</th><th className="pr-4 text-right">Acción</th></tr></thead><tbody>{items.map(i=><tr key={i.id} className="border-b"><td className="p-4 font-black">{i.report_number}</td><td>{i.wama_profiles?.full_name||"Usuario"}</td><td><strong>{i.merchant}</strong><br/><span className="text-xs text-[#69717D]">{i.category} · {i.expense_date}</span></td><td>{i.wama_projects?`${i.wama_projects.code} · ${i.wama_projects.name}`:"Sin proyecto"}</td><td className="font-black">{money(Number(i.amount_clp))}</td><td><span className="rounded-full bg-[#EEF2F3] px-3 py-1 text-xs font-black">{statusLabel(i.status)}</span></td><td className="pr-4 text-right"><button onClick={()=>openDetail(i)} className="inline-flex items-center gap-2 rounded-full border border-[#B9C2CA] px-3 py-2 text-xs font-black text-[#0B0C0E]"><Eye className="h-4 w-4"/>Revisar</button></td></tr>)}{items.length===0&&<tr><td colSpan={7} className="p-10 text-center text-[#69717D]">Aún no hay rendiciones. Toma una foto para crear la primera.</td></tr>}</tbody></table></div></>}
      </section>
    </div>

    {open&&<div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-3 sm:p-6"><div className="mx-auto flex min-h-full max-w-5xl items-center justify-center"><form onSubmit={create} className="w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DFFFFA] text-[#008F87]"><ReceiptText/></span><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Nueva rendición</p><h2 className="text-xl font-black">Captura y confirma</h2></div></div><button type="button" onClick={()=>closeModal()} className="rounded-full border p-2"><X className="h-5 w-5"/></button></div>
      <div className="grid lg:grid-cols-[.8fr_1.2fr]">
        <section className="border-b bg-[#F5F7F8] p-5 lg:border-b-0 lg:border-r sm:p-7">
          {!file?<div className="grid gap-3"><button type="button" onClick={()=>cameraInput.current?.click()} className="flex min-h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#A8DCD7] bg-white p-6 text-center"><Camera className="h-9 w-9 text-[#008F87]"/><strong className="mt-3">Tomar foto</strong><span className="mt-1 text-xs text-[#69717D]">Ideal para celular</span></button><button type="button" onClick={()=>galleryInput.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-black"><UploadCloud className="h-4 w-4"/>Elegir imagen o PDF</button></div>:<div>
            <div className="overflow-hidden rounded-3xl border bg-white">{preview?<img src={preview} alt="Documento seleccionado" className="h-72 w-full object-contain bg-[#EEF1F3]"/>:<div className="flex h-72 flex-col items-center justify-center"><FileImage className="h-12 w-12 text-[#008F87]"/><strong className="mt-3">{file.name}</strong></div>}</div>
            <div className="mt-3 flex gap-2"><button type="button" onClick={()=>galleryInput.current?.click()} className="flex-1 rounded-full border bg-white px-4 py-3 text-xs font-black">Cambiar archivo</button><button type="button" onClick={()=>readWithOpenAI()} disabled={reading} className="flex-1 rounded-full bg-[#0B0C0E] px-4 py-3 text-xs font-black text-white disabled:opacity-60">{reading?"Leyendo…":"Leer nuevamente"}</button></div>
            {reading&&<div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#DFFFFA] p-4 text-sm font-bold text-[#08645F]"><Loader2 className="h-5 w-5 animate-spin"/>OpenAI está leyendo el documento…</div>}
            {ocr&&<div className="mt-4 rounded-2xl border border-[#BCEFEA] bg-white p-4"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#008F87]"/><strong className="text-sm">Lectura inteligente completada</strong></div><p className="mt-2 text-xs text-[#69717D]">Confianza: {normalizeConfidence(ocr.confidence)}%{ocr.reviewRequired?" · Requiere revisión":" · Validación alta"}</p>{ocr.warnings?.length?<p className="mt-2 text-xs text-amber-700">{ocr.warnings.join(" · ")}</p>:null}</div>}
          </div>}
        </section>
        <section className="p-5 sm:p-7"><div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="¿Qué necesitas hacer?"><select value={form.requestType} onChange={e=>setForm({...form,requestType:e.target.value,parentFundId:""})} className="w-full cursor-pointer rounded-2xl border border-[#DDE3E7] bg-white p-4"><option value="expense_reimbursement">Solicitar reembolso de un gasto</option><option value="fund_request">Solicitar dinero antes de gastar</option><option value="fund_rendition">Justificar gastos de un fondo recibido</option></select><div className="mt-1 flex items-start gap-2 rounded-2xl bg-[#F3F8F7] p-3 text-xs font-medium leading-5 text-[#53606A]"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#008F87]"/><span>{requestHelp(form.requestType)}</span></div></Field></div>
          {form.requestType==="fund_rendition"&&<div className="sm:col-span-2"><Field label="Fondo que estás rindiendo">{availableFunds.length?<select required value={form.parentFundId} onChange={e=>setForm({...form,parentFundId:e.target.value})} className="w-full cursor-pointer rounded-2xl border border-[#DDE3E7] bg-white p-4"><option value="">Selecciona un fondo vigente</option>{availableFunds.map(f=><option key={f.id} value={f.id}>{f.report_number} · {f.description||f.merchant} · Entregado {money(Number(f.amount_clp))}</option>)}</select>:<div className="rounded-2xl border border-[#CFE7E4] bg-[#F4FBFA] p-4"><strong className="block text-sm text-[#0B5F5A]">No tienes fondos vigentes para rendir</strong><p className="mt-1 text-xs font-medium leading-5 text-[#607078]">Primero solicita un fondo. Cuando sea aprobado y entregado por Tesorería, aparecerá automáticamente en esta lista.</p><button type="button" onClick={()=>setForm({...initialForm(),requestType:"fund_request",category:"Fondo por rendir"})} className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-black text-[#008F87]">Solicitar un fondo ahora <ChevronRight className="h-4 w-4"/></button></div>}</Field></div>}
          <Field label={form.requestType==="fund_request"?"Nombre o motivo del fondo":"Comercio"}><input required={form.requestType!=="fund_request"} value={form.merchant} onChange={e=>setForm({...form,merchant:e.target.value})} placeholder={form.requestType==="fund_request"?"Ej. Gastos operacionales agosto":"Comercio"} className="w-full rounded-2xl border p-4"/></Field>
          <Field label="Fecha"><input required type="date" value={form.expenseDate} onChange={e=>setForm({...form,expenseDate:e.target.value})} className="w-full rounded-2xl border p-4"/></Field>
          <Field label="Categoría"><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full rounded-2xl border p-4"><option>Movilización</option><option>Alimentación</option><option>Alojamiento</option><option>Combustible</option><option>Insumos</option><option>Otros</option></select></Field>
          <Field label="Monto CLP"><input required type="number" min="1" value={form.amountClp} onChange={e=>setForm({...form,amountClp:e.target.value})} placeholder="Monto" className="w-full rounded-2xl border p-4"/></Field>
          <div className="sm:col-span-2"><Field label="Proyecto"><select value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} className="w-full rounded-2xl border p-4"><option value="">Sin proyecto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></Field></div>
          <div className="sm:col-span-2"><Field label="Centro de costo"><input value={form.costCenter} onChange={e=>setForm({...form,costCenter:e.target.value})} placeholder="Centro de costo" className="w-full rounded-2xl border p-4"/></Field></div>
          <div className="sm:col-span-2"><Field label="Motivo o referencia"><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Motivo del gasto" className="min-h-24 w-full rounded-2xl border p-4"/></Field></div>
        </div>{error&&<div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"><span className="block">No pudimos enviar la solicitud</span><span className="mt-1 block font-medium">{error}</span></div>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row"><button type="button" disabled={submitting} onClick={()=>closeModal()} className="flex-1 rounded-full border px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button><button type="submit" disabled={submitting||(form.requestType==="fund_rendition"&&!form.parentFundId)} aria-busy={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-5 py-3 font-black transition disabled:cursor-not-allowed disabled:bg-[#9AEAE4] disabled:text-[#49635F]"><Loader2 className={`h-5 w-5 ${submitting?"animate-spin":"hidden"}`}/>{submitting?"Enviando solicitud…":form.requestType==="fund_request"?"Enviar solicitud de fondo":form.requestType==="fund_rendition"?"Enviar rendición del fondo":"Enviar solicitud de reembolso"}</button></div>{submitting&&<p className="mt-3 text-center text-xs font-bold text-[#69717D]">Estamos guardando la solicitud y su evidencia. No cierres esta ventana.</p>}</section>
      </div>
    </form></div></div>}
    {selected&&<div className="fixed inset-0 z-[80] overflow-y-auto bg-black/65 p-3 sm:p-6"><div className="mx-auto my-3 max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl sm:my-8"><div className="flex items-center justify-between border-b p-5 sm:p-7"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">{selected.report_number}</p><h2 className="mt-1 text-2xl font-black">Revisar rendición</h2></div><button onClick={()=>setSelected(null)} className="rounded-full border p-2" aria-label="Cerrar"><X className="h-5 w-5"/></button></div><div className="grid lg:grid-cols-[1.1fr_.9fr]"><section className="min-h-[360px] border-b bg-[#EEF1F3] p-4 lg:border-b-0 lg:border-r sm:p-6">{detailLoading?<div className="flex min-h-[360px] items-center justify-center gap-3 font-bold"><Loader2 className="animate-spin"/>Cargando evidencia…</div>:evidence[0]?.url?(evidence[0].mime_type==="application/pdf"?<iframe title="Evidencia PDF" src={evidence[0].url} className="h-[70vh] min-h-[480px] w-full rounded-2xl bg-white"/>:<a href={evidence[0].url} target="_blank" rel="noreferrer" className="block"><img src={evidence[0].url} alt="Evidencia de la rendición" className="mx-auto max-h-[70vh] w-full rounded-2xl bg-white object-contain"/><span className="mt-3 block text-center text-xs font-black text-[#008F87]">Toca la imagen para verla en tamaño completo</span></a>):<div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C3CBD2] bg-white text-center"><FileImage className="h-12 w-12 text-[#7B858E]"/><strong className="mt-3">Esta rendición no tiene evidencia guardada</strong><span className="mt-1 text-xs text-[#69717D]">Las nuevas imágenes y PDF quedarán registrados aquí.</span></div>}</section><section className="p-5 sm:p-7"><dl className="grid gap-4 sm:grid-cols-2"><Detail label="Comercio" value={selected.merchant}/><Detail label="Monto" value={money(Number(selected.amount_clp))}/><Detail label="Fecha" value={selected.expense_date}/><Detail label="Categoría" value={selected.category}/><Detail label="Persona" value={selected.wama_profiles?.full_name||"Usuario"}/><Detail label="Proyecto" value={selected.wama_projects?`${selected.wama_projects.code} · ${selected.wama_projects.name}`:"Sin proyecto"}/></dl>{selected.description&&<div className="mt-5 rounded-2xl bg-[#F4F6F7] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#69717D]">Descripción</p><p className="mt-2 text-sm">{selected.description}</p></div>}{evidence.length>1&&<div className="mt-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#69717D]">Historial de evidencias</p><div className="mt-2 grid gap-2">{evidence.map((item,index)=><a key={item.id} href={item.url||"#"} target="_blank" rel="noreferrer" className="rounded-xl border p-3 text-xs font-bold">{index+1}. {item.file_name} · {new Date(item.created_at).toLocaleString("es-CL")}</a>)}</div></div>}{canReview&&selected.status==="submitted"&&<div className="mt-6 border-t pt-5"><label className="grid gap-2 text-sm font-black">Comentario de revisión<textarea value={reviewComment} onChange={e=>setReviewComment(e.target.value)} className="min-h-24 rounded-2xl border p-4" placeholder="Opcional al aprobar; recomendado al rechazar"/></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><button disabled={actionLoading} onClick={()=>review(selected.id,"rejected")} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-300 bg-red-50 px-5 py-3 font-black text-red-700"><XCircle className="h-5 w-5"/>Rechazar</button><button disabled={actionLoading} onClick={()=>review(selected.id,"approved")} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-5 py-3 font-black text-[#0B0C0E]"><CheckCircle2 className="h-5 w-5"/>Aprobar</button></div></div>}
{!canReview||selected.status!=="submitted"?<div className="mt-6 rounded-2xl bg-[#DFFFFA] p-4 text-sm font-bold text-[#08645F]">Estado: {statusLabel(selected.status)}{selected.review_comment?` · ${selected.review_comment}`:""}</div>:null}
{canReview&&["submitted","assigned","in_review"].includes(selected.status)&&<div className="mt-6 border-t pt-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#69717D]">Gestión de la solicitud</p><div className="mt-3 grid gap-3">{selected.status==="submitted"&&<button disabled={actionLoading} onClick={()=>operate("assign")} className="rounded-full bg-[#F0F4F5] px-5 py-3 text-sm font-black disabled:opacity-50">{actionLoading?"Actualizando…":"Tomar y asignarme"}</button>}<button disabled={actionLoading} onClick={()=>operate("observe")} className="rounded-full bg-[#FFF5DE] px-5 py-3 text-sm font-black text-[#8B5A00] disabled:opacity-50">Solicitar corrección</button></div></div>}
{selected.request_type==="fund_request"&&selected.fund_summary&&<div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#F4F8F8] p-4 text-sm"><Detail label="Fondo entregado" value={money(selected.fund_summary.delivered)}/><Detail label="Gastos aprobados" value={money(selected.fund_summary.approved_spent)}/><Detail label="Pendiente de revisión" value={money(selected.fund_summary.pending_spent)}/><Detail label="Devuelto" value={money(selected.fund_summary.returned)}/><Detail label="Saldo disponible" value={money(selected.fund_summary.available)}/></div>}
{canFinance&&["approved","pending_payment","partially_paid"].includes(selected.status)&&<div className="mt-6 border-t pt-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#69717D]">Pago de la solicitud</p><p className="mt-2 text-sm text-[#69717D]">Registra el abono y adjunta obligatoriamente el comprobante de transferencia.</p><div className="mt-3 grid gap-3"><input type="number" min="1" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} placeholder="Monto del abono" className="rounded-2xl border border-[#DDE3E7] px-4 py-3 text-sm"/><input value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="Referencia o número de transferencia" className="rounded-2xl border border-[#DDE3E7] px-4 py-3 text-sm"/><label className="grid cursor-pointer gap-1 rounded-2xl border-2 border-dashed border-[#A8DCD7] bg-[#F6FCFB] p-4 text-sm font-black"><span>Comprobante de transferencia obligatorio</span><span className="text-xs font-medium text-[#69717D]">{paymentReceipt?paymentReceipt.name:"Selecciona una imagen o PDF"}</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e=>setPaymentReceipt(e.target.files?.[0]||null)}/></label><button disabled={actionLoading||!Number(paymentAmount)||!paymentReceipt} onClick={()=>operate("pay")} className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black disabled:opacity-50">{actionLoading?"Registrando pago y comprobante…":"Registrar abono o pago"}</button></div></div>}
{canFinance&&selected.request_type==="fund_request"&&["open","partially_rendered"].includes(selected.status)&&Number(selected.fund_summary?.available||0)>0&&<div className="mt-6 border-t pt-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#69717D]">Devolución del saldo</p><p className="mt-2 text-sm text-[#69717D]">Registra el dinero devuelto y su comprobante. El fondo se cerrará automáticamente cuando el saldo llegue a cero.</p><div className="mt-3 grid gap-3"><input type="number" min="1" max={selected.fund_summary?.available} value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} placeholder="Monto devuelto" className="rounded-2xl border border-[#DDE3E7] px-4 py-3 text-sm"/><input value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="Referencia de la devolución" className="rounded-2xl border border-[#DDE3E7] px-4 py-3 text-sm"/><label className="grid cursor-pointer gap-1 rounded-2xl border-2 border-dashed border-[#A8DCD7] bg-[#F6FCFB] p-4 text-sm font-black"><span>Comprobante de devolución obligatorio</span><span className="text-xs font-medium text-[#69717D]">{paymentReceipt?paymentReceipt.name:"Selecciona una imagen o PDF"}</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e=>setPaymentReceipt(e.target.files?.[0]||null)}/></label><button disabled={actionLoading||!Number(paymentAmount)||!paymentReceipt} onClick={()=>operate("return_fund")} className="rounded-full bg-[#0B0C0E] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{actionLoading?"Registrando devolución…":"Registrar devolución"}</button></div></div>}
</section></div></div></div>}
  </EnterpriseShell>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="grid gap-2 text-sm font-black"><span>{label}</span>{children}</label>}
function Card({label,value}:{label:string;value:string}){return <div className="rounded-[1.5rem] border border-[#DCE1E6] bg-white p-5"><p className="text-xs font-black uppercase tracking-[.15em] text-[#69717D]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>}
function Nav({active,icon:Icon,label,onClick}:{active:boolean;icon:React.ComponentType<{className?:string}>;label:string;onClick:()=>void}){return <button onClick={onClick} className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${active?"bg-[#0B0C0E] text-white":"text-[#65707B] hover:bg-[#F2F5F6]"}`}><Icon className="h-4 w-4"/>{label}</button>}
function Quick({icon:Icon,title,text,onClick,accent=false}:{icon:React.ComponentType<{className?:string}>;title:string;text:string;onClick:()=>void;accent?:boolean}){return <button onClick={onClick} className={`group cursor-pointer rounded-[1.75rem] p-6 text-left shadow-[0_12px_36px_rgba(11,12,14,.07)] transition hover:-translate-y-1 ${accent?"bg-[#0B0C0E] text-white":"bg-white"}`}><span className={`grid h-12 w-12 place-items-center rounded-2xl ${accent?"bg-[#00E5D6] text-[#0B0C0E]":"bg-[#DFFFFA] text-[#008F87]"}`}><Icon className="h-6 w-6"/></span><h3 className="mt-5 text-xl font-black">{title}</h3><p className={`mt-2 text-sm leading-6 ${accent?"text-[#B9C1C9]":"text-[#68727C]"}`}>{text}</p></button>}
function Detail({label,value}:{label:string;value:string}){return <div><dt className="text-xs font-black uppercase tracking-[.14em] text-[#69717D]">{label}</dt><dd className="mt-1 font-black">{value}</dd></div>}
function requestLabel(type?:string){return type==="fund_request"?"Fondo por rendir":type==="fund_rendition"?"Rendición de fondo":"Rendición / reembolso"}
function requestHelp(type:string){return type==="fund_request"?"La empresa te entrega dinero antes de realizar los gastos. Después deberás justificar su uso con boletas o facturas.":type==="fund_rendition"?"Usa esta opción para presentar boletas o facturas y descontarlas de un fondo que ya recibiste.":"Usa esta opción cuando pagaste un gasto con tu propio dinero y necesitas que la empresa te lo reembolse."}
function statusLabel(status:string){return ({submitted:"Pendiente",assigned:"Asignada",in_review:"En revisión",observed:"Observada",approved:"Aprobada",pending_payment:"Pendiente de pago",partially_paid:"Abonada parcialmente",paid:"Pagada",open:"Fondo vigente",partially_rendered:"Parcialmente rendido",settled:"Fondo cerrado",rejected:"Rechazada"} as Record<string,string>)[status]||status}
