import Link from "next/link";

export default function SalesHubPage() {
  return (
    <main className="min-h-screen bg-[#0B0C0E] text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-20">
        <p className="mb-5 text-sm font-black uppercase tracking-[0.28em] text-[#00E5D6]">
          Sales Hub WAMA
        </p>

        <h1 className="max-w-5xl text-6xl font-black leading-tight tracking-[-0.06em] md:text-8xl">
          CRM comercial para vender con orden, foco y seguimiento.
        </h1>

        <p className="mt-7 max-w-3xl text-lg leading-8 text-[#C4C7CC]">
          Ordena prospectos, contactos, deals, pipeline, documentos, actividades
          y reportes comerciales desde un portal simple y autogestionable.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sales-hub/crm"
            className="rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E]"
          >
            Entrar al CRM
          </Link>

          <Link
            href="/sales-hub/crm/dashboard"
            className="rounded-full border border-white/15 px-7 py-4 text-sm font-black text-white"
          >
            Ver dashboard comercial
          </Link>
        </div>
      </section>
    </main>
  );
}