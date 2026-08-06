"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, CalendarClock, CheckCircle2, CircleDollarSign, KeyRound, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";

type License = {
  id: string; status: string; includedSeats: number; extraSeatBlocks: number; extraBlockSize: number;
  capacity: number; unitPriceUsd: number; extraBlockPriceUsd: number; monthlyTotalUsd: number;
  startsAt: string | null; renewsAt: string | null; moduleKey?: string; moduleName?: string;
};

type Tenant = {
  id: string; name: string; code?: string | null; status: string; billing_status: string;
  billing_period: string; trial_ends_at?: string | null; paid_until?: string | null;
  suspended_at?: string | null; suspension_reason?: string | null; created_at: string;
  userCount: number; licenses: License[];
};

type Filter = "all" | "trial" | "paid" | "expiring" | "expired";

const badge: Record<string, string> = {
  trial: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  active: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  paid: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  pending: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  past_due: "border-red-300/30 bg-red-300/10 text-red-100",
  suspended: "border-red-300/30 bg-red-300/10 text-red-100",
  cancelled: "border-white/15 bg-white/5 text-white/60",
};

const usd = new Intl.NumberFormat("es-CL", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" });

function daysUntil(value?: string | null) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

function tenantExpiry(tenant: Tenant) {
  const dates = tenant.licenses.map((license) => license.renewsAt).filter(Boolean) as string[];
  if (!dates.length && tenant.trial_ends_at) dates.push(tenant.trial_ends_at);
  if (!dates.length && tenant.paid_until) dates.push(tenant.paid_until);
  return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] || null;
}

function monthlyRevenue(tenant: Tenant) {
  return tenant.licenses
    .filter((license) => license.status === "active")
    .reduce((sum, license) => sum + license.monthlyTotalUsd, 0);
}

export default function WamaControlCenter() {
  const [secret, setSecret] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [paymentDates, setPaymentDates] = useState<Record<string, string>>({});

  useEffect(() => { setSecret(sessionStorage.getItem("wamaOwnerSecret") || ""); }, []);

  const load = useCallback(async (value = secret) => {
    if (!value) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/platform/tenants", { headers: { "x-wama-owner-secret": value }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar las empresas.");
      setTenants(data.tenants || []);
      sessionStorage.setItem("wamaOwnerSecret", value);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Error inesperado."); }
    finally { setLoading(false); }
  }, [secret]);

  async function action(tenantId: string, body: Record<string, unknown>) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/platform/tenants", {
        method: "PATCH", headers: { "Content-Type": "application/json", "x-wama-owner-secret": secret },
        body: JSON.stringify({ tenantId, ...body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo aplicar el cambio.");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Error inesperado."); setLoading(false); }
  }

  const stats = useMemo(() => {
    const licenses = tenants.flatMap((tenant) => tenant.licenses);
    return {
      companies: tenants.length,
      monthly: tenants.reduce((sum, tenant) => sum + monthlyRevenue(tenant), 0),
      trials: licenses.filter((license) => license.status === "trial").length,
      expiring: licenses.filter((license) => { const days = daysUntil(license.renewsAt); return days !== null && days >= 0 && days <= 7; }).length,
      expired: licenses.filter((license) => { const days = daysUntil(license.renewsAt); return days !== null && days < 0 && license.status !== "cancelled"; }).length,
      users: tenants.reduce((sum, tenant) => sum + tenant.userCount, 0),
    };
  }, [tenants]);

  const filtered = useMemo(() => tenants.filter((tenant) => {
    const matchesSearch = `${tenant.name} ${tenant.code || ""}`.toLowerCase().includes(query.trim().toLowerCase());
    const expiryDays = daysUntil(tenantExpiry(tenant));
    const matchesFilter = filter === "all"
      || (filter === "trial" && tenant.licenses.some((license) => license.status === "trial"))
      || (filter === "paid" && tenant.billing_status === "paid")
      || (filter === "expiring" && expiryDays !== null && expiryDays >= 0 && expiryDays <= 7)
      || (filter === "expired" && expiryDays !== null && expiryDays < 0);
    return matchesSearch && matchesFilter;
  }), [tenants, query, filter]);

  return <main className="min-h-screen bg-[#080A0C] px-4 py-8 text-white sm:px-7">
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/" className="text-sm font-black tracking-[.18em] text-[#00E5D6]">WAMA</Link>
          <p className="mt-5 text-xs font-black uppercase tracking-[.24em] text-[#00E5D6]">Perfil interno WAMA</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-6xl">Control comercial</h1>
          <p className="mt-4 max-w-3xl leading-7 text-[#AEB6BF]">Vista global de empresas, módulos contratados, facturación estimada y vencimientos. No muestra la información operativa privada de los clientes.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="Clave interna WAMA" className="min-w-72 rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 outline-none focus:border-[#00E5D6]"/>
          <button onClick={() => load()} disabled={loading || !secret} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00E5D6] px-5 py-3 font-black text-[#071011] disabled:opacity-50"><KeyRound size={18}/>{loading ? "Cargando…" : "Ingresar"}</button>
        </div>
      </header>

      {error && <p className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-red-100">{error}</p>}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Stat icon={<Building2/>} label="Empresas" value={String(stats.companies)}/>
        <Stat icon={<CircleDollarSign/>} label="Facturación mensual" value={usd.format(stats.monthly)} highlight/>
        <Stat icon={<ShieldCheck/>} label="Módulos en prueba" value={String(stats.trials)}/>
        <Stat icon={<CalendarClock/>} label="Vencen en 7 días" value={String(stats.expiring)} warning={stats.expiring > 0}/>
        <Stat icon={<AlertTriangle/>} label="Vencidos" value={String(stats.expired)} danger={stats.expired > 0}/>
        <Stat icon={<Users/>} label="Usuarios" value={String(stats.users)}/>
      </section>

      <section className="mt-7 rounded-[2rem] border border-white/10 bg-white/[.035] p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div><h2 className="text-2xl font-black">Empresas y suscripciones</h2><p className="mt-1 text-sm text-[#98A1AC]">Los montos corresponden a módulos activos y bloques adicionales.</p></div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-wrap gap-2">{(["all", "trial", "paid", "expiring", "expired"] as Filter[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl border px-3 py-2 text-xs font-black ${filter === item ? "border-[#00E5D6] bg-[#00E5D6] text-[#071011]" : "border-white/10 text-white/70"}`}>{({ all: "Todas", trial: "Pruebas", paid: "Pagadas", expiring: "Por vencer", expired: "Vencidas" } as Record<Filter, string>)[item]}</button>)}</div>
            <div className="flex gap-2"><label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111519] px-3"><Search size={16} className="text-white/50"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresa" className="bg-transparent py-2 outline-none"/></label><button onClick={() => load()} aria-label="Actualizar" className="rounded-xl border border-white/10 p-3"><RefreshCw size={17}/></button></div>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {filtered.map((tenant) => {
            const expiry = tenantExpiry(tenant); const remaining = daysUntil(expiry); const revenue = monthlyRevenue(tenant);
            const paymentDate = paymentDates[tenant.id] || new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
            return <article key={tenant.id} className="rounded-[1.6rem] border border-white/10 bg-[#0D1115] p-5">
              <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black">{tenant.name}</h3><Status value={tenant.status}/><Status value={tenant.billing_status}/></div>
                  <p className="mt-2 text-sm text-[#8F99A5]">{tenant.code || tenant.id.slice(0, 8)} · {tenant.userCount} usuarios · creada {date.format(new Date(tenant.created_at))}</p>
                  <div className="mt-4 flex flex-wrap gap-3"><Metric label="Ingreso mensual" value={usd.format(revenue)}/><Metric label="Módulos" value={String(tenant.licenses.length)}/><Metric label="Próximo vencimiento" value={expiry ? date.format(new Date(expiry)) : "Sin fecha"} tone={remaining !== null && remaining < 0 ? "danger" : remaining !== null && remaining <= 7 ? "warning" : "normal"}/></div>
                  {remaining !== null && <p className={`mt-3 text-sm font-bold ${remaining < 0 ? "text-red-200" : remaining <= 7 ? "text-amber-200" : "text-[#8F99A5]"}`}>{remaining < 0 ? `Vencido hace ${Math.abs(remaining)} día(s)` : `Faltan ${remaining} día(s)`}</p>}
                  {tenant.suspension_reason && <p className="mt-2 text-sm text-red-200">Motivo: {tenant.suspension_reason}</p>}
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <input type="date" value={paymentDate} onChange={(event) => setPaymentDates((current) => ({ ...current, [tenant.id]: event.target.value }))} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"/>
                  <button onClick={() => action(tenant.id, { action: "mark_paid", paidUntil: new Date(`${paymentDate}T23:59:59`).toISOString() })} className="rounded-xl bg-[#00E5D6] px-4 py-2 text-sm font-black text-[#081012]">Registrar pago</button>
                  <button onClick={() => action(tenant.id, { action: "suspend_tenant", reason: "Suscripción pendiente de pago" })} className="rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-2 text-sm font-bold text-red-100">Suspender</button>
                </div>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{tenant.licenses.map((license) => {
                const licenseDays = daysUntil(license.renewsAt);
                return <div key={license.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-black">{license.moduleName || license.moduleKey}</p><p className="mt-1 text-xs text-[#8F99A5]">{license.capacity} usuarios · {license.extraSeatBlocks} bloques extra</p></div><Status value={license.status}/></div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div><p className="text-xs text-white/45">Valor mensual</p><p className="mt-1 font-black">{usd.format(license.monthlyTotalUsd)}</p></div><div><p className="text-xs text-white/45">Vencimiento</p><p className={`mt-1 font-black ${licenseDays !== null && licenseDays < 0 ? "text-red-200" : licenseDays !== null && licenseDays <= 7 ? "text-amber-200" : ""}`}>{license.renewsAt ? date.format(new Date(license.renewsAt)) : "Sin fecha"}</p></div></div>
                  <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => action(tenant.id, { action: "update_license", licenseId: license.id, licenseStatus: "active" })} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs font-bold text-emerald-100">Activar</button><button onClick={() => action(tenant.id, { action: "update_license", licenseId: license.id, licenseStatus: "suspended" })} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Desactivar</button><button onClick={() => action(tenant.id, { action: "update_license", licenseId: license.id, extraSeatBlocks: license.extraSeatBlocks + 1 })} className="rounded-lg border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-2 text-xs font-black text-[#8EFFF6]">+10 usuarios</button></div>
                </div>;
              })}</div>
            </article>;
          })}
          {!loading && secret && filtered.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-[#8F99A5]">No hay empresas que coincidan con el filtro.</p>}
        </div>
      </section>
    </div>
  </main>;
}

function Status({ value }: { value: string }) { return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${badge[value] || badge.cancelled}`}>{value.replaceAll("_", " ")}</span>; }
function Metric({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "warning" | "danger" }) { return <div className={`min-w-36 rounded-xl border p-3 ${tone === "danger" ? "border-red-300/20 bg-red-300/5" : tone === "warning" ? "border-amber-300/20 bg-amber-300/5" : "border-white/10 bg-white/[.025]"}`}><p className="text-[11px] uppercase tracking-wide text-white/45">{label}</p><p className="mt-1 font-black">{value}</p></div>; }
function Stat({ icon, label, value, highlight, warning, danger }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean; warning?: boolean; danger?: boolean }) { const tone = danger ? "border-red-300/25 bg-red-300/[.07] text-red-100" : warning ? "border-amber-300/25 bg-amber-300/[.07] text-amber-100" : highlight ? "border-[#00E5D6]/30 bg-[#00E5D6]/[.08] text-[#9AFFF8]" : "border-white/10 bg-white/[.04]"; return <div className={`rounded-3xl border p-5 ${tone}`}><div className={danger || warning || highlight ? "" : "text-[#00E5D6]"}>{icon}</div><p className="mt-5 text-2xl font-black">{value}</p><p className="mt-1 text-sm opacity-70">{label}</p></div>; }
