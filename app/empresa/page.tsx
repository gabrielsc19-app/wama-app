"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, Package2, Users } from "lucide-react";
import EnterpriseShell from "../../src/components/enterprise/EnterpriseShell";
import { StatCard, StatusPill } from "../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../src/core/portal/portalData";

export default function CompanyHomePage() {
  const [data,setData]=useState<EnterprisePortalData|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{void loadEnterprisePortalData().then(setData).catch(e=>setError(e instanceof Error?e.message:"No fue posible cargar el portal."))},[]);
  const used=useMemo(()=>data?.licenses.reduce((n,l)=>n+l.used_seats,0)||0,[data]);
  const capacity=useMemo(()=>data?.licenses.reduce((n,l)=>n+l.seat_capacity,0)||0,[data]);
  if(error)return <EnterpriseShell title="Inicio" subtitle="Resumen ejecutivo de tu empresa."><Notice text={error}/></EnterpriseShell>;
  if(!data)return <EnterpriseShell title="Inicio" subtitle="Resumen ejecutivo de tu empresa."><div className="h-64 animate-pulse rounded-[2rem] bg-white"/></EnterpriseShell>;
  return <EnterpriseShell title="Inicio" subtitle="Resumen ejecutivo y accesos rápidos. Cada sección del portal tiene una función propia.">
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[2rem] bg-[#0B0C0E] p-7 text-white sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-5"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white p-2 text-3xl font-black text-black sm:h-36 sm:w-36">{data.tenant.logoUrl?<img src={data.tenant.logoUrl} alt={`Logo de ${data.tenant.name}`} className="h-full w-full object-contain"/>:data.tenant.name.slice(0,2).toUpperCase()}</div><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">Resumen de hoy</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">{data.tenant.name}</h2><p className="mt-2 text-sm text-[#B8C0C8]">Tus módulos y licencias están centralizados en un solo portal.</p></div></div><StatusPill>{data.tenant.status==="trial"?"Empresa en prueba":"Empresa activa"}</StatusPill></div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><StatCard label="Módulos activos" value={String(data.licenses.length)} detail="Contratación independiente"/><StatCard label="Licencias utilizadas" value={`${used}/${capacity}`} detail={`${Math.max(0,capacity-used)} cupos disponibles`}/><StatCard label="Estado general" value="Operativo" detail="Sin bloqueos críticos"/></div>
      <div className="grid gap-4 md:grid-cols-3"><Quick href="/empresa/modulos" icon={<Package2/>} title="Entrar a módulos" text="Abre Sales Hub o Expense Hub y revisa su estado."/><Quick href="/empresa/usuarios" icon={<Users/>} title="Administrar usuarios" text="Invita personas y asígnalas a uno o ambos módulos."/><Quick href="/empresa/ia" icon={<Bot/>} title="WAMA AI · Beta" text="Asistencia empresarial en desarrollo."/></div>
      <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">Atención</p><h3 className="mt-1 text-xl font-black">Estado de tus módulos</h3></div><Link href="/empresa/modulos" className="font-black text-[#008F87]">Ver todos</Link></div><div className="mt-5 grid gap-3 md:grid-cols-2">{data.licenses.map(l=><div key={l.license_id} className="rounded-2xl bg-[#F5F7F8] p-5"><div className="flex justify-between gap-3"><strong>{l.module_name}</strong><StatusPill>{l.license_status==="trial"?`${l.trial_days_remaining} días`:l.license_status}</StatusPill></div><p className="mt-2 text-sm text-[#69717D]">{l.used_seats}/{l.seat_capacity} licencias utilizadas</p></div>)}</div></section>
    </div>
  </EnterpriseShell>;
}
function Quick({href,icon,title,text}:{href:string;icon:React.ReactNode;title:string;text:string}){return <Link href={href} className="group rounded-3xl border border-[#DCE1E6] bg-white p-6 transition hover:-translate-y-1 hover:border-[#00B8AE]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DFFFFA] text-[#008F87]">{icon}</span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#69717D]">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#008F87]">Abrir <ArrowRight className="h-4 w-4"/></span></Link>}
function Notice({text}:{text:string}){return <div className="rounded-3xl border border-red-200 bg-white p-7 text-red-700">{text}</div>}
