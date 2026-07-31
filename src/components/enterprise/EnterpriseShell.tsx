"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Bot,
  Building2,
  ChevronLeft,
  CreditCard,
  FolderKanban,
  Menu,
  ShieldCheck,
  Sparkles,
  ReceiptText,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { getMyTenants } from "../../core/tenant";
import { getMyLicensingSummary } from "../../core/licensing/licensingService";
import { trialDaysRemaining } from "../../lib/trialDisplay";

const items = [
  { href: "/empresa", label: "Mi empresa", icon: Building2 },
  { href: "/empresa/ia", label: "WAMA AI", icon: Bot },
  { href: "/expense-hub", label: "Rendiciones", icon: ReceiptText },
  { href: "/empresa/licencias", label: "Licencias", icon: BadgeDollarSign },
  { href: "/empresa/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/empresa/usuarios", label: "Usuarios", icon: Users },
  { href: "/empresa/trust", label: "Trust Center", icon: ShieldCheck },
  { href: "/empresa/seguridad", label: "Seguridad", icon: ShieldCheck },
  { href: "/empresa/facturacion", label: "Facturación", icon: CreditCard },
];

const mobileItems = items.slice(0, 5);

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
  const [open, setOpen] = useState(false);
  const [identity, setIdentity] = useState<{name:string;logo:string|null;module:string;days:number|null}|null>(null);

  useEffect(() => { void Promise.all([getMyTenants(), getMyLicensingSummary()]).then(([tenants,licenses])=>{const tenant=tenants[0];if(!tenant)return;setIdentity({name:tenant.name,logo:tenant.logoUrl,module:licenses.map((license)=>license.module_key === "expense" ? "EXPENSE HUB" : license.module_key === "sales" ? "SALES HUB" : license.module_name.toUpperCase()).join(" · "),days:trialDaysRemaining(tenant.trialEndsAt,tenant.timezone)});}).catch(()=>undefined); }, []);

  const isActive = (href: string) => href === "/empresa" ? pathname === href : pathname.startsWith(href);

  return (
    <main className="min-h-screen bg-[#F5F6F7] pb-[calc(5.4rem+env(safe-area-inset-bottom))] text-[#0B0C0E] lg:pb-0">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[286px] border-r border-[#DCE1E6] bg-[#0B0C0E] text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link href="/empresa" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#00E5D6] text-xl font-black text-[#0B0C0E]">{identity?.logo ? <img src={identity.logo} alt="Logo de empresa" className="h-full w-full object-contain bg-white p-1"/> : "W"}</span>
            <span className="min-w-0"><strong className="block max-w-[170px] truncate text-lg leading-none">{identity?.name || "WAMA"}</strong><small className="text-[9px] font-bold tracking-[0.14em] text-[#9CA5AF]">{identity?.module || "PORTAL EMPRESARIAL"}</small></span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
        </div>

        <nav className="space-y-1 p-4">
          <Link href="/app" className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-[#C4C7CC] hover:bg-white/5">
            <ChevronLeft className="h-4 w-4" /> Volver a módulos
          </Link>
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black transition ${isActive(href) ? "bg-[#00E5D6] text-[#0B0C0E]" : "text-[#C4C7CC] hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-5 w-5" /> {label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00E5D6]">{identity?.module || "WAMA Trust"}</p>
          <p className="mt-2 text-sm font-bold">{identity?.days === null || identity?.days === undefined ? "Protección multiempresa activa" : `Prueba · ${identity.days} días restantes`}</p>
          <p className="mt-1 text-xs leading-5 text-[#9CA5AF]">{identity?.name || "Datos, licencias y permisos aislados por empresa."}</p>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}

      <section className="lg:pl-[286px]">
        <header className="sticky top-0 z-30 border-b border-[#DCE1E6] bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-20 items-center gap-4 px-5 sm:px-8">
            <button onClick={() => setOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#DCE1E6] lg:hidden" aria-label="Abrir menú"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#008F87]">Centro de administración</p>
              <h1 className="truncate text-2xl font-black tracking-[-0.04em]">{title}</h1>
              <p className="hidden text-sm text-[#69717D] sm:block">{subtitle}</p>
            </div>
            <Link href="/empresa/ia" className="hidden items-center gap-2 rounded-full border border-[#DCE1E6] bg-white px-5 py-3 text-sm font-black sm:inline-flex"><Sparkles className="h-4 w-4 text-[#00AFA5]" /> WAMA AI</Link>
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] p-4 sm:p-8">{children}</div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#DCE1E6] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {mobileItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex min-h-[68px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-black ${isActive(href) ? "text-[#008F87]" : "text-[#69717D]"}`}>
            <Icon className={`h-5 w-5 ${isActive(href) ? "stroke-[2.6]" : ""}`} />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
