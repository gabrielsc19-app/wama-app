"use client";

import { FormEvent, useEffect, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { SectionCard, StatCard, StatusPill } from "../../../src/components/enterprise/PortalUI";
import { supabase } from "../../lib/supabase";

type ModuleAssignment = { license_id:string; module_key:string; module_name:string; role:string; status:string };
type ApiUser = { id:string; role:string; status:string; profile_id:string; wama_profiles:{ id:string; full_name:string; email:string; status:string } | null; module_assignments:ModuleAssignment[] };
type License = { id:string; included_seats:number; extra_seat_blocks:number; extra_block_size:number; wama_module_catalog:{ module_key:string; name:string }; wama_module_user_assignments:{ profile_id:string; status:string; module_role:string }[] };
type InviteForm = { fullName:string; email:string; moduleRoles:Record<string,string> };

const empty:InviteForm = { fullName:"", email:"", moduleRoles:{} };
const roleOptions:Record<string,{value:string;label:string}[]> = {
  expense: [
    { value:"member", label:"Colaborador" },
    { value:"approver", label:"Jefatura / Aprobador" },
    { value:"finance", label:"Finanzas / Tesorería" },
    { value:"viewer", label:"Solo lectura" },
  ],
  sales: [
    { value:"sales_executive", label:"Ejecutivo comercial" },
    { value:"sales_manager", label:"Jefatura comercial" },
    { value:"sales_admin", label:"Administrador CRM" },
    { value:"viewer", label:"Solo lectura" },
  ],
};
const defaultRole = (key:string) => key === "sales" ? "sales_executive" : "member";
const optionsFor = (key:string) => roleOptions[key] || [{ value:"member", label:"Colaborador" },{ value:"viewer", label:"Solo lectura" }];
const roleLabel = (key:string,value:string) => optionsFor(key).find((option)=>option.value===value)?.label || value;

export default function UsersPage() {
  const [users,setUsers] = useState<ApiUser[]>([]);
  const [licenses,setLicenses] = useState<License[]>([]);
  const [role,setRole] = useState("");
  const [open,setOpen] = useState(false);
  const [form,setForm] = useState<InviteForm>(empty);
  const [message,setMessage] = useState("");
  const [loading,setLoading] = useState(false);
  const [savingKey,setSavingKey] = useState("");

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

  function toggleModule(moduleKey:string,checked:boolean) {
    setForm((current) => {
      const moduleRoles={...current.moduleRoles};
      if (checked) moduleRoles[moduleKey]=defaultRole(moduleKey); else delete moduleRoles[moduleKey];
      return {...current,moduleRoles};
    });
  }

  async function invite(event:FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const accessToken = await token();
    const response = await fetch("/api/enterprise/users", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${accessToken}` }, body:JSON.stringify(form) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) { setMessage(`Error: ${data.error || "No se pudo invitar."}`); return; }
    setMessage(`Invitación enviada a ${data.email}.`); setForm(empty); setOpen(false); await load();
  }

  async function updateModuleRole(profileId:string,moduleKey:string,moduleRole:string) {
    const key=`${profileId}:${moduleKey}`; setSavingKey(key); setMessage("");
    const accessToken=await token();
    const response=await fetch("/api/enterprise/users",{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${accessToken}`},body:JSON.stringify({profileId,moduleKey,moduleRole})});
    const data=await response.json(); setSavingKey("");
    if(!response.ok){setMessage(`Error: ${data.error||"No se pudo actualizar el perfil."}`);return;}
    setUsers((current)=>current.map((user)=>user.profile_id===profileId?{...user,module_assignments:user.module_assignments.map((assignment)=>assignment.module_key===moduleKey?{...assignment,role:moduleRole}:assignment)}:user));
    setMessage(`Perfil de ${data.moduleName} actualizado correctamente.`);
  }

  const canAdmin=["owner","admin","super_admin"].includes(role.toLowerCase());
  const selectedModules=Object.keys(form.moduleRoles);
  return <EnterpriseShell title="Usuarios" subtitle="Administra tu equipo y asigna un perfil diferente en cada módulo.">
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-gradient-to-br from-white to-[#F0FBFA] p-6 shadow-[0_18px_50px_rgba(25,45,55,.07)]"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#008F87]">Equipo y licencias</p><h2 className="mt-2 text-2xl font-black">Personas con acceso a tu empresa</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69717D]">Cada módulo consume una licencia y tiene su propio perfil. Una persona puede cumplir funciones diferentes en Expense Hub y W-Sales.</p></div><button disabled={!canAdmin} onClick={()=>setOpen(true)} className="cursor-pointer rounded-full bg-[#00E5D6] px-6 py-3.5 text-sm font-black text-black shadow-[0_10px_24px_rgba(0,229,214,.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">+ Invitar usuario</button></div></section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><StatCard label="Usuarios únicos" value={String(users.length)} detail="Personas asociadas a la empresa" />{licenses.map((license)=>{const capacity=license.included_seats+license.extra_seat_blocks*license.extra_block_size;const used=(license.wama_module_user_assignments||[]).filter((a)=>a.status==="active").length;return <StatCard key={license.id} label={license.wama_module_catalog.name} value={`${used}/${capacity}`} detail={`${Math.max(0,capacity-used)} cupos disponibles`} />;})}</div>
      {message&&<div className={`rounded-2xl p-4 text-sm font-bold ${message.startsWith("Error:")?"bg-red-50 text-red-700":"bg-[#DFFFFA] text-[#08645F]"}`}>{message}</div>}
      <SectionCard title="Equipo de la empresa" eyebrow="Roles independientes por módulo" action={null}>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-[#E8ECEF] text-xs uppercase text-[#69717D]"><th className="pb-4">Usuario</th><th className="pb-4">Estado</th>{licenses.map((license)=><th key={license.id} className="pb-4">{license.wama_module_catalog.name}</th>)}</tr></thead><tbody>{users.map((user)=><tr key={user.id} className="border-b border-[#EEF1F3] last:border-0"><td className="py-5"><strong className="block">{user.wama_profiles?.full_name||"Usuario"}</strong><span className="text-[#69717D]">{user.wama_profiles?.email}</span>{user.role==="owner"&&<span className="mt-1 block text-xs font-black text-[#008F87]">Propietario</span>}</td><td>{user.status==="invited"?"Invitación pendiente":"Activo"}</td>{licenses.map((license)=>{const moduleKey=license.wama_module_catalog.module_key;const assignment=user.module_assignments.find((item)=>item.module_key===moduleKey);const key=`${user.profile_id}:${moduleKey}`;return <td key={license.id} className="py-4 pr-4">{assignment?(user.role==="owner"?<StatusPill>Acceso total</StatusPill>:<select disabled={!canAdmin||savingKey===key} value={assignment.role} onChange={(event)=>void updateModuleRole(user.profile_id,moduleKey,event.target.value)} className="w-full min-w-[180px] cursor-pointer rounded-xl bg-[#F5F8F9] px-3 py-2.5 font-bold outline-none ring-[#00BEB3] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60">{optionsFor(moduleKey).map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select>):<span className="text-[#9AA2AA]">Sin acceso</span>}</td>;})}</tr>)}</tbody></table>{!users.length&&!message&&<p className="py-8 text-center text-[#69717D]">Cargando usuarios…</p>}</div>
        {!canAdmin&&role&&<p className="mt-4 text-sm font-bold text-[#69717D]">Solo el propietario o un administrador puede asignar perfiles.</p>}
      </SectionCard>
    </div>
    {open&&<div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#102027]/45 p-4 backdrop-blur-sm"><form onSubmit={invite} className="my-5 w-full max-w-xl rounded-[2rem] bg-white p-7 shadow-2xl"><h2 className="text-2xl font-black">Invitar usuario</h2><p className="mt-2 text-sm text-[#69717D]">Activa los módulos y elige el perfil que tendrá la persona dentro de cada uno.</p><div className="mt-6 grid gap-4"><input required value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} placeholder="Nombre completo" className="rounded-2xl bg-[#F5F8F9] p-4 outline-none ring-[#00BEB3] focus:ring-2"/><input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="correo@empresa.cl" className="rounded-2xl bg-[#F5F8F9] p-4 outline-none ring-[#00BEB3] focus:ring-2"/><div><p className="mb-2 text-sm font-black">Módulos y perfiles</p><div className="grid gap-3">{licenses.map((license)=>{const moduleKey=license.wama_module_catalog.module_key;const checked=moduleKey in form.moduleRoles;return <div key={license.id} className={`rounded-2xl p-4 transition ${checked?"bg-[#E6FFFC] shadow-[inset_0_0_0_2px_#00BEB3]":"bg-[#F5F8F9]"}`}><label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={checked} onChange={(e)=>toggleModule(moduleKey,e.target.checked)}/><span className="font-black">{license.wama_module_catalog.name}</span></label>{checked&&<select value={form.moduleRoles[moduleKey]} onChange={(e)=>setForm({...form,moduleRoles:{...form.moduleRoles,[moduleKey]:e.target.value}})} className="mt-3 w-full cursor-pointer rounded-xl border border-[#DDE8E7] bg-white p-3 font-bold outline-none">{optionsFor(moduleKey).map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select>}</div>;})}</div></div></div><div className="mt-6 flex gap-3"><button type="button" onClick={()=>setOpen(false)} className="flex-1 cursor-pointer rounded-full bg-[#EEF2F4] px-5 py-3 font-black">Cancelar</button><button disabled={loading||selectedModules.length===0} className="flex-1 cursor-pointer rounded-full bg-[#00E5D6] px-5 py-3 font-black shadow-[0_10px_24px_rgba(0,229,214,.22)] disabled:cursor-not-allowed disabled:opacity-50">{loading?"Enviando…":"Enviar invitación"}</button></div></form></div>}
  </EnterpriseShell>;
}
