"use client";
import { useEffect, useMemo, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { SectionCard, StatCard, StatusPill } from "../../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../../src/core/portal/portalData";

const moduleLabel = (key: string, fallback: string) => key === "sales" ? "Sales Hub" : key === "expense" ? "Expense Hub" : key === "operations" ? "Operations Hub" : fallback;
const statusLabel = (status: string, days: number) => status === "trial" ? (days > 0 ? `${days} días de prueba` : "Prueba finalizada") : status === "active" ? "Activo" : status === "pending" ? "Pendiente" : status === "suspended" ? "Suspendido" : status;

export default function LicensesPage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);
  useEffect(() => { void loadEnterprisePortalData().then(setData); }, []);
  const monthly = useMemo(() => data?.licenses.reduce((sum, license) => sum + Number(license.monthly_total_usd || 0), 0) ?? 0, [data]);

  return <EnterpriseShell title="Licencias" subtitle="Cada módulo se contrata en bloques de 10 usuarios. El valor comercial es US$10 por usuario al mes.">
    {!data ? <p>Cargando...</p> : <div className="space-y-7">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Módulos activos" value={`${data.licenses.length}`} />
        <StatCard label="Licencias asignadas" value={`${data.licenses.reduce((sum, license) => sum + license.used_seats, 0)}`} detail="El owner ocupa una licencia por módulo" />
        <StatCard label="Valor mensual contratado" value={`US$ ${monthly}`} detail="Se cobra al terminar el trial" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {data.licenses.map((license) => {
          const usage = license.seat_capacity > 0 ? Math.round(license.used_seats / license.seat_capacity * 100) : 0;
          return <SectionCard key={license.module_key} title={moduleLabel(license.module_key, license.module_name)} eyebrow="Licencia independiente" action={<StatusPill>{statusLabel(license.license_status, license.trial_days_remaining)}</StatusPill>}>
            <div className="grid grid-cols-3 gap-3"><Mini label="Asignadas" value={license.used_seats}/><Mini label="Disponibles" value={license.available_seats}/><Mini label="Contratadas" value={license.seat_capacity}/></div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#E8ECEF]"><div className="h-full bg-[#00B8AE]" style={{width:`${Math.min(usage,100)}%`}}/></div>
            <div className="mt-4 flex items-center justify-between gap-4 text-sm"><span className="text-[#69717D]">Uso: {usage}%</span><strong>{license.license_status === "trial" ? (license.trial_days_remaining > 0 ? `Vence en ${license.trial_days_remaining} días` : "Trial vencido") : `US$ ${license.monthly_total_usd}/mes`}</strong></div>
            <div className="mt-6 rounded-2xl bg-[#F5F6F7] p-4 text-sm leading-6 text-[#59616B]"><strong className="text-[#0B0C0E]">US$10 por usuario/mes.</strong> El bloque base incluye 10 licencias. Para ampliar capacidad se agregan bloques de 10 usuarios.</div>
          </SectionCard>
        })}
      </div>

      <SectionCard title="Modelo de licencias" eyebrow="Regla WAMA"><p className="max-w-4xl text-sm leading-7 text-[#59616B]">Las licencias son independientes por módulo. Una persona asignada a Sales Hub, Expense Hub y Operations Hub consume una licencia en cada módulo. Cada módulo parte con un bloque de 10 usuarios (US$100/mes después de la prueba). Los bloques adicionales agregan 10 usuarios por US$100/mes.</p></SectionCard>
    </div>}
  </EnterpriseShell>
}
function Mini({label,value}:{label:string;value:number}){return <div className="rounded-2xl bg-[#F5F6F7] p-4"><p className="text-xs font-bold text-[#69717D]">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>}
