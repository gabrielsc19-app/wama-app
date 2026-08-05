"use client";

import { FormEvent, useEffect, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { SectionCard, StatCard, StatusPill } from "../../../src/components/enterprise/PortalUI";
import { supabase } from "../../lib/supabase";

type ApiUser = { id:string; role:string; status:string; profile_id:string; wama_profiles:{ id:string; full_name:string; email:string; status:string } | null; module_keys?:string[] };
type License = { id:string; included_seats:number; extra_seat_blocks:number; extra_block_size:number; wama_module_catalog:{ module_key:string; name:string }; wama_module_user_assignments:{ profile_id:string; status:string }[] };
const empty = { fullName:"", email:"", role:"member", moduleKeys:[] as string[] };
const roleLabel = (value:string) => ({owner:"Propietario",admin:"Administrador",manager:"Jefatura / Aprobador",approver:"Jefatura / Aprobador",finance:"Finanzas / Tesorería",treasury:"Finanzas / Tesorería",member:"Colaborador",viewer:"Solo lectura"} as Record<string,string>)[value] || value;

export default function UsersPage() {
  const [users,setUsers] = useState<ApiUser[]>([]);
  const [licenses,setLicenses] = useState<License[]>([]);
  const [role,setRole] = useState("");
  const [open,setOpen] = useState(false);
  const [form,setForm] = useState(empty);
  const [message,setMessage] = useState("");
  const [loading,setLoading] = useState(false);

  async function token() { const { data } = await supabase.auth.getSession(); return data.session?.access_token || ""; }
  async function load() {
    setMessage("");
    const accessToken = await token();
    if (!accessToken) { setMessage("Error: Tu sesión no está activa. Vuelve a iniciar sesión."); return; }
    const response = await fetch("/api/enterprise/users", { headers:{ Authorization:`Bearer ${accessToken}` } });
    const data = await response.json();
    if (!response.ok) { setMessage(`Error: ${data.error || "No se pudo cargar el equipo."}`); return; }
    setUsers(data.users || []); setLicenses(data.licenses || []); setRole(data.currentRole || "");
  }
  useEffect(() => { void load(); }, []);

  async function invite(event:FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const accessToken = await token();
    const response = await fetch("/api/enterprise/users", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${accessToken}` }, body:JSON.stringify(form) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) { setMessage(`Error: ${data.error || "No se pudo invitar."}`); return; }
    setMessage(`Invitación enviada a ${data.email}.`); setForm(empty); setOpen(false); await load();
  }

  const canAdmin = ["owner","admin","super_admin"].includes(role.toLowerCase());
  return <EnterpriseShell title="Usuarios" subtitle="Administra tu equipo y asigna el acceso de cada persona por módulo.">
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-gradient-to-br from-white to-[#F0FBFA] p-6 shadow-[0_18px_50px_rgba(25,45,55,.07)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#008F87]">Equipo y licencias</p><h2 className="mt-2 text-2xl font-black">Personas con acceso a tu empresa</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69717D]">El propietario se registra automáticamente. Asignar una persona a ambos módulos consume una licencia en cada uno.</p></div>
          <button disabled={!canAdmin} onClick={() => setOpen(true)} className="cursor-pointer rounded-full bg-[#00E5D6] px-6 py-3.5 text-sm font-black text-black shadow-[0_10px_24px_rgba(0,229,214,.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">+ Invitar usuario</button>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Usuarios únicos" value={String(users.length)} detail="Personas asociadas a la empresa" />
        {licenses.map((license) => { const capacity=license.included_seats+license.extra_seat_blocks*license.extra_block_size; const used=(license.wama_module_user_assignments||[]).filter((a)=>a.status==="active").length; return <StatCard key={license.id} label={license.wama_module_catalog.name} value={`${used}/${capacity}`} detail={`${Math.max(0,capacity-used)} cupos disponibles`} />; })}
      </div>
      {message && <div className={`rounded-2xl p-4 text-sm font-bold ${message.startsWith("Error:") ? "bg-red-50 text-red-700" : "bg-[#DFFFFA] text-[#08645F]"}`}>{message}</div>}
      <SectionCard title="Equipo de la empresa" eyebrow="Accesos por módulo" action={null}>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-[#E8ECEF] text-xs uppercase text-[#69717D]"><th className="pb-4">Usuario</th><th className="pb-4">Rol</th><th className="pb-4">Estado</th><th className="pb-4">Módulos asignados</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-[#EEF1F3] last:border-0"><td className="py-5"><strong className="block">{user.wama_profiles?.full_name || "Usuario"}</strong><span className="text-[#69717D]">{user.wama_profiles?.email}</span></td><td><StatusPill>{roleLabel(user.role)}</StatusPill></td><td>{user.status === "invited" ? "Invitación pendiente" : "Activo"}</td><td><div className="flex flex-wrap gap-2">{user.module_keys?.length ? user.module_keys.map((key) => <StatusPill key={key}>{key === "sales" ? "Sales Hub" : key === "expense" ? "Expense Hub" : key}</StatusPill>) : <span className="text-[#69717D]">Sin módulo</span>}</div></td></tr>)}</tbody></table>{!users.length && !message && <p className="py-8 text-center text-[#69717D]">Cargando usuarios…</p>}</div>
        {!canAdmin && role && <p className="mt-4 text-sm font-bold text-[#69717D]">Solo el propietario o un administrador puede enviar invitaciones.</p>}
      </SectionCard>
    </div>
    {open && <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#102027]/45 p-4 backdrop-blur-sm"><form onSubmit={invite} className="my-5 w-full max-w-xl rounded-[2rem] bg-white p-7 shadow-2xl"><h2 className="text-2xl font-black">Invitar usuario</h2><p className="mt-2 text-sm text-[#69717D]">Selecciona uno o ambos módulos. Cada elección consume una licencia independiente.</p><div className="mt-6 grid gap-4"><input required value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} placeholder="Nombre completo" className="rounded-2xl bg-[#F5F8F9] p-4 outline-none ring-[#00BEB3] focus:ring-2"/><input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="correo@empresa.cl" className="rounded-2xl bg-[#F5F8F9] p-4 outline-none ring-[#00BEB3] focus:ring-2"/><select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})} className="cursor-pointer rounded-2xl bg-[#F5F8F9] p-4 outline-none"><option value="member">Colaborador</option><option value="approver">Jefatura / Aprobador</option><option value="finance">Finanzas / Tesorería</option><option value="admin">Administrador</option><option value="viewer">Solo lectura</option></select><div><p className="mb-2 text-sm font-black">Módulos</p><div className="grid gap-2">{licenses.map((license)=>{const key=license.wama_module_catalog.module_key;return <label key={license.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 transition ${form.moduleKeys.includes(key)?"bg-[#E6FFFC] shadow-[inset_0_0_0_2px_#00BEB3]":"bg-[#F5F8F9]"}`}><input type="checkbox" checked={form.moduleKeys.includes(key)} onChange={(e)=>setForm({...form,moduleKeys:e.target.checked?[...form.moduleKeys,key]:form.moduleKeys.filter((item)=>item!==key)})}/><span className="font-black">{license.wama_module_catalog.name}</span></label>})}</div></div></div><div className="mt-6 flex gap-3"><button type="button" onClick={()=>setOpen(false)} className="flex-1 cursor-pointer rounded-full bg-[#EEF2F4] px-5 py-3 font-black">Cancelar</button><button disabled={loading||form.moduleKeys.length===0} className="flex-1 cursor-pointer rounded-full bg-[#00E5D6] px-5 py-3 font-black shadow-[0_10px_24px_rgba(0,229,214,.22)] disabled:cursor-not-allowed disabled:opacity-50">{loading?"Enviando…":"Enviar invitación"}</button></div></form></div>}
  </EnterpriseShell>;
}
