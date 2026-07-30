"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, CircleDollarSign, KeyRound, RefreshCw, ShieldCheck, Users } from "lucide-react";

type License = { id: string; status: string; includedSeats: number; extraSeatBlocks: number; extraBlockSize: number; capacity: number; renewsAt: string | null; moduleKey?: string; moduleName?: string };
type Tenant = { id: string; name: string; code?: string | null; status: string; billing_status: string; billing_period: string; trial_ends_at?: string | null; paid_until?: string | null; suspended_at?: string | null; suspension_reason?: string | null; created_at: string; userCount: number; licenses: License[] };

const badge: Record<string, string> = {
  trial: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  active: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  paid: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  past_due: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  suspended: "border-red-300/30 bg-red-300/10 text-red-100",
  cancelled: "border-white/15 bg-white/5 text-white/60",
};

function dateInputValue(days = 30) {
  const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10);
}

export default function WamaControlCenter() {
  const [secret, setSecret] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [paidUntil, setPaidUntil] = useState(dateInputValue());

  useEffect(() => { setSecret(sessionStorage.getItem("wamaOwnerSecret") || ""); }, []);

  const load = useCallback(async (value = secret) => {
    if (!value) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/platform/tenants", { headers: { "x-wama-owner-secret": value }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar las empresas.");
      setTenants(data.tenants || []); sessionStorage.setItem("wamaOwnerSecret", value);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Error inesperado."); }
    finally { setLoading(false); }
  }, [secret]);

  async function action(tenantId: string, body: Record<string, unknown>) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/platform/tenants", { method: "PATCH", headers: { "Content-Type": "application/json", "x-wama-owner-secret": secret }, body: JSON.stringify({ tenantId, ...body }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo aplicar el cambio.");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Error inesperado."); setLoading(false); }
  }

  const filtered = tenants.filter((tenant) => `${tenant.name} ${tenant.code || ""}`.toLowerCase().includes(query.toLowerCase()));
  const stats = useMemo(() => ({
    companies: tenants.length,
    active: tenants.filter((tenant) => ["active", "trial"].includes(tenant.status)).length,
    paid: tenants.filter((tenant) => tenant.billing_status === "paid").length,
    users: tenants.reduce((sum, tenant) => sum + tenant.userCount, 0),
  }), [tenants]);

  return <main className="min-h-screen bg-[#080A0C] px-4 py-8 text-white sm:px-7">
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div><Link href="/" className="text-sm font-black text-[#00E5D6]">WAMA</Link><p className="mt-5 text-xs font-black uppercase tracking-[.24em] text-[#00E5D6]">Administración del SaaS</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-6xl">Centro de Control</h1><p className="mt-4 max-w-3xl leading-7 text-[#AEB6BF]">Activa o suspende empresas y módulos según su pago. El cliente administra sus usuarios, proyectos y operación; WAMA mantiene el control comercial y de acceso.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row"><input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Clave de propietario" className="min-w-72 rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 outline-none focus:border-[#00E5D6]"/><button onClick={() => load()} disabled={loading || !secret} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00E5D6] px-5 py-3 font-black text-[#071011] disabled:opacity-50"><KeyRound size={18}/>{loading ? "Cargando…" : "Ingresar"}</button></div>
      </header>

      {error && <p className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-red-100">{error}</p>}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Building2/>} label="Empresas" value={stats.companies}/><Stat icon={<ShieldCheck/>} label="Activas / trial" value={stats.active}/><Stat icon={<CircleDollarSign/>} label="Pagadas" value={stats.paid}/><Stat icon={<Users/>} label="Usuarios" value={stats.users}/>
      </section>

      <section className="mt-7 rounded-[2rem] border border-white/10 bg-white/[.035] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">Empresas y licencias</h2><p className="mt-1 text-sm text-[#98A1AC]">Control central de pago, acceso y capacidad por módulo.</p></div><div className="flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar empresa" className="rounded-xl border border-white/10 bg-[#111519] px-4 py-2 outline-none focus:border-[#00E5D6]"/><button onClick={() => load()} className="rounded-xl border border-white/10 p-3"><RefreshCw size={17}/></button></div></div>
        <div className="mt-5 grid gap-4">
          {filtered.map((tenant) => <article key={tenant.id} className="rounded-[1.6rem] border border-white/10 bg-[#0D1115] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black">{tenant.name}</h3><Status value={tenant.status}/><Status value={tenant.billing_status}/></div><p className="mt-2 text-sm text-[#8F99A5]">{tenant.code || tenant.id.slice(0, 8)} · {tenant.userCount} usuarios · creada {new Date(tenant.created_at).toLocaleDateString("es-CL")}</p>{tenant.suspension_reason && <p className="mt-2 text-sm text-red-200">Motivo: {tenant.suspension_reason}</p>}</div>
              <div className="flex flex-wrap gap-2"><input type="date" value={paidUntil} onChange={(e) => setPaidUntil(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"/><button onClick={() => action(tenant.id, { action: "mark_paid", paidUntil: new Date(`${paidUntil}T23:59:59`).toISOString() })} className="rounded-xl bg-[#00E5D6] px-4 py-2 text-sm font-black text-[#081012]">Registrar pago</button><button onClick={() => action(tenant.id, { action: "activate_tenant" })} className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100">Activar</button><button onClick={() => action(tenant.id, { action: "suspend_tenant", reason: "Suscripción pendiente de pago" })} className="rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-2 text-sm font-bold text-red-100">Suspender</button></div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{tenant.licenses.map((license) => <div key={license.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black">{license.moduleName || license.moduleKey}</p><p className="mt-1 text-xs text-[#8F99A5]">Capacidad: {license.capacity} usuarios</p></div><Status value={license.status}/></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => action(tenant.id, { action: "update_license", licenseId: license.id, licenseStatus: "active" })} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Activar módulo</button><button onClick={() => action(tenant.id, { action: "update_license", licenseId: license.id, licenseStatus: "suspended" })} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Desactivar</button><button onClick={() => action(tenant.id, { action: "update_license", licenseId: license.id, extraSeatBlocks: license.extraSeatBlocks + 1 })} className="rounded-lg border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-2 text-xs font-black text-[#8EFFF6]">+10 usuarios</button></div></div>)}</div>
          </article>)}
          {!loading && secret && filtered.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-[#8F99A5]">No hay empresas para mostrar.</p>}
        </div>
      </section>
    </div>
  </main>;
}

function Status({ value }: { value: string }) { return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${badge[value] || badge.cancelled}`}>{value.replace("_", " ")}</span>; }
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-3xl border border-white/10 bg-white/[.04] p-5"><div className="text-[#00E5D6]">{icon}</div><p className="mt-5 text-3xl font-black">{value}</p><p className="mt-1 text-sm text-[#98A1AC]">{label}</p></div>; }
