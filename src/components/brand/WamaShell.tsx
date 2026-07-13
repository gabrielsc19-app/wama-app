import Link from "next/link";
import WamaLogo from "./WamaLogo";

export default function WamaShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#F5F6F7]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C0E]/90 backdrop-blur-xl">
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
            className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] transition hover:shadow-[0_0_28px_rgba(0,229,214,0.35)]"
          >
            Prueba gratis
          </Link>
        </div>
      </header>

      {children}
    </main>
  );
}