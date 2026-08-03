"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Building2,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Package2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../app/lib/supabase";
import { loadEnterprisePortalData } from "../../core/portal/portalData";

const items = [
  { href: "/empresa", label: "Inicio", icon: Home },
  { href: "/empresa#mi-empresa", label: "Mi empresa", icon: Building2 },
  { href: "/empresa/usuarios", label: "Usuarios", icon: Users },
  { href: "/empresa#modulos", label: "Módulos", icon: Package2 },
  { href: "/empresa/facturacion", label: "Facturación", icon: CreditCard },
  { href: "/empresa/ia", label: "WAMA AI", icon: Bot, badge: "BETA" },
  { href: "/empresa/seguridad", label: "Seguridad", icon: ShieldCheck },
];

const mobileItems = [items[0], items[2], items[3], items[4], items[5]];

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
  const [company, setCompany] = useState<{ name: string; logoUrl?: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    void loadEnterprisePortalData().then((portal) => {
      if (active) setCompany({ name: portal.tenant.name, logoUrl: portal.tenant.logoUrl });
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string) => href === "/empresa" ? pathname === href : !href.includes("#") && pathname.startsWith(href);

  return (
    <main className="min-h-screen bg-[#F5F6F7] pb-[calc(5.4rem+env(safe-area-inset-bottom))] text-[#0B0C0E] lg:pb-0">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(286px,88vw)] flex-col overflow-hidden border-r border-[#DCE1E6] bg-[#0B0C0E] text-white transition-transform xl:w-[286px] xl:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex min-h-24 items-center justify-between border-b border-white/10 px-5 py-3">
          <Link href="/empresa" className="flex items-center gap-3">
            <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl font-black text-[#0B0C0E] ring-1 ring-white/15">
              {company?.logoUrl ? <img src={company.logoUrl} alt={`Logo de ${company.name}`} className="h-full w-full object-contain p-1.5" /> : "W"}
            </span>
            <span className="min-w-0"><strong className="block truncate text-lg leading-tight">{company?.name || "WAMA"}</strong><small className="mt-1 block text-[10px] font-bold tracking-[0.14em] text-[#9CA5AF]">PORTAL EMPRESARIAL</small></span>
          </Link>
          <button className="xl:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          {items.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black transition ${isActive(href) ? "bg-[#00E5D6] text-[#0B0C0E]" : "text-[#C4C7CC] hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-5 w-5" /> <span className="flex-1">{label}</span>{badge && <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] tracking-wider">{badge}</span>}
            </Link>
          ))}
          <button onClick={signOut} className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-black text-[#C4C7CC] transition hover:border-[#00E5D6]/50 hover:bg-white/5 hover:text-white">
            <LogOut className="h-5 w-5" /> Cerrar sesión
          </button>
        </nav>

        <div className="m-4 mt-2 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 max-[700px]:hidden">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00E5D6]">Centro empresarial</p>
          <p className="mt-2 text-sm font-bold">Todos tus módulos en un portal</p>
          <p className="mt-1 text-xs leading-5 text-[#9CA5AF]">Usuarios, facturación, seguridad e IA administrados de forma central.</p>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}

      <section className="xl:pl-[286px]">
        <header className="sticky top-0 z-30 border-b border-[#DCE1E6] bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-20 items-center gap-4 px-5 sm:px-8">
            <button onClick={() => setOpen(true)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DCE1E6] xl:hidden" aria-label="Abrir menú"><Menu className="h-5 w-5" /></button>
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

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#DCE1E6] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl xl:hidden">
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
