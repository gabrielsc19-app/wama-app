import Link from "next/link";
import WamaLogo from "./WamaLogo";
import WamaGuideBubble from "./WamaGuideBubble";

export default function WamaShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#F5F6F7]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C0E]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <Link href="/" className="flex items-center gap-4">
            <WamaLogo />

            <div className="leading-none">
              <p className="text-3xl font-black tracking-[-0.04em] text-[#F5F6F7]">
                WAMA
              </p>

              <p className="mt-2 text-[0.62rem] font-black uppercase tracking-[0.24em] text-[#00E5D6]">
                Warn and Manage
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-[#C4C7CC] md:flex">
            <Link href="/modulos" className="transition hover:text-[#00E5D6]">
              Módulos
            </Link>

            <Link href="/reportes" className="transition hover:text-[#00E5D6]">
              Reportes
            </Link>

            <Link href="/acceso" className="transition hover:text-[#00E5D6]">
              Acceso portal
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/acceso"
              className="hidden rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-black text-[#F5F6F7] transition hover:border-[#00E5D6]/50 hover:text-[#00E5D6] sm:inline-flex"
            >
              Acceso portal
            </Link>

            <Link
              href="/trial"
              className="rounded-full bg-[#00E5D6] px-6 py-3 text-sm font-black text-[#0B0C0E] transition hover:shadow-[0_0_28px_rgba(0,229,214,0.35)]"
            >
              Prueba gratis
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <WamaGuideBubble />
    </main>
  );
}