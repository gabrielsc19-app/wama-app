"use client";
import { useEffect, useMemo, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { SectionCard, StatCard, StatusPill } from "../../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../../src/core/portal/portalData";

export default function LicensesPage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);
  useEffect(() => { void loadEnterprisePortalData().then(setData); }, []);
  const monthly = useMemo(() => data?.licenses.reduce((s,l)=>s+l.monthly_total_usd,0) ?? 0,[data]);
  return <EnterpriseShell title="Licencias" subtitle="Capacidad y consumo por módulo. Cada usuario consume una licencia en cada módulo asignado.">
    {!data ? <p>Cargando...</p> : <div className="space-y-7">
      <div className="grid gap-4 md:grid-cols-3"><StatCard label="Módulos" value={`${data.licenses.length}`} /><StatCard label="Licencias usadas" value={`${data.licenses.reduce((s,l)=>s+l.used_seats,0)}`} /><StatCard label="Total mensual" value={`US$ ${monthly}`} detail="Valor de referencia configurable" /></div>
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{data.licenses.map((l)=>{const usage=Math.round(l.used_seats/l.seat_capacity*100); const moduleName=l.module_key==="expense"?"Expense Hub":l.module_key==="sales"?"Sales Hub":l.module_name; return <SectionCard key={l.module_key} title={moduleName} eyebrow="Licencias del módulo" action={<StatusPill>{l.license_status === "trial" ? "Prueba activa" : l.license_status}</StatusPill>}><div className="grid grid-cols-3 gap-3"><Mini label="Usadas" value={l.used_seats}/><Mini label="Libres" value={l.available_seats}/><Mini label="Total" value={l.seat_capacity}/></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-[#E8ECEF]"><div className="h-full bg-[#00B8AE]" style={{width:`${Math.min(usage,100)}%`}}/></div><div className="mt-4 flex items-center justify-between text-sm"><span className="text-[#69717D]">{l.used_seats} de {l.seat_capacity} usuarios</span><strong>{l.available_seats} cupos disponibles</strong></div><button className="mt-6 w-full rounded-full border border-[#0B0C0E] bg-[#0B0C0E] px-5 py-3 text-sm font-black text-white">Comprar bloque de 10</button></SectionCard>})}</div>
      <SectionCard title="Regla de consumo" eyebrow="Modelo WAMA"><p className="max-w-4xl text-sm leading-7 text-[#59616B]">Las licencias son independientes por módulo. Una persona asignada a Expense Hub, Sales Hub y Operations Hub consume tres licencias: una en cada módulo. Los cupos adicionales se adquieren en bloques de 10.</p></SectionCard>
    </div>}
  </EnterpriseShell>
}
function Mini({label,value}:{label:string;value:number}){return <div className="rounded-2xl bg-[#F5F6F7] p-4"><p className="text-xs font-bold text-[#69717D]">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>}
