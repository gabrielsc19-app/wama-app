"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, FileImage, FilePlus2, ImageUp, Loader2, ReceiptText, RefreshCw, Sparkles, UploadCloud, X } from "lucide-react";
import { supabase } from "../../../app/lib/supabase";

type Rendition = { id:string; report_number:string; merchant:string; expense_date:string; category:string; amount_clp:number; description:string|null; cost_center:string|null; status:string; wama_projects:{name:string;code:string}|null; wama_profiles:{full_name:string;email:string}|null };
type Project = { id:string; name:string; code:string };
type OcrData = { merchant?:string; date?:string; totalAmount?:number|null; suggestedCategory?:string; suggestedCostCenter?:string; confidence?:number; warnings?:string[]; documentType?:string; folio?:string; rut?:string; reviewRequired?:boolean };

const money = (n:number) => new Intl.NumberFormat("es-CL", { style:"currency", currency:"CLP", maximumFractionDigits:0 }).format(n);

function normalizeConfidence(value: unknown): number {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw <= 1 ? raw * 100 : raw)));
}
const initialForm = () => ({ merchant:"", expenseDate:new Date().toISOString().slice(0,10), category:"Movilización", amountClp:"", description:"", costCenter:"", projectId:"" });

export default function PilotExpenseHub() {
  const [items,setItems] = useState<Rendition[]>([]);
  const [projects,setProjects] = useState<Project[]>([]);
  const [role,setRole] = useState("");
  const [loading,setLoading] = useState(true);
  const [open,setOpen] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [form,setForm] = useState(initialForm);
  const [file,setFile] = useState<File|null>(null);
  const [preview,setPreview] = useState("");
  const [ocr,setOcr] = useState<OcrData|null>(null);
  const [reading,setReading] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

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
    e.preventDefault(); setError("");
    const t=await token();
    const r=await fetch("/api/expense/renditions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({...form,amountClp:Number(form.amountClp)})});
    const d=await r.json();
    if(!r.ok){setError(d.error||"No se pudo crear.");return;}
    if(file){
      const evidence=new FormData(); evidence.append("file",file); evidence.append("renditionId",d.rendition.id);
      const upload=await fetch("/api/expense/evidence",{method:"POST",headers:{Authorization:`Bearer ${t}`},body:evidence});
      const uploadData=await upload.json();
      if(!upload.ok){setError(uploadData.error||"La rendición fue creada, pero no se pudo guardar la evidencia.");await load();return;}
    }
    setMessage("Rendición y evidencia guardadas correctamente."); closeModal(); await load();
  }

  async function review(id:string,status:string){const t=await token();const r=await fetch("/api/expense/renditions",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({id,status})});if(r.ok){setMessage(`Rendición ${status}.`);await load();}}
  function closeModal(){setOpen(false);setForm(initialForm());setFile(null);setOcr(null);setError("");if(preview)URL.revokeObjectURL(preview);setPreview("");}

  const total=useMemo(()=>items.reduce((s,i)=>s+Number(i.amount_clp),0),[items]);
  const pending=items.filter(i=>["submitted","in_review","observed"].includes(i.status)).length;
  const canReview=["owner","admin","manager"].includes(role);

  return <main className="min-h-screen bg-[#F4F6F7] text-[#0B0C0E]">
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <div><Link href="/empresa" className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">WAMA · Tu portal</Link><h1 className="text-2xl font-black tracking-[-.04em]">Expense Hub</h1></div>
        <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black"><Camera className="h-4 w-4"/><span className="hidden sm:inline">Nueva rendición</span><span className="sm:hidden">Capturar</span></button>
      </div>
    </header>

    <div className="mx-auto max-w-7xl space-y-5 px-3 py-4 sm:space-y-6 sm:p-8">
      <section className="grid overflow-hidden rounded-[2rem] bg-[#0B0C0E] text-white lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="p-6 sm:p-9"><p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">Foto + OpenAI</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">Rinde un gasto en segundos.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#B7BEC8]">Toma una foto o selecciona una boleta, factura o PDF. WAMA usa OpenAI para extraer comercio, fecha, monto, categoría y centro de costo.</p></div>
        <div className="grid grid-cols-2 gap-3 p-5 lg:w-[380px]"><button onClick={()=>cameraInput.current?.click()} className="rounded-2xl bg-[#00E5D6] p-5 text-left font-black text-[#0B0C0E]"><Camera className="mb-8 h-7 w-7"/>Tomar foto</button><button onClick={()=>galleryInput.current?.click()} className="rounded-2xl border border-white/15 bg-white/5 p-5 text-left font-black"><ImageUp className="mb-8 h-7 w-7 text-[#00E5D6]"/>Subir archivo</button></div>
      </section>
      <input ref={cameraInput} className="hidden" type="file" accept="image/*" capture="environment" onChange={e=>{chooseFile(e.target.files?.[0]);setOpen(true);e.currentTarget.value="";}}/>
      <input ref={galleryInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>{chooseFile(e.target.files?.[0]);setOpen(true);e.currentTarget.value="";}}/>

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4"><Card label="Rendiciones" value={String(items.length)}/><Card label="Pendientes" value={String(pending)}/><Card label="Monto registrado" value={money(total)}/></section>
      {message&&<div className="rounded-2xl bg-[#DFFFFA] p-4 text-sm font-bold text-[#08645F]">{message}</div>}
      {error&&!open&&<div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-[2rem] border border-[#DCE1E6] bg-white">
        <div className="flex items-center justify-between border-b p-5 sm:p-7"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">Tu empresa</p><h2 className="mt-1 text-2xl font-black">Rendiciones y aprobaciones</h2></div><button onClick={()=>load()} className="rounded-full border p-3"><RefreshCw className="h-4 w-4"/></button></div>
        {loading?<p className="p-7">Cargando…</p>:<div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead><tr className="border-b bg-[#F8F9FA] text-xs uppercase tracking-[.12em] text-[#69717D]"><th className="p-4">N°</th><th>Persona</th><th>Comercio</th><th>Proyecto</th><th>Monto</th><th>Estado</th><th className="pr-4 text-right">Acción</th></tr></thead><tbody>{items.map(i=><tr key={i.id} className="border-b"><td className="p-4 font-black">{i.report_number}</td><td>{i.wama_profiles?.full_name||"Usuario"}</td><td><strong>{i.merchant}</strong><br/><span className="text-xs text-[#69717D]">{i.category} · {i.expense_date}</span></td><td>{i.wama_projects?`${i.wama_projects.code} · ${i.wama_projects.name}`:"Sin proyecto"}</td><td className="font-black">{money(Number(i.amount_clp))}</td><td><span className="rounded-full bg-[#EEF2F3] px-3 py-1 text-xs font-black">{i.status}</span></td><td className="pr-4 text-right">{canReview&&i.status==="submitted"?<button onClick={()=>review(i.id,"approved")} className="inline-flex items-center gap-1 rounded-full bg-[#0B0C0E] px-3 py-2 text-xs font-black text-white"><CheckCircle2 className="h-3 w-3"/>Aprobar</button>:"—"}</td></tr>)}{items.length===0&&<tr><td colSpan={7} className="p-10 text-center text-[#69717D]">Aún no hay rendiciones. Toma una foto para crear la primera.</td></tr>}</tbody></table></div>}
      </section>
    </div>

    {open&&<div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-3 sm:p-6"><div className="mx-auto flex min-h-full max-w-5xl items-center justify-center"><form onSubmit={create} className="w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DFFFFA] text-[#008F87]"><ReceiptText/></span><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">Nueva rendición</p><h2 className="text-xl font-black">Captura y confirma</h2></div></div><button type="button" onClick={closeModal} className="rounded-full border p-2"><X className="h-5 w-5"/></button></div>
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
          <Field label="Comercio"><input required value={form.merchant} onChange={e=>setForm({...form,merchant:e.target.value})} placeholder="Comercio" className="w-full rounded-2xl border p-4"/></Field>
          <Field label="Fecha"><input required type="date" value={form.expenseDate} onChange={e=>setForm({...form,expenseDate:e.target.value})} className="w-full rounded-2xl border p-4"/></Field>
          <Field label="Categoría"><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full rounded-2xl border p-4"><option>Movilización</option><option>Alimentación</option><option>Alojamiento</option><option>Combustible</option><option>Insumos</option><option>Otros</option></select></Field>
          <Field label="Monto CLP"><input required type="number" min="1" value={form.amountClp} onChange={e=>setForm({...form,amountClp:e.target.value})} placeholder="Monto" className="w-full rounded-2xl border p-4"/></Field>
          <div className="sm:col-span-2"><Field label="Proyecto"><select value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} className="w-full rounded-2xl border p-4"><option value="">Sin proyecto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></Field></div>
          <div className="sm:col-span-2"><Field label="Centro de costo"><input value={form.costCenter} onChange={e=>setForm({...form,costCenter:e.target.value})} placeholder="Centro de costo" className="w-full rounded-2xl border p-4"/></Field></div>
          <div className="sm:col-span-2"><Field label="Motivo o referencia"><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Motivo del gasto" className="min-h-24 w-full rounded-2xl border p-4"/></Field></div>
        </div>{error&&<div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={closeModal} className="flex-1 rounded-full border px-5 py-3 font-black">Cancelar</button><button className="flex-1 rounded-full bg-[#00E5D6] px-5 py-3 font-black">Enviar rendición</button></div></section>
      </div>
    </form></div></div>}
  </main>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="grid gap-2 text-sm font-black"><span>{label}</span>{children}</label>}
function Card({label,value}:{label:string;value:string}){return <div className="rounded-[1.5rem] border border-[#DCE1E6] bg-white p-5"><p className="text-xs font-black uppercase tracking-[.15em] text-[#69717D]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>}
