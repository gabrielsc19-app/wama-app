"use client";

import { useEffect, useMemo, useState } from "react";
import WamaShell from "../../../src/components/brand/WamaShell";
import WamaCard from "../../../src/components/brand/WamaCard";
import {
  getMyLicensingSummary,
} from "../../../src/core/licensing/licensingService";
import type { LicensingSummaryRow } from "../../../src/core/licensing/types";

function formatUsd(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LicensingConfigurationPage() {
  const [licenses, setLicenses] = useState<LicensingSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const rows = await getMyLicensingSummary();
        if (mounted) setLicenses(rows);
      } catch (cause) {
        if (mounted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No fue posible cargar las licencias.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalMonthly = useMemo(
    () => licenses.reduce((total, item) => total + item.monthly_total_usd, 0),
    [licenses],
  );

  const totalAssignments = useMemo(
    () => licenses.reduce((total, item) => total + item.used_seats, 0),
    [licenses],
  );

  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10">
          <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Motor de licencias
          </div>

          <h1 className="text-5xl font-black tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
            Módulos y cupos de tu empresa.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#C4C7CC]">
            Cada módulo contratado incluye 10 usuarios. Una persona asignada a
            tres módulos consume un cupo independiente en cada uno.
          </p>
        </div>

        {loading ? (
          <WamaCard className="p-8 text-[#C4C7CC]">
            Cargando licencias...
          </WamaCard>
        ) : null}

        {error ? (
          <WamaCard className="border-red-400/30 p-8">
            <p className="font-semibold text-red-300">No pudimos cargar la información.</p>
            <p className="mt-2 text-sm text-[#C4C7CC]">{error}</p>
          </WamaCard>
        ) : null}

        {!loading && !error && licenses.length === 0 ? (
          <WamaCard className="p-8">
            <h2 className="text-2xl font-black text-[#F5F6F7]">
              Todavía no hay módulos activos.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#C4C7CC]">
              La empresa ya puede operar en el modelo multiempresa. El siguiente
              paso es activar el primer módulo desde Supabase o desde el panel
              administrativo de WAMA.
            </p>
          </WamaCard>
        ) : null}

        {!loading && !error && licenses.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              <Metric label="Módulos activos" value={String(licenses.length)} />
              <Metric label="Asignaciones consumidas" value={String(totalAssignments)} />
              <Metric label="Total mensual" value={formatUsd(totalMonthly)} />
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {licenses.map((license) => {
                const usage = license.seat_capacity
                  ? Math.round((license.used_seats / license.seat_capacity) * 100)
                  : 0;

                return (
                  <WamaCard key={license.license_id} className="p-6">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#00E5D6]">
                          {license.tenant_name} · {license.tenant_code}
                        </p>
                        <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                          {license.module_name}
                        </h2>
                      </div>

                      <span className="rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                        {license.license_status}
                      </span>
                    </div>

                    <div className="mt-7 grid grid-cols-3 gap-3">
                      <SmallMetric label="Usados" value={license.used_seats} />
                      <SmallMetric label="Disponibles" value={license.available_seats} />
                      <SmallMetric label="Capacidad" value={license.seat_capacity} />
                    </div>

                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#00E5D6]"
                        style={{ width: `${Math.min(usage, 100)}%` }}
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-[#C4C7CC]">Uso del módulo: {usage}%</span>
                      <strong className="text-[#F5F6F7]">
                        {formatUsd(license.monthly_total_usd)} / mes
                      </strong>
                    </div>
                  </WamaCard>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
    </WamaShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <WamaCard className="p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#00E5D6]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-[#F5F6F7]">{value}</p>
    </WamaCard>
  );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-[#C4C7CC]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#F5F6F7]">{value}</p>
    </div>
  );
}
