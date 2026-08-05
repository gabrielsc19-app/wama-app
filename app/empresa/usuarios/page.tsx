"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { SectionCard, StatCard, StatusPill } from "../../../src/components/enterprise/PortalUI";
import { supabase } from "../../lib/supabase";

type ModuleAssignment = { license_id:string; module_key:string; module_name:string; role:string; status:string };
type ApiUser = { id:string; role:string; status:string; profile_id:string; wama_profiles:{ id:string; full_name:string; email:string; status:string } | null; module_assignments?:ModuleAssignment[] };
type License = { id:string; included_seats:number; extra_seat_blocks:number; extra_block_size:number; wama_module_catalog:{ module_key:string; name:string }; wama_module_user_assignments:{ profile_id:string; status:string }[] };
type AccessForm = { fullName:string; email:string; moduleRoles:Record<string,string> };

const emptyForm:AccessForm = { fullName:"", email:"", moduleRoles:{} };
const moduleRoleOptions:Record<string,{value:string;label:string}[]> = {
  expense:[{value:"member",label:"Colaborador"},{value:"approver",label:"Jefatura / Aprobador"},{value:"finance",label:"Finanzas / Tesorería"},{value:"viewer",label:"Solo lectura"}],
  sales:[{value:"sales_executive",label:"Ejecutivo comercial"},{value:"sales_manager",label:"Jefatura comercial"},{value:"sales_admin",label:"Administrador comercial"},{value:"viewer",label:"Solo lectura"}],
};
const tenantRoleLabel = (value:string) => ({owner:"Propietario",admin:"Administrador",super_admin:"Administrador",member:"Colaborador"} as Record<string,string>)[value] || value;
const moduleRoleLabel = (value:string) => ({member:"Colaborador",approver:"Jefatura / Aprobador",finance:"Finanzas / Tesorería",viewer:"Solo lectura",sales_executive:"Ejecutivo comercial",sales_manager:"Jefatura comercial",sales_admin:"Administrador comercial",module_admin:"Administrador del módulo"} as Record<string,string>)[value] || value;

export default function UsersPage() {
  const [users,setUsers] = useState<ApiUser[]>([]);
  const [licenses,setLicenses] = useState<License[]>([]);
  const [role,setRole] = useState("");
  const [inviteOpen,setInviteOpen] = useState(false);
  const [editUser,setEditUser] = useState<ApiUser|null>(null);
  const [form,setForm] = useState<AccessForm>(emptyForm);
  const [editRoles,setEditRoles] = useState<Record<string,string>>({});
  const [message,setMessage] = useState("");
  const [loading,setLoading] = useState(false);
  const [resendingId,setResendingId] = useState<string|null>(null);

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
    setMessage(`Invitación enviada a ${data.email}.`); setForm(emptyForm); setInviteOpen(false); await load();
  }

  function beginEdit(user:ApiUser) {
    const roles = Object.fromEntries((user.module_assignments || []).filter((item)=>item.status==="active").map((item)=>[item.module_key,item.role]));
    setEditRoles(roles); setEditUser(user); setMessage("");
  }

  async function saveAccess(event:FormEvent) {
    event.preventDefault();
    if (!editUser) return;
    setLoading(true); setMessage("");
    const accessToken = await token();
    const response = await fetch("/api/enterprise/users", { method:"PUT", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${accessToken}` }, body:JSON.stringify({profileId:editUser.profile_id,moduleRoles:editRoles}) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) { setMessage(`Error: ${data.error || "No se pudo actualizar el acceso."}`); return; }
    setEditUser(null); setMessage("Accesos actualizados correctamente."); await load();
  }

  async function resend(user:ApiUser) {
    setResendingId(user.profile_id); setMessage("");
    const accessToken = await token();
    const response = await fetch("/api/enterprise/users", { method:"PATCH", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${accessToken}` }, body:JSON.stringify({profileId:user.profile_id}) });
    const data = await response.json(); setResendingId(null);
    if (!response.ok) { setMessage(`Error: ${data.error || "No se pudo reenviar la invitación."}`); return; }
    setMessage(`Invitación reenviada a ${data.email}.`);
  }

  const canAdmin = ["owner","admin","super_admin"].includes(role.toLowerCase());
  const licenseByKey = useMemo(()=>Object.fromEntries(licenses.map((license)=>[license.wama_module_catalog.module_key,license])),[licenses]);

  function ModuleSelector({values,onChange}:{values:Record<string,string>;onChange:(next:Record<string,string>)=>void}) {
    return <div className="grid gap-3">{licenses.map((license)=>{
      const key=license.wama_module_catalog.module_key;
      const enabled=Boolean(values[key]);
      const options=moduleRoleOptions[key] || [{value:"member",label:"Colaborador"},{value:"viewer",label:"Solo lectura"}];
      return <div key={license.id} className={`rounded-2xl p-4 transition ${enabled?"bg-[#E6FFFC] shadow-[inset_0_0_0_2px_#00BEB3]":"bg-[#F5F8F9]"}`}>
        <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={enabled} onChange={(event)=>{const next={...values};if(event.target.checked) next[key]=options[0].value;else delete next[key];onChange(next);}}/><span className="font-black">{license.wama_module_catalog.name}</span></label>
        {enabled && <select value={values[key]} onChange={(event)=>onChange({...values,[key]:event.target.value})} className="mt-3 w-full cursor-pointer rounded-xl bg-white p-3 text-sm font-bold outline-none ring-[#00BEB3] focus:ring-2">{options.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select>}
      </div>;
    })}</div>;
  }

  return <EnterpriseShell title="Usuarios" subtitle="Administra tu equipo y asigna el acceso de cada persona por módulo.">
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-gradient-to-br from-white to-[#F0FBFA] p-6 shadow-[0_18px_50px_rgba(25,45,55,.07)]"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#008F87]">Equipo y licencias</p><h2 className="mt-2 text-2xl font-black">Personas con acceso a tu empresa</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#69717D]">El propietario se registra automáticamente. Una persona asignada a dos módulos utiliza un cupo en cada uno.</p></div><button disabled={!canAdmin} onClick={()=>{setForm(emptyForm);setInviteOpen(true);}} className="cursor-pointer rounded-full bg-[#00E5D6] px-6 py-3.5 text-sm font-black text-black shadow-[0_10px_24px_rgba(0,229,214,.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">+ Invitar usuario</button></div></section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><StatCard label="Usuarios únicos" value={String(users.length)} detail="Personas asociadas a la empresa" />{licenses.map((license)=>{const capacity=license.included_seats+license.extra_seat_blocks*license.extra_block_size;const used=(license.wama_module_user_assignments||[]).filter((a)=>a.status==="active").length;return <StatCard key={license.id} label={license.wama_module_catalog.name} value={`${used}/${capacity}`} detail={`${Math.max(0,capacity-used)} cupos disponibles`} />;})}</div>
      {message && <div className={`rounded-2xl p-4 text-sm font-bold ${message.startsWith("Error:")?"bg-red-50 text-red-700":"bg-[#DFFFFA] text-[#08645F]"}`}>{message}</div>}
      <SectionCard title="Equipo de la empresa" eyebrow="Accesos por módulo" action={null}>
        <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead><tr className="border-b border-[#E8ECEF] text-xs uppercase text-[#69717D]"><th className="pb-4">Usuario</th><th className="pb-4">Rol empresa</th><th className="pb-4">Estado</th><th className="pb-4">Módulos asignados</th><th className="pb-4 text-right">Acciones</th></tr></thead><tbody>{users.map((user)=>{
          const assignments=(user.module_assignments||[]).filter((item)=>item.status==="active");
          return <tr key={user.id} className="border-b border-[#EEF1F3] align-top last:border-0"><td className="py-5"><strong className="block">{user.wama_profiles?.full_name||"Usuario"}</strong><span className="text-[#69717D]">{user.wama_profiles?.email}</span></td><td className="py-5"><StatusPill>{tenantRoleLabel(user.role)}</StatusPill></td><td className="py-5">{user.status==="invited"?"Invitación pendiente":"Activo"}</td><td className="py-5"><div className="flex flex-wrap gap-2">{assignments.length?assignments.map((assignment)=><StatusPill key={assignment.license_id}>{assignment.module_name || licenseByKey[assignment.module_key]?.wama_module_catalog.name || assignment.module_key}: {moduleRoleLabel(assignment.role)}</StatusPill>):<span className="text-[#69717D]">Sin módulo</span>}</div></td><td className="py-5"><div className="flex justify-end gap-2">{canAdmin&&user.role!=="owner"&&<button onClick={()=>beginEdit(user)} className="cursor-pointer whitespace-nowrap rounded-full bg-[#EEF2F4] px-4 py-2 text-xs font-black hover:bg-[#E3E8EB]">Editar acceso</button>}{canAdmin&&user.status==="invited"&&<button disabled={resendingId===user.profile_id} onClick={()=>void resend(user)} className="cursor-pointer whitespace-nowrap rounded-full bg-[#00E5D6] px-4 py-2 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-50">{resendingId===user.profile_id?"Reenviando…":"Reenviar invitación"}</button>}</div></td></tr>;
        })}</tbody></table>{!users.length&&!message&&<p className="py-8 text-center text-[#69717D]">Cargando usuarios…</p>}</div>
        {!canAdmin&&role&&<p className="mt-4 text-sm font-bold text-[#69717D]">Solo el propietario o un administrador puede gestionar accesos e invitaciones.</p>}
      </SectionCard>
    </div>

    {inviteOpen&&<div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#102027]/45 p-4 backdrop-blur-sm"><form onSubmit={invite} className="my-5 w-full max-w-xl rounded-[2rem] bg-white p-7 shadow-2xl"><h2 className="text-2xl font-black">Invitar usuario</h2><p className="mt-2 text-sm text-[#69717D]">Selecciona los módulos y el perfil que tendrá en cada uno.</p><div className="mt-6 grid gap-4"><input required value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} placeholder="Nombre completo" className="rounded-2xl bg-[#F5F8F9] p-4 outline-none ring-[#00BEB3] focus:ring-2"/><input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="correo@empresa.cl" className="rounded-2xl bg-[#F5F8F9] p-4 outline-none ring-[#00BEB3] focus:ring-2"/><div><p className="mb-2 text-sm font-black">Módulos y perfiles</p><ModuleSelector values={form.moduleRoles} onChange={(moduleRoles)=>setForm({...form,moduleRoles})}/></div></div><div className="mt-6 flex gap-3"><button type="button" onClick={()=>setInviteOpen(false)} className="flex-1 cursor-pointer rounded-full bg-[#EEF2F4] px-5 py-3 font-black">Cancelar</button><button disabled={loading||Object.keys(form.moduleRoles).length===0} className="flex-1 cursor-pointer rounded-full bg-[#00E5D6] px-5 py-3 font-black shadow-[0_10px_24px_rgba(0,229,214,.22)] disabled:cursor-not-allowed disabled:opacity-50">{loading?"Enviando…":"Enviar invitación"}</button></div></form></div>}

    {editUser&&<div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#102027]/45 p-4 backdrop-blur-sm"><form onSubmit={saveAccess} className="my-5 w-full max-w-xl rounded-[2rem] bg-white p-7 shadow-2xl"><h2 className="text-2xl font-black">Editar acceso</h2><p className="mt-2 text-sm text-[#69717D]">{editUser.wama_profiles?.full_name} · {editUser.wama_profiles?.email}</p><div className="mt-6"><ModuleSelector values={editRoles} onChange={setEditRoles}/></div><div className="mt-6 flex gap-3"><button type="button" onClick={()=>setEditUser(null)} className="flex-1 cursor-pointer rounded-full bg-[#EEF2F4] px-5 py-3 font-black">Cancelar</button><button disabled={loading||Object.keys(editRoles).length===0} className="flex-1 cursor-pointer rounded-full bg-[#00E5D6] px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-50">{loading?"Guardando…":"Guardar cambios"}</button></div></form></div>}
  </EnterpriseShell>;
}
