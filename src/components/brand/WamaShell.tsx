"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Home, Layers3, LogIn, Mail, Menu, X } from "lucide-react";
import WamaLogo from "./WamaLogo";
import WamaGuideBubble from "./WamaGuideBubble";

const mobileItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/modulos", label: "Módulos", icon: Layers3 },
  { href: "/login", label: "Ingresar", icon: LogIn },
  { href: "/#contacto", label: "Contacto", icon: Mail },
];

export default function WamaShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0C0E] pb-20 text-[#F5F6F7] md:pb-0">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C0E]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:h-auto md:py-5">
          <Link href="/" aria-label="Ir al inicio de WAMA" className="flex items-center">
            <WamaLogo priority className="h-auto w-[150px] sm:w-[180px]" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-[#C4C7CC] md:flex">
            <Link href="/modulos" className="transition hover:text-[#00E5D6]">Módulos</Link>
            <Link href="/reportes" className="transition hover:text-[#00E5D6]">Reportes</Link>
            <Link href="/acceso" className="transition hover:text-[#00E5D6]">Portales</Link>
            <Link href="/#contacto" className="transition hover:text-[#00E5D6]">Contáctanos</Link>
            <Link href="/descargar-app" className="inline-flex items-center gap-2 transition hover:text-[#00E5D6]"><Download className="h-4 w-4" />Descargar app</Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-black transition hover:border-[#00E5D6]/50 hover:text-[#00E5D6]">Iniciar sesión</Link>
            <Link href="/trial" className="rounded-full bg-[#00E5D6] px-6 py-3 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5">Prueba gratis</Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link href="/descargar-app" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00E5D6] text-[#0B0C0E]" aria-label="Instalar WAMA"><Download className="h-5 w-5" /></Link>
            <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5" aria-label={open ? "Cerrar menú" : "Abrir menú"}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/10 bg-[#0B0C0E] px-4 py-4 md:hidden">
            <div className="mx-auto grid max-w-md gap-2">
              {mobileItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black"><Icon className="h-5 w-5 text-[#00E5D6]" />{label}</Link>
              ))}
              <Link href="/trial" onClick={() => setOpen(false)} className="mt-1 rounded-2xl bg-[#00E5D6] px-4 py-3 text-center text-sm font-black text-[#0B0C0E]">Prueba gratis 15 días</Link>
            </div>
          </div>
        )}
      </header>

      <div>{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#DCE3E8] bg-white/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 text-[#0B0C0E] shadow-[0_-12px_30px_rgba(11,12,14,.12)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {mobileItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-black"><Icon className={`h-5 w-5 ${label === "Instalar" ? "text-[#00AFA5]" : "text-[#29323A]"}`} /><span className="truncate">{label}</span></Link>
          ))}
        </div>
      </nav>

      <div className="hidden md:block"><WamaGuideBubble /></div>
    </div>
  );
}
