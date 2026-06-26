"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import {
  ArrowRight,
  Banknote,
  Building2,
  ClipboardList,
  Lock,
  LogOut,
  ShieldCheck,
} from "lucide-react";

type UserProfile = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  organization_id?: number;
};

const FIXLOOP_SESSION_KEY = "fixloop_pumay_session";

const ACCOUNTS_PAYABLE_ROLES = ["owner", "cuentas_por_pagar", "proveedores", "facturacion", "facturación", "finanzas"];

function normalizeRole(role?: string | null) {
  return String(role || "").toLowerCase().trim();
}

function getSavedProfileSession(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(FIXLOOP_SESSION_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as UserProfile;

    if (!parsed?.email || !parsed?.organization_id) return null;

    return parsed;
  } catch {
    return null;
  }
}

function canAccessAccountsPayable(role?: string | null) {
  return ACCOUNTS_PAYABLE_ROLES.includes(normalizeRole(role));
}

function canAccessOperation(role?: string | null) {
  const value = normalizeRole(role);

  if (!value) return false;

  return !["cuentas_por_pagar", "proveedores", "facturacion", "facturación", "finanzas"].includes(value);
}

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUserProfile(getSavedProfileSession());
    setLoaded(true);
  }, []);

  const role = normalizeRole(userProfile?.role);

  const modules = useMemo(() => {
    return [
      {
        key: "operacion",
        title: "Operación Pumay",
        subtitle: "Gestión diaria del centro comercial",
        description:
          "Administra casos, solicitudes de locatarios, tareas internas, comunicaciones, reportes de seguridad, aseo y seguimiento operacional.",
        href: "/operacion",
        available: canAccessOperation(role),
        icon: Building2,
        tone: "border-[#0089BD]/25 bg-white hover:border-[#0089BD]/60 hover:shadow-[#0089BD]/10",
        iconTone: "bg-[#0089BD] text-white",
        badge: "Operación",
        accent: "bg-[#0089BD]",
      },
      {
        key: "cuentas-por-pagar",
        title: "Cuentas por pagar",
        subtitle: "Pago a proveedores",
        description:
          "Verónica carga facturas y cartola; el sistema valida pagos previos, calcula la propuesta semanal y la deja lista para aprobación de Gabriel.",
        href: "/pagos-proveedores",
        available: canAccessAccountsPayable(role),
        icon: Banknote,
        tone: "border-[#F4B400]/35 bg-white hover:border-[#F4B400]/70 hover:shadow-[#F4B400]/10",
        iconTone: "bg-[#E87700] text-white",
        badge: "Proveedores",
        accent: "bg-[#F4B400]",
      },
    ];
  }, [role]);

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch {
      // noop
    }

    try {
      window.localStorage.removeItem(FIXLOOP_SESSION_KEY);
    } catch {
      // noop
    }

    setUserProfile(null);
    window.location.href = "/operacion";
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#eef4fa] p-4 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold shadow-sm">
            Cargando FixLoop | Pumay...
          </div>
        </div>
      </main>
    );
  }

  if (!userProfile) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f4f8fb] p-4 text-slate-900 sm:p-6">
        <PumayBackground />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center">
          <section className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <img
                  src="/logo-pumay.png"
                  alt="Pumay es Maipú"
                  className="h-16 w-auto object-contain"
                />
                <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-[#0089BD]">
                  FixLoop | Pumay
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Panel principal
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Inicia sesión para acceder a los módulos disponibles según tu
                  perfil de trabajo.
                </p>
              </div>

              <div className="rounded-3xl bg-[#0089BD]/10 p-4 text-[#0089BD]">
                <Lock className="h-10 w-10" />
              </div>
            </div>

            <a
              href="/operacion"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 sm:w-auto"
            >
              Iniciar sesión
              <ArrowRight className="h-4 w-4" />
            </a>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8fb] p-4 text-slate-900 sm:p-6">
      <PumayBackground />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <img
                src="/logo-pumay.png"
                alt="Pumay es Maipú"
                className="h-16 w-auto object-contain"
              />

              <p className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-[#0089BD]">
                Portal de módulos
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Selecciona tu módulo de trabajo
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Primero elige el área de trabajo. Operación y Cuentas por pagar funcionan como módulos separados para mantener una navegación clara y proteger información sensible.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="text-slate-500">Sesión activa</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {userProfile.name || userProfile.email}
              </p>
              <p className="mt-1 text-slate-600">Rol: {userProfile.role}</p>

              <button
                type="button"
                onClick={logout}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;

            if (!module.available) {
              return (
                <div
                  key={module.key}
                  className="rounded-[2rem] border border-slate-200 bg-white/70 p-6 opacity-60 shadow-sm backdrop-blur sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-3xl bg-slate-100 p-4 text-slate-400">
                      <Icon className="h-8 w-8" />
                    </div>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
                      Sin acceso
                    </span>
                  </div>

                  <h2 className="mt-6 text-3xl font-black text-slate-950">
                    {module.title}
                  </h2>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                    {module.subtitle}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {module.description}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-500">
                    <Lock className="h-4 w-4" />
                    No disponible para tu perfil
                  </div>
                </div>
              );
            }

            return (
              <a
                key={module.key}
                href={module.href}
                className={`group rounded-[2rem] border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:p-7 ${module.tone}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`rounded-3xl p-4 shadow-lg transition group-hover:scale-105 ${module.iconTone}`}
                  >
                    <Icon className="h-9 w-9" />
                  </div>

                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                    {module.badge}
                  </span>
                </div>

                <div className={`mt-7 h-1.5 w-20 rounded-full ${module.accent}`} />

                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                  {module.title}
                </h2>
                <p className="mt-1 text-sm font-black uppercase tracking-wide text-slate-500">
                  {module.subtitle}
                </p>
                <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-600">
                  {module.description}
                </p>

                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition group-hover:bg-slate-800">
                  Abrir módulo
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </a>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 text-sm text-slate-600 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="rounded-3xl bg-[#60B62D]/15 p-4 text-[#2F8B28]">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div>
              <p className="font-black text-slate-950">Acceso por perfil</p>
              <p className="mt-1 leading-6">
                Los perfiles operativos acceden a Operación. Finanzas queda
                reservado para owner, finanzas, facturación y cobranza.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PumayBackground() {
  return (
    <>
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full border-[34px] border-[#0089BD]/15" />
      <div className="absolute -right-24 top-32 h-80 w-80 rounded-full border-[34px] border-[#F4B400]/20" />
      <div className="absolute -bottom-24 left-10 h-80 w-80 rounded-full border-[34px] border-[#60B62D]/16" />
      <div className="absolute bottom-10 right-16 h-64 w-64 rounded-full border-[28px] border-[#D7282F]/14" />
      <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_36rem)]" />
    </>
  );
}
