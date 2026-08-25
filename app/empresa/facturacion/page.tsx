"use client";
import {useEffect,useMemo,useState} from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import {SectionCard,StatCard,StatusPill} from "../../../src/components/enterprise/PortalUI";
import {loadEnterprisePortalData,type EnterprisePortalData} from "../../../src/core/portal/portalData";

const moduleLabel=(key:string,name:string)=>key==="sales"?"Sales Hub":key==="expense"?"Expense Hub":key==="operations"?"Operations Hub":name;
const stateLabel=(status:string,days:number)=>status==="trial"?(days>0?"Trial activo":"Trial finalizado"):status==="active"?"Activo":status==="pending"?"Pendiente":status==="suspended"?"Suspendido":status;

export default function BillingPage(){
  const[data,setData]=useState<EnterprisePortalData|null>(null);
  useEffect(()=>{void loadEnterprisePortalData().then(setData)},[]);
  const total=useMemo(()=>data?.licenses.reduce((n,l)=>n+Number(l.monthly_total_usd||0),0)||0,[data]);
  const expired=data?.licenses.some(l=>l.license_status==="trial"&&l.trial_days_remaining<=0)??false;
  return <EnterpriseShell title="Facturación" subtitle="Resumen comercial de los módulos activos y del valor mensual contratado.">
    {!data?<div className="h-64 animate-pulse rounded-3xl bg-white"/>:<div className="space-y-7">
      <div className="grid gap-4 md:grid-cols-3"><StatCard label="Módulos activos" value={String(data.licenses.length)} detail="Cada módulo se administra por separado"/><StatCard label="Valor mensual contratado" value={`US$ ${total}`} detail="US$10 por usuario · bloques de 10"/><StatCard label="Estado" value={expired?"Requiere activación":data.licenses.some(l=>l.license_status==="pending")?"Pago pendiente":"Al día"} detail={expired?"Hay un trial finalizado":"Revisa cada módulo abajo"}/></div>
      <SectionCard title="Detalle por módulo" eyebrow="Precios reales WAMA"><div className="divide-y divide-[#E4E8EC]">{data.licenses.length?data.licenses.map(l=><div key={l.license_id} className="grid gap-4 py-5 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-3"><strong className="text-lg">{moduleLabel(l.module_key,l.module_name)}</strong><StatusPill>{stateLabel(l.license_status,l.trial_days_remaining)}</StatusPill></div><p className="mt-2 text-sm text-[#69717D]">{l.used_seats}/{l.seat_capacity} licencias asignadas · {l.license_status==="trial"?(l.trial_days_remaining>0?`${l.trial_days_remaining} días restantes`:"periodo de prueba finalizado"):l.renews_at?`Vigencia hasta ${new Date(l.renews_at).toLocaleDateString("es-CL")}`:"Sin fecha de renovación"}</p></div><div className="sm:text-right"><p className="text-xs font-bold uppercase text-[#69717D]">Valor mensual</p><strong className="text-xl">US$ {Number(l.monthly_total_usd||0)}</strong><p className="mt-1 text-xs text-[#69717D]">US$10 × {l.seat_capacity} licencias</p></div></div>):<p className="py-8 text-center text-[#69717D]">Aún no hay módulos activados.</p>}<div className="flex items-center justify-between gap-4 pt-6 text-lg font-black"><span>Total mensual contratado</span><span>US$ {total}</span></div></div></SectionCard>
      <p className="text-center text-xs leading-6 text-[#69717D]">Durante los 15 días de prueba no se realiza ningún cobro. La contratación formal se habilita al finalizar el trial de cada módulo.</p>
    </div>}
  </EnterpriseShell>
}
