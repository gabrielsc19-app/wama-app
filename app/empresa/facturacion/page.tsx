"use client";

import { useEffect, useMemo, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { SectionCard, StatCard, StatusPill } from "../../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../../src/core/portal/portalData";

const moduleLabel = (key: string, name: string) =>
  key === "sales" ? "Sales Hub" :
  key === "expense" ? "Expense Hub" :
  key === "operations" ? "Operations Hub" : name;

const stateLabel = (status: string, days: number) =>
  status === "trial" ? (days > 0 ? "Trial activo" : "Trial finalizado") :
  status === "active" ? "Activo" :
  status === "pending" ? "Pendiente" :
  status === "suspended" ? "Suspendido" : status;

const basePrice = 10;
const extraBlockPrice = 10;

export default function BillingPage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);
  useEffect(() => { void loadEnterprisePortalData().then(setData); }, []);

  const projectedTotal = useMemo(
    () => data?.licenses.reduce((sum, l) => {
      const extraBlocks = Math.max(0, Math.ceil((Math.max(l.seat_capacity, 10) - 10) / 10));
      return sum + basePrice + extraBlocks * extraBlockPrice;
    }, 0) ?? 0,
    [data]
  );

  const billedTotal = useMemo(
    () => data?.licenses.reduce((sum, l) => {
      if (l.license_status !== "active") return sum;
      const extraBlocks = Math.max(0, Math.ceil((Math.max(l.seat_capacity, 10) - 10) / 10));
      return sum + basePrice + extraBlocks * extraBlockPrice;
    }, 0) ?? 0,
    [data]
  );

  const expired = data?.licenses.some(l => l.license_status === "trial" && l.trial_days_remaining <= 0) ?? false;

  return (
    <EnterpriseShell title="Facturación" subtitle="Resumen comercial de tus módulos WAMA, pruebas activas y contratación mensual.">
      {!data ? <div className="h-64 animate-pulse rounded-3xl bg-white" /> : <div className="space-y-7">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Módulos habilitados" value={String(data.licenses.length)} detail="Cada módulo se administra por separado" />
          <StatCard label="Precio al contratar" value={`US$ ${projectedTotal}`} detail="US$10/mes por módulo · incluye hasta 10 usuarios" />
          <StatCard
            label="Actualmente facturado"
            value={`US$ ${billedTotal}`}
            detail={expired ? "Hay pruebas finalizadas pendientes de activación" : "Los módulos en trial no generan cobro"}
          />
        </div>

        <SectionCard title="Detalle por módulo" eyebrow="Precios WAMA">
          <div className="divide-y divide-[#E4E8EC]">
            {data.licenses.length ? data.licenses.map(l => {
              const extraBlocks = Math.max(0, Math.ceil((Math.max(l.seat_capacity, 10) - 10) / 10));
              const modulePrice = basePrice + extraBlocks * extraBlockPrice;
              const isBilled = l.license_status === "active";

              return (
                <div key={l.license_id} className="grid gap-4 py-5 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <strong className="text-lg">{moduleLabel(l.module_key, l.module_name)}</strong>
                      <StatusPill>{stateLabel(l.license_status, l.trial_days_remaining)}</StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-[#69717D]">
                      {l.used_seats}/{l.seat_capacity} usuarios asignados ·{" "}
                      {l.license_status === "trial"
                        ? (l.trial_days_remaining > 0 ? `${l.trial_days_remaining} días restantes` : "periodo de prueba finalizado")
                        : l.renews_at ? `Vigencia hasta ${new Date(l.renews_at).toLocaleDateString("es-CL")}` : "Sin fecha de renovación"}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-bold uppercase text-[#69717D]">{isBilled ? "Facturación mensual" : "Precio al contratar"}</p>
                    <strong className="text-xl">US$ {modulePrice}</strong>
                    <p className="mt-1 text-xs text-[#69717D]">
                      Incluye hasta 10 usuarios{extraBlocks > 0 ? ` + ${extraBlocks} bloque(s) adicional(es)` : ""}
                    </p>
                  </div>
                </div>
              );
            }) : <p className="py-8 text-center text-[#69717D]">Aún no hay módulos habilitados.</p>}

            <div className="grid gap-2 pt-6 text-lg font-black sm:grid-cols-[1fr_auto]">
              <span>Precio mensual si contratas todos los módulos habilitados</span>
              <span>US$ {projectedTotal}</span>
            </div>
            <div className="grid gap-2 pt-3 text-sm font-bold text-[#59616B] sm:grid-cols-[1fr_auto]">
              <span>Facturación mensual actual</span>
              <span>US$ {billedTotal}</span>
            </div>
          </div>
        </SectionCard>

        <p className="text-center text-xs leading-6 text-[#69717D]">
          Durante los 15 días de prueba no se realiza ningún cobro. Cada módulo cuesta US$10 al mes e incluye hasta 10 usuarios.
        </p>
      </div>}
    </EnterpriseShell>
  );
}
