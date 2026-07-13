"use client";

import { useState } from "react";
import Link from "next/link";

export default function WamaGuideBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      {isOpen && (
        <div className="mb-4 w-[340px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#111318] shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/10 bg-[#0B0C0E] p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5D6]">
              Asistente WAMA
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
              Te acompaño en el proceso.
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#C4C7CC]">
              Activa tu prueba, carga los datos de tu empresa y entra al portal
              para comenzar a trabajar.
            </p>
          </div>

          <div className="grid gap-3 p-4">
            <Link
              href="/trial"
              className="rounded-2xl bg-[#00E5D6] px-4 py-3 text-center text-sm font-black text-[#0B0C0E] transition hover:shadow-[0_0_28px_rgba(0,229,214,0.28)]"
            >
              Activar prueba gratis
            </Link>

            <Link
              href="/modulos"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-[#F5F6F7] transition hover:border-[#00E5D6]/40 hover:bg-[#00E5D6]/10"
            >
              Ver módulos
            </Link>

            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-[#F5F6F7] transition hover:border-[#00E5D6]/40 hover:bg-[#00E5D6]/10"
            >
              Acceso portal
            </Link>
          </div>

          <div className="border-t border-white/10 p-4">
            <p className="text-xs leading-5 text-[#C4C7CC]">
              Pronto podré ayudarte dentro del software a resolver dudas,
              resumir pendientes y sugerir próximos pasos.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((current) => !current)}
        className="wama-button-motion flex items-center gap-3 rounded-full border border-[#00E5D6]/35 bg-[#00E5D6] px-5 py-4 text-sm font-black text-[#0B0C0E] shadow-[0_20px_60px_rgba(0,229,214,0.25)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B0C0E] text-sm font-black text-[#00E5D6]">
          W
        </span>

        {isOpen ? "Cerrar ayuda" : "Te ayudo a comenzar"}
      </button>
    </div>
  );
}