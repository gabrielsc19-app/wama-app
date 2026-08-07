"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  CircleDollarSign,
  KeyRound,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

type License = {
  id: string;
  status: string;
  includedSeats: number;
  extraSeatBlocks: number;
  extraBlockSize: number;
  capacity: number;
  renewsAt: string | null;
  moduleKey?: string;
  moduleName?: string;
  monthlyTotalUsd: number;
};
type Payment = {
  id: string;
  amountUsd: number;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
};
type Tenant = {
  id: string;
  name: string;
  code?: string | null;
  status: string;
  billing_status: string;
  trial_ends_at?: string | null;
  paid_until?: string | null;
  suspension_reason?: string | null;
  created_at: string;
  userCount: number;
  licenses: License[];
  payments: Payment[];
};
type Filter = "all" | "trial" | "paid" | "due" | "expired";

const badge: Record<string, string> = {
  trial: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  active: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  paid: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  past_due: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  suspended: "border-red-300/30 bg-red-300/10 text-red-100",
  cancelled: "border-white/15 bg-white/5 text-white/60",
};
const labels: Record<string, string> = {
  trial: "Prueba",
  active: "Activo",
  paid: "Pagado",
  past_due: "Pago vencido",
  suspended: "Suspendido",
  cancelled: "Cancelado",
};
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const extendTrialDate = (current?: string | null) => {
  const now = new Date();
  const currentDate = current ? new Date(current) : now;
  const base = currentDate.getTime() > now.getTime() ? currentDate : now;
  base.setDate(base.getDate() + 15);
  return base.toISOString();
};
const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("es-CL") : "—";
const expires = (t: Tenant) =>
  t.paid_until ||
  t.trial_ends_at ||
  t.licenses.map((l) => l.renewsAt).find(Boolean) ||
  null;
const daysUntil = (value: string | null) =>
  value ? Math.ceil((new Date(value).getTime() - Date.now()) / 86400000) : null;

export default function WamaControlCenter() {
  const [secret, setSecret] = useState("");
  const [connected, setConnected] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [paymentTenant, setPaymentTenant] = useState<Tenant | null>(null);
  useEffect(() => {
    const saved = sessionStorage.getItem("wamaOwnerSecret") || "";
    setSecret(saved);
    if (saved) void load(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const load = useCallback(
    async (value = secret) => {
      if (!value) return;
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/platform/tenants", {
          headers: { "x-wama-owner-secret": value },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "No se pudieron cargar las empresas.");
        setTenants(data.tenants || []);
        setConnected(true);
        sessionStorage.setItem("wamaOwnerSecret", value);
      } catch (e) {
        setConnected(false);
        setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    },
    [secret],
  );
  async function action(
    tenantId: string,
    body: Record<string, unknown>,
    message: string,
  ): Promise<boolean> {
    if (!connected) {
      setError("Primero ingresa con la clave interna WAMA.");
      return false;
    }
    setBusy(`${tenantId}:${String(body.action)}`);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/platform/tenants", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wama-owner-secret": secret,
        },
        body: JSON.stringify({ tenantId, ...body }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "No se pudo aplicar el cambio.");
      setNotice(message);
      await load(secret);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
      return false;
    } finally {
      setBusy("");
    }
  }
  function logout() {
    sessionStorage.removeItem("wamaOwnerSecret");
    setSecret("");
    setConnected(false);
    setTenants([]);
    setNotice("Sesión interna cerrada.");
  }
  const filtered = useMemo(
    () =>
      tenants.filter((t) => {
        const d = daysUntil(expires(t));
        const matches = `${t.name} ${t.code || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const f =
          filter === "all" ||
          (filter === "trial" && t.status === "trial") ||
          (filter === "paid" && t.billing_status === "paid") ||
          (filter === "due" && d !== null && d >= 0 && d <= 7) ||
          (filter === "expired" &&
            ((d !== null && d < 0) ||
              ["past_due", "suspended"].includes(t.billing_status)));
        return matches && f;
      }),
    [tenants, query, filter],
  );
  const monthly = tenants.reduce(
    (sum, t) =>
      sum +
      t.licenses
        .filter((l) => l.status === "active" && t.billing_status === "paid")
        .reduce((n, l) => n + l.monthlyTotalUsd, 0),
    0,
  );
  const stats = {
    companies: tenants.length,
    trials: tenants.filter((t) => t.status === "trial").length,
    due: tenants.filter((t) => {
      const d = daysUntil(expires(t));
      return d !== null && d >= 0 && d <= 7;
    }).length,
    expired: tenants.filter((t) => {
      const d = daysUntil(expires(t));
      return d !== null && d < 0;
    }).length,
    users: tenants.reduce((s, t) => s + t.userCount, 0),
  };
  return (
    <main className="min-h-screen bg-[#080A0C] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-black text-[#00E5D6]">
              WAMA
            </Link>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[.22em] text-[#00E5D6]">
              Perfil interno WAMA
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-[-.05em] sm:text-5xl">
              Control comercial
            </h1>
            <p className="mt-2 text-sm text-[#AEB6BF]">
              Empresas, facturación estimada, vencimientos y licencias.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {connected && (
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100">
                ● Sesión activa
              </span>
            )}
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Clave interna WAMA"
              className="min-w-64 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 outline-none focus:border-[#00E5D6]"
            />
            <button
              onClick={() => load()}
              disabled={loading || !secret}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00E5D6] px-5 py-3 font-black text-[#071011] disabled:opacity-50"
            >
              <KeyRound size={17} />
              {loading ? "Cargando…" : connected ? "Actualizar" : "Ingresar"}
            </button>
            {connected && (
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="rounded-xl border border-white/10 p-3"
              >
                <LogOut size={17} />
              </button>
            )}
          </div>
        </header>
        {error && (
          <p className="mt-4 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            ✓ {notice}
          </p>
        )}
        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat icon={<Building2 />} label="Empresas" value={stats.companies} />
          <Stat
            icon={<CircleDollarSign />}
            label="Facturación mensual"
            value={`US$${monthly}`}
          />
          <Stat icon={<ShieldCheck />} label="En prueba" value={stats.trials} />
          <Stat
            icon={<RefreshCw />}
            label="Vencen en 7 días"
            value={stats.due}
          />
          <Stat icon={<ShieldCheck />} label="Vencidas" value={stats.expired} />
          <Stat icon={<Users />} label="Usuarios" value={stats.users} />
        </section>
        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-3 sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black">Empresas y suscripciones</h2>
              <p className="text-xs text-[#98A1AC]">
                Expense Hub US$20 · demás módulos US$10 · 10 usuarios incluidos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "Todas"],
                  ["trial", "Pruebas"],
                  ["paid", "Pagadas"],
                  ["due", "Por vencer"],
                  ["expired", "Vencidas"],
                ] as [Filter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-xl px-3 py-2 text-xs font-black ${filter === key ? "bg-[#00E5D6] text-black" : "border border-white/10"}`}
                >
                  {label}
                </button>
              ))}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar empresa"
                className="min-w-52 rounded-xl border border-white/10 bg-[#111519] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-[#8F99A5]">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3">Empresa</th>
                  <th>Estado</th>
                  <th>Módulos</th>
                  <th>Usuarios</th>
                  <th>Ingreso</th>
                  <th>Vencimiento</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const tenantMonthly = t.licenses
                    .filter(
                      (l) =>
                        l.status === "active" && t.billing_status === "paid",
                    )
                    .reduce((n, l) => n + l.monthlyTotalUsd, 0);
                  const due = expires(t);
                  const rowBusy = busy.startsWith(`${t.id}:`);
                  const isTrial =
                    t.status === "trial" || t.billing_status === "trial";
                  return (
                    <>
                      <tr
                        key={t.id}
                        className="border-b border-white/10 hover:bg-white/[.025]"
                      >
                        <td className="px-3 py-3">
                          <strong className="block">{t.name}</strong>
                          <span className="text-xs text-[#8F99A5]">
                            {t.code || t.id.slice(0, 8)}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <Status value={t.status} />
                            <Status value={t.billing_status} />
                          </div>
                        </td>
                        <td>{t.licenses.length}</td>
                        <td>{t.userCount}</td>
                        <td className="font-black">US${tenantMonthly}</td>
                        <td>{date(due)}</td>
                        <td>
                          <div className="flex justify-end gap-2">
                            {isTrial && (
                              <button
                                disabled={rowBusy}
                                onClick={() =>
                                  action(
                                    t.id,
                                    {
                                      action: "extend_trial",
                                      trialEndsAt: extendTrialDate(
                                        t.trial_ends_at,
                                      ),
                                    },
                                    `${t.name}: prueba extendida por 15 días.`,
                                  )
                                }
                                className="rounded-lg border border-[#00E5D6]/35 px-3 py-2 text-xs font-black text-[#8EFFF6] disabled:opacity-50"
                              >
                                +15 días de prueba
                              </button>
                            )}
                            <button
                              disabled={rowBusy}
                              onClick={() => setPaymentTenant(t)}
                              className="rounded-lg bg-[#00E5D6] px-3 py-2 text-xs font-black text-black disabled:opacity-50"
                            >
                              Registrar pago
                            </button>
                            <button
                              onClick={() =>
                                setOpen(open === t.id ? null : t.id)
                              }
                              className="rounded-lg border border-white/10 p-2"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {open === t.id && (
                        <tr key={`${t.id}-detail`}>
                          <td colSpan={7} className="bg-[#0A0E11] p-4">
                            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                              {t.licenses.map((l) => (
                                <div
                                  key={l.id}
                                  className="rounded-xl border border-white/10 p-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <strong>
                                        {l.moduleName || l.moduleKey}
                                      </strong>
                                      <p className="text-xs text-[#8F99A5]">
                                        {l.capacity} usuarios · US$
                                        {l.monthlyTotalUsd}/mes
                                      </p>
                                    </div>
                                    <Status value={l.status} />
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      disabled={rowBusy}
                                      onClick={() =>
                                        action(
                                          t.id,
                                          {
                                            action: "update_license",
                                            licenseId: l.id,
                                            licenseStatus: "active",
                                          },
                                          `${l.moduleName}: módulo activado.`,
                                        )
                                      }
                                      className="rounded-lg border border-emerald-300/25 px-3 py-2 text-xs font-bold text-emerald-100"
                                    >
                                      Activar
                                    </button>
                                    <button
                                      disabled={rowBusy}
                                      onClick={() =>
                                        action(
                                          t.id,
                                          {
                                            action: "update_license",
                                            licenseId: l.id,
                                            licenseStatus: "suspended",
                                          },
                                          `${l.moduleName}: módulo suspendido.`,
                                        )
                                      }
                                      className="rounded-lg border border-red-300/25 px-3 py-2 text-xs font-bold text-red-100"
                                    >
                                      Suspender
                                    </button>
                                    <button
                                      disabled={rowBusy}
                                      onClick={() =>
                                        action(
                                          t.id,
                                          {
                                            action: "update_license",
                                            licenseId: l.id,
                                            extraSeatBlocks:
                                              l.extraSeatBlocks + 1,
                                          },
                                          `${l.moduleName}: bloque de 10 usuarios agregado.`,
                                        )
                                      }
                                      className="rounded-lg border border-[#00E5D6]/30 px-3 py-2 text-xs font-black text-[#8EFFF6]"
                                    >
                                      +10 usuarios
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <div className="flex items-center gap-2 rounded-xl border border-white/10 p-3">
                                <button
                                  disabled={rowBusy}
                                  onClick={() =>
                                    action(
                                      t.id,
                                      { action: "activate_tenant" },
                                      `${t.name}: empresa activada.`,
                                    )
                                  }
                                  className="flex-1 rounded-lg bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                >
                                  Activar acceso
                                </button>
                                <button
                                  disabled={rowBusy}
                                  onClick={() =>
                                    action(
                                      t.id,
                                      {
                                        action: "suspend_tenant",
                                        reason: "Suscripción pendiente de pago",
                                      },
                                      `${t.name}: empresa suspendida.`,
                                    )
                                  }
                                  className="flex-1 rounded-lg bg-red-300/10 px-3 py-2 text-xs font-bold text-red-100"
                                >
                                  Suspender empresa
                                </button>
                              </div>
                              <div className="rounded-xl border border-white/10 p-3 lg:col-span-2 xl:col-span-3">
                                <strong>Historial de pagos</strong>
                                {t.payments.length ? (
                                  <div className="mt-3 overflow-x-auto">
                                    <table className="w-full min-w-[720px] text-xs">
                                      <thead className="text-[#8F99A5]">
                                        <tr>
                                          <th className="py-2">Pago</th>
                                          <th>Monto</th>
                                          <th>Periodo</th>
                                          <th>Medio</th>
                                          <th>Referencia</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {t.payments.map((payment) => (
                                          <tr
                                            key={payment.id}
                                            className="border-t border-white/10"
                                          >
                                            <td className="py-2">
                                              {date(payment.paidAt)}
                                            </td>
                                            <td className="font-black">
                                              US${payment.amountUsd}
                                            </td>
                                            <td>
                                              {date(payment.periodStart)} al{" "}
                                              {date(payment.periodEnd)}
                                            </td>
                                            <td>{payment.paymentMethod}</td>
                                            <td>{payment.reference || "—"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-[#8F99A5]">
                                    Aún no hay pagos registrados.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            {connected && !loading && !filtered.length && (
              <p className="p-10 text-center text-[#8F99A5]">
                No hay empresas con este filtro.
              </p>
            )}
            {!connected && (
              <p className="p-10 text-center text-[#8F99A5]">
                Ingresa con la clave interna para cargar y administrar las
                empresas.
              </p>
            )}
          </div>
        </section>
        {paymentTenant && (
          <PaymentDialog
            tenant={paymentTenant}
            busy={busy.startsWith(`${paymentTenant.id}:`)}
            onClose={() => setPaymentTenant(null)}
            onSave={async (body) => {
              const saved = await action(
                paymentTenant.id,
                { action: "mark_paid", ...body },
                `${paymentTenant.name}: pago registrado correctamente.`,
              );
              if (saved) setPaymentTenant(null);
              return saved;
            }}
          />
        )}
      </div>
    </main>
  );
}
function Status({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${badge[value] || badge.cancelled}`}
    >
      {labels[value] || value}
    </span>
  );
}
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <div className="text-[#00E5D6] [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-xs text-[#98A1AC]">{label}</p>
    </div>
  );
}

function PaymentDialog({
  tenant,
  busy,
  onClose,
  onSave,
}: {
  tenant: Tenant;
  busy: boolean;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const amount = tenant.licenses.reduce((sum, l) => sum + l.monthlyTotalUsd, 0);
  const start = today();
  const end = plusDays(30);
  const [form, setForm] = useState({
    amountUsd: String(amount),
    paidAt: today(),
    periodStart: start,
    periodEnd: end,
    paymentMethod: "Transferencia bancaria",
    reference: "",
    notes: "",
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave({
            ...form,
            amountUsd: Number(form.amountUsd),
            paidUntil: new Date(`${form.periodEnd}T23:59:59`).toISOString(),
          });
        }}
        className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#111519] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#00E5D6]">
              Registrar pago real
            </p>
            <h3 className="mt-2 text-2xl font-black">{tenant.name}</h3>
            <p className="mt-1 text-sm text-[#9DA6B1]">
              Solo al guardar este formulario la empresa cambiará a Pagado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Monto recibido (USD)">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.amountUsd}
              onChange={(e) => setForm({ ...form, amountUsd: e.target.value })}
            />
          </Field>
          <Field label="Fecha del pago">
            <input
              required
              type="date"
              value={form.paidAt}
              onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
            />
          </Field>
          <Field label="Periodo desde">
            <input
              required
              type="date"
              value={form.periodStart}
              onChange={(e) =>
                setForm({ ...form, periodStart: e.target.value })
              }
            />
          </Field>
          <Field label="Periodo hasta">
            <input
              required
              type="date"
              min={form.periodStart}
              value={form.periodEnd}
              onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
            />
          </Field>
          <Field label="Medio de pago">
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
            >
              <option>Transferencia bancaria</option>
              <option>Tarjeta</option>
              <option>Otro</option>
            </select>
          </Field>
          <Field label="N.º de operación o referencia">
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Opcional"
            />
          </Field>
        </div>
        <Field label="Observación">
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Opcional"
          />
        </Field>
        <button
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-[#00E5D6] px-5 py-3 font-black text-black disabled:opacity-50"
        >
          {busy ? "Guardando pago…" : "Confirmar y registrar pago"}
        </button>
      </form>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-black text-[#C8D0D8]">
      {label}
      <span className="mt-2 block [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-white/10 [&_input]:bg-black/20 [&_input]:px-3 [&_input]:py-3 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-white/10 [&_select]:bg-[#111519] [&_select]:px-3 [&_select]:py-3">
        {children}
      </span>
    </label>
  );
}
