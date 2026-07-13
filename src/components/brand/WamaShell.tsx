import Link from "next/link";
import WamaLogo from "./WamaLogo";
import WamaGuideBubble from "./WamaGuideBubble";

export default function WamaShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C0E] text-[#F5F6F7]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="wama-hero-grid absolute inset-0 opacity-40" />
        <div className="wama-orb wama-glow left-[12%] top-[12%] h-72 w-72 bg-[#00E5D6]/12" />
        <div className="wama-orb wama-glow right-[8%] top-[30%] h-80 w-80 bg-[#00E5D6]/10" />
        <div className="wama-orb bottom-[10%] left-[35%] h-72 w-72 bg-white/5" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C0E]/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <WamaLogo />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#C4C7CC] md:flex">
            <Link href="/modulos" className="transition hover:text-[#00E5D6]">
              Módulos
            </Link>

            <Link href="/reportes" className="transition hover:text-[#00E5D6]">
              Reportes
            </Link>

            <Link href="/login" className="transition hover:text-[#00E5D6]">
              Acceso portal
            </Link>
          </nav>

          <Link
            href="/trial"
            className="wama-button-motion rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] transition hover:shadow-[0_0_28px_rgba(0,229,214,0.35)]"
          >
            Prueba gratis
          </Link>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <WamaGuideBubble />
    </main>
  );
}