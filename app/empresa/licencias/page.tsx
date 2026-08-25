"use client";

import { useEffect, useMemo, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { SectionCard, StatCard, StatusPill } from "../../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../../src/core/portal/portalData";

const moduleLabel = (key: string, fallback: string) =>
  key === "sales" ? "Sales Hub" :
  key === "expense" ? "Expense Hub" :
  key === "operations" ? "Operations Hub" : fallback;

const statusLabel = (status: string, days: number) =>
  status === "trial" ? (days > 0 ? `${days} días de prueba` : "Prueba finalizada") :
  status === "active" ? "Activo" :
  status === "pending" ? "Pendiente" :
  status === "suspended" ? "Suspendido" : status;

const basePrice = 10;
const extraBlockPrice = 10;

export default function LicensesPage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);
  useEffect(() => { void loadEnterprisePortalData().then(setData); }, []);

  const projectedMonthly = useMemo(
    () => data?.licenses.reduce((sum, license) => {
      const extraBlocks = Math.max(0, Math.ceil((Math.max(license.seat_capacity, 10) - 10) / 10));
      return sum + basePrice + extraBlocks * extraBlockPrice;
    }, 0) ?? 0,
    [data]
  );

  return (
    <EnterpriseShell title="Licencias" subtitle="Cada módulo WAMA incluye hasta 10 usuarios. Amplía capacidad en bloques adicionales de 10.">
      {!data ? <p>Cargando...</p> : <div className="space-y-7">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Módulos habilitados" value={`${data.licenses.length}`} />
          <StatCard label="Usuarios asignados" value={`${data.licenses.reduce((sum, license) => sum + license.used_seats, 0)}`} detail="El owner ocupa un cupo en cada módulo que utiliza" />
          <StatCard label="Precio al contratar" value={`US$ ${projectedMonthly}`} detail="US$10/mes por módulo · hasta 10 usuarios incluidos" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {data.licenses.map((license) => {
            const usage = license.seat_capacity > 0 ? Math.round(license.used_seats / license.seat_capacity * 100) : 0;
            const extraBlocks = Math.max(0, Math.ceil((Math.max(license.seat_capacity, 10) - 10) / 10));
            const modulePrice = basePrice + extraBlocks * extraBlockPrice;

            return (
              <SectionCard
                key={license.module_key}
                title={moduleLabel(license.module_key, license.module_name)}
                eyebrow="Licencia independiente"
                action={<StatusPill>{statusLabel(license.license_status, license.trial_days_remaining)}</StatusPill>}
              >
                <div className="grid grid-cols-3 gap-3">
                  <Mini label="Asignados" value={license.used_seats} />
                  <Mini label="Disponibles" value={license.available_seats} />
                  <Mini label="Capacidad" value={license.seat_capacity} />
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#E8ECEF]">
                  <div className="h-full bg-[#00B8AE]" style={{ width: `${Math.min(usage, 100)}%` }} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#69717D]">Uso: {usage}%</span>
                  <strong>
                    {license.license_status === "trial"
                      ? (license.trial_days_remaining > 0 ? `Vence en ${license.trial_days_remaining} días` : "Trial vencido")
                      : `US$ ${modulePrice}/mes`}
                  </strong>
                </div>

                <div className="mt-6 rounded-2xl bg-[#F5F6F7] p-4 text-sm leading-6 text-[#59616B]">
                  <strong className="text-[#0B0C0E]">US$10/mes por módulo.</strong> Incluye hasta 10 usuarios.
                  {extraBlocks > 0 ? ` Esta licencia tiene ${extraBlocks} bloque(s) adicional(es) de 10 usuarios.` : " Si necesitas más capacidad, puedes agregar bloques de 10 usuarios."}
                </div>
              </SectionCard>
            );
          })}
        </div>

        <SectionCard title="Modelo de licencias" eyebrow="Regla WAMA">
          <p className="max-w-4xl text-sm leading-7 text-[#59616B]">
            Sales Hub, Expense Hub y Operations Hub se contratan de forma independiente. Cada módulo cuesta US$10 al mes e incluye hasta 10 usuarios. Una persona puede utilizar uno o varios módulos según los accesos que le asigne el owner. Si un módulo necesita más de 10 usuarios, la capacidad se amplía en bloques adicionales de 10 usuarios por US$10 al mes cada bloque.
          </p>
        </SectionCard>
      </div>}
    </EnterpriseShell>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-[#F5F6F7] p-4"><p className="text-xs font-bold text-[#69717D]">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}
