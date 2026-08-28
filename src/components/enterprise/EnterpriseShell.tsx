"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bot,
  Building2,
  CreditCard,
  FileText,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Package2,
  Plus,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../app/lib/supabase";
import { getMyTenants } from "../../core/tenant";
import { subscribeCurrentDevice } from "../operations/operationsPushClient";

const desktopItems = [
  { href: "/empresa", label: "Inicio", icon: Home },
  { href: "/empresa/perfil", label: "Mi empresa", icon: Building2 },
  { href: "/empresa/usuarios", label: "Usuarios", icon: Users },
  { href: "/empresa/modulos", label: "Módulos", icon: Package2 },
  { href: "/empresa/facturacion", label: "Facturación", icon: CreditCard },
  { href: "/empresa/ia", label: "WAMA AI", icon: Bot, badge: "BETA" },
  { href: "/empresa/seguridad", label: "Seguridad", icon: ShieldCheck },
];

type MobileAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  event?: string;
  eventDetail?: string;
  primary?: boolean;
};

const enterpriseMobile: MobileAction[] = [
  { id: "home", href: "/empresa", label: "Inicio", icon: Home },
  { id: "users", href: "/empresa/usuarios", label: "Usuarios", icon: Users },
  { id: "modules", href: "/empresa/modulos", label: "Módulos", icon: Package2 },
  { id: "ai", href: "/empresa/ia", label: "WAMA AI", icon: Bot },
  { id: "more", label: "Más", icon: Menu },
];

const operationsMobile: MobileAction[] = [
  { id: "summary", label: "Inicio", icon: LayoutGrid, event: "wama:operations:view", eventDetail: "summary" },
  { id: "cases", label: "Casos", icon: FileText, event: "wama:operations:view", eventDetail: "cases" },
  { id: "report", label: "Reportar", icon: Plus, event: "wama:operations:new-case", primary: true },
  { id: "alerts", label: "Alertas", icon: ShieldAlert, event: "wama:operations:view", eventDetail: "alerts" },
  { id: "more", label: "Más", icon: Menu },
];

const expenseMobile: MobileAction[] = [
  { id: "home", label: "Inicio", icon: LayoutGrid, event: "wama:expense:view", eventDetail: "home" },
  { id: "mine", label: "Mis gastos", icon: ReceiptText, event: "wama:expense:view", eventDetail: "mine" },
  { id: "new", label: "Nuevo", icon: Plus, event: "wama:expense:new", primary: true },
  { id: "approvals", label: "Aprobar", icon: WalletCards, event: "wama:expense:view", eventDetail: "approvals" },
  { id: "more", label: "Más", icon: Menu },
];

function dispatch(name: string, detail?: string) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export default function EnterpriseShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const [company, setCompany] = useState<{ name: string; logoUrl?: string | null } | null>(null);

  const mode =
    pathname.startsWith("/operations-hub")
      ? "operations"
      : pathname.startsWith("/expense-hub")
        ? "expense"
        : "enterprise";

  const mobileItems =
    mode === "operations"
      ? operationsMobile
      : mode === "expense"
        ? expenseMobile
        : enterpriseMobile;

  useEffect(() => {
    let active = true;
    void getMyTenants()
      .then((tenants) => {
        const tenant = tenants[0];
        if (active && tenant) {
          setCompany({ name: tenant.name, logoUrl: tenant.logoUrl });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  // Mobile push onboarding for existing accounts:
  // - if permission already exists, subscription is synced silently;
  // - if permission is still "default", the first real user interaction can
  //   legally trigger the native browser/OS permission prompt.
  useEffect(() => {
    if (mode !== "operations" || typeof window === "undefined") return;

    let done = false;

    const attempt = async () => {
      if (done || !("Notification" in window)) return;
      done = true;

      try {
        await subscribeCurrentDevice({ requestPermission: true });
        window.dispatchEvent(new Event("wama:push-updated"));
      } catch {
        // Push cannot block the app.
      }
    };

    if ("Notification" in window && Notification.permission === "granted") {
      void attempt();
      return;
    }

    if ("Notification" in window && Notification.permission === "default") {
      const onFirstGesture = () => void attempt();
      window.addEventListener("pointerdown", onFirstGesture, {
        once: true,
        passive: true,
      });
      return () => window.removeEventListener("pointerdown", onFirstGesture);
    }
  }, [mode]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/empresa"
      ? pathname === href
      : !href.includes("#") && pathname.startsWith(href);

  function handleMobileAction(item: MobileAction) {
    if (item.id === "more") {
      setMobileMore(true);
      return;
    }
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (item.event) {
      dispatch(item.event, item.eventDetail);
    }
  }

  const moreItems = useMemo(() => {
    if (mode === "operations") {
      return [
        { label: "Proyectos", action: () => dispatch("wama:operations:view", "projects") },
        { label: "Equipos", action: () => dispatch("wama:operations:view", "teams") },
        { label: "Usuarios", action: () => dispatch("wama:operations:view", "users") },
        { label: "Avisos", action: () => dispatch("wama:operations:view", "notifications") },
        { label: "Informes", action: () => dispatch("wama:operations:view", "reports") },
        { label: "Configuración", action: () => dispatch("wama:operations:view", "settings") },
        { label: "Portal empresarial", href: "/empresa" },
      ];
    }

    if (mode === "expense") {
      return [
        { label: "Fondos por rendir", action: () => dispatch("wama:expense:view", "funds") },
        { label: "Tesorería", action: () => dispatch("wama:expense:view", "treasury") },
        { label: "Usuarios", href: "/empresa/usuarios" },
        { label: "Portal empresarial", href: "/empresa" },
      ];
    }

    return [
      { label: "Mi empresa", href: "/empresa/perfil" },
      { label: "Facturación", href: "/empresa/facturacion" },
      { label: "Seguridad", href: "/empresa/seguridad" },
      { label: "Configuración", href: "/empresa/configuracion" },
    ];
  }, [mode]);

  return (
    <main className="min-h-screen bg-[#F5F6F7] pb-[calc(5.65rem+env(safe-area-inset-bottom))] text-[#0B0C0E] xl:pb-0">
      {/* Desktop sidebar + mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[80] flex w-[min(286px,88vw)] flex-col overflow-hidden border-r border-[#DCE1E6] bg-[#0B0C0E] text-white transition-transform xl:w-[286px] xl:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-24 items-center justify-between border-b border-white/10 px-5 py-3">
          <Link href="/empresa" className="flex items-center gap-3">
            <span className="flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl font-black text-[#0B0C0E] ring-1 ring-white/15">
              {company?.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={`Logo de ${company.name}`}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                "W"
              )}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-lg leading-tight">
                {company?.name || "WAMA"}
              </strong>
              <small className="mt-1 block text-[10px] font-bold tracking-[0.14em] text-[#9CA5AF]">
                PORTAL EMPRESARIAL
              </small>
            </span>
          </Link>
          <button
            className="xl:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          {desktopItems.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black transition ${
                isActive(href)
                  ? "bg-[#00E5D6] text-[#0B0C0E]"
                  : "text-[#C4C7CC] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] tracking-wider">
                  {badge}
                </span>
              )}
            </Link>
          ))}

          <button
            onClick={signOut}
            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-black text-[#C4C7CC]"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </nav>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-[70] bg-black/45 xl:hidden"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <section className="xl:pl-[286px]">
        {/* Mobile header: real safe area, no overlap with clock/notch */}
        <header className="mobile-app-header sticky top-0 z-50 border-b border-[#DCE1E6] bg-white/95 backdrop-blur-xl xl:hidden">
          <div className="flex min-h-[62px] items-center gap-3 px-4">
            <button
              onClick={() => setOpen(true)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#DCE1E6] bg-white"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[22px] font-black tracking-[-.045em]">
                {title}
              </h1>
              <p className="truncate text-[11px] font-bold text-[#7A838D]">
                {company?.name || "WAMA"}
              </p>
            </div>

            {mode === "enterprise" && (
              <Link
                href="/empresa/ia"
                className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E6FFFC] text-[#008F87]"
                aria-label="WAMA AI"
              >
                <Sparkles className="h-5 w-5" />
              </Link>
            )}
          </div>
        </header>

        {/* Desktop header unchanged */}
        <header className="sticky top-0 z-30 hidden border-b border-[#DCE1E6] bg-white/95 backdrop-blur-xl xl:block">
          <div className="flex min-h-20 items-center gap-4 px-8">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#008F87]">
                Centro de administración
              </p>
              <h1 className="truncate text-2xl font-black tracking-[-0.04em]">
                {title}
              </h1>
              <p className="text-sm text-[#69717D]">{subtitle}</p>
            </div>

            <Link
              href="/empresa/ia"
              className="inline-flex items-center gap-2 rounded-full border border-[#DCE1E6] bg-white px-5 py-3 text-sm font-black"
            >
              <Sparkles className="h-4 w-4 text-[#00AFA5]" />
              WAMA AI
            </Link>
          </div>
        </header>

        <div className="mobile-page-content mx-auto max-w-[1500px] p-4 sm:p-6 xl:p-8">
          {children}
        </div>
      </section>

      {/* Mobile bottom navigation is contextual to the active module */}
      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[65] grid grid-cols-5 border-t border-[#DCE1E6] bg-white/95 px-1 backdrop-blur-xl xl:hidden">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href ? isActive(item.href) : false;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMobileAction(item)}
              className={`relative flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-black ${
                active ? "text-[#008F87]" : "text-[#69717D]"
              }`}
            >
              {item.primary ? (
                <span className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-[#00E5D6] text-black shadow-[0_10px_30px_rgba(0,184,174,.32)]">
                  <Icon className="h-7 w-7" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className={item.primary ? "-mt-1 text-[#0B0C0E]" : ""}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Contextual "More" sheet */}
      {mobileMore && (
        <div className="fixed inset-0 z-[95] flex items-end bg-black/45 xl:hidden">
          <button
            className="absolute inset-0"
            onClick={() => setMobileMore(false)}
            aria-label="Cerrar"
          />
          <section className="mobile-sheet relative z-10 w-full rounded-t-[2rem] bg-white px-5 pt-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#DCE1E6]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">
                  WAMA
                </p>
                <h2 className="text-2xl font-black">Más opciones</h2>
              </div>
              <button
                onClick={() => setMobileMore(false)}
                className="grid h-10 w-10 place-items-center rounded-full border"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              {moreItems.map((item) =>
                "href" in item && item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setMobileMore(false)}
                    className="flex min-h-14 items-center justify-between rounded-2xl bg-[#F5F7F8] px-4 text-sm font-black"
                  >
                    {item.label}
                    <span>›</span>
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.action?.();
                      setMobileMore(false);
                    }}
                    className="flex min-h-14 items-center justify-between rounded-2xl bg-[#F5F7F8] px-4 text-left text-sm font-black"
                  >
                    {item.label}
                    <span>›</span>
                  </button>
                ),
              )}
            </div>

            <button
              onClick={signOut}
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 text-sm font-black text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
