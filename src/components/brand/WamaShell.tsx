import { ReactNode } from "react";
import WamaLogo from "./WamaLogo";
import WamaButton from "./WamaButton";

type WamaShellProps = {
  children: ReactNode;
};

export default function WamaShell({ children }: WamaShellProps) {
  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#F5F6F7]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#00E5D6]/15 blur-[120px]" />
        <div className="absolute bottom-[-160px] right-[-80px] h-[360px] w-[360px] rounded-full bg-[#C4C7CC]/10 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <WamaLogo variant="horizontal" className="h-12 w-auto" priority />

          <nav className="hidden items-center gap-8 text-sm text-[#C4C7CC] md:flex">
            <a href="/modulos" className="hover:text-[#F5F6F7]">
              Módulos
            </a>

            <a href="/modulos/sales-hub" className="hover:text-[#F5F6F7]">
              Sales Hub
            </a>

            <a href="/operacion" className="hover:text-[#F5F6F7]">
              Operación
            </a>

            <a href="/finanzas" className="hover:text-[#F5F6F7]">
              Finanzas
            </a>
          </nav>

          <WamaButton href="/trial" variant="secondary">
            Prueba gratis
          </WamaButton>
        </div>
      </header>

      <section className="relative z-10">{children}</section>
    </main>
  );
}