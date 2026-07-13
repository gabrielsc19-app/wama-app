"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WamaSession = {
  userId: number;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  companyLogo?: string | null;
  module?: string;
  status?: string;
};

type TrialCompany = {
  companyName?: string;
  companyLogo?: string | null;
  selectedModule?: string;
  trialEndsAt?: string;
  status?: string;
  includedUsers?: number;
  modulePriceUsd?: number;
};

function getRemainingDays(trialEndsAt?: string) {
  if (!trialEndsAt) return 14;

  const today = new Date();
  const endDate = new Date(trialEndsAt);
  const diff = endDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(days, 0);
}

export default function PortalPage() {
  const router = useRouter();

  const [session, setSession] = useState<WamaSession | null>(null);
  const [company, setCompany] = useState<TrialCompany>({
    companyName: "Empresa Demo",
    selectedModule: "Sales Hub",
    companyLogo: null,
    status: "trial",
    includedUsers: 10,
    modulePriceUsd: 10,
  });

  useEffect(() => {
    const storedSession = localStorage.getItem("wamaSession");
    const storedCompany = localStorage.getItem("wamaTrialCompany");

    if (!storedSession) {
      router.push("/login");
      return;
    }

    try {
      setSession(JSON.parse(storedSession));
    } catch {
      localStorage.removeItem("wamaSession");
      router.push("/login");
      return;
    }

    if (storedCompany) {
      try {
        setCompany(JSON.parse(storedCompany));
      } catch {
        localStorage.removeItem("wamaTrialCompany");
      }
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("wamaSession");
    router.push("/login");
  }

  const remainingDays = getRemainingDays(company.trialEndsAt);

  const companyInitial = company.companyName
    ? company.companyName.slice(0, 1).toUpperCase()
    : "E";

  return (
    <main className="min-h-screen bg-[#F5F6F7] text-[#0B0C0E]">
      <header className="border-b border-[#E1E4E8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-[#D7DBE0] bg-white text-2xl font-black text-[#00AFA4] shadow-sm">
              {company.companyLogo ? (
                <img
                  src={company.companyLogo}
                  alt={`Logo ${company.companyName}`}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                companyInitial
              )}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                Portal privado
              </p>

              <h1 className="text-2xl font-black">
                {company.companyName || "Empresa Demo"}
              </h1>

              <p className="text-sm text-[#5F6673]">
                Powered by WAMA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-[#CDEDEA] bg-[#E8FFFD] px-4 py-2 text-sm md:block">
              <strong className="text-[#00AFA4]">Trial activo</strong>
              <span className="ml-2 text-[#5F6673]">
                {remainingDays} días restantes
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-full border border-[#D7DBE0] bg-white px-4 py-2 text-sm font-black text-[#0B0C0E] hover:bg-[#F5F6F7]"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-[2rem] border border-[#E1E4E8] bg-white p-7 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
            Bienvenido
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">
            Hola, {session?.name || "usuario"}.
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-7 text-[#5F6673]">
            Este es el portal privado de tu empresa. Desde aquí puedes acceder a
            los módulos contratados, administrar usuarios y revisar el estado de
            tu licencia.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-[2rem] border border-[#E1E4E8] bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                  Módulos activos
                </p>

                <h3 className="mt-1 text-2xl font-black">
                  Software contratado
                </h3>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-[#E1E4E8] bg-[#F5F6F7] p-5">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00AFA4]">
                      Módulo comercial
                    </p>

                    <h4 className="mt-2 text-2xl font-black">
                      {company.selectedModule || "Sales Hub"}
                    </h4>

                    <p className="mt-2 text-sm text-[#5F6673]">
                      CRM, pipeline, contactos, deals, documentos y seguimiento comercial.
                    </p>
                  </div>

                  <a
                    href="/sales-hub/crm"
                    className="inline-flex rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E]"
                  >
                    Entrar al módulo
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-[#E1E4E8] bg-white p-7 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                Usuarios
              </p>

              <h3 className="mt-1 text-2xl font-black">
                Gestionar accesos
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#5F6673]">
                El plan base incluye 10 usuarios. Si necesitas agregar el usuario
                11, WAMA mostrará el aviso para contratar un bloque adicional.
              </p>

              <a
                href="/usuarios"
                className="mt-5 inline-flex rounded-full border border-[#D7DBE0] bg-white px-4 py-2 text-sm font-black text-[#0B0C0E] hover:bg-[#F5F6F7]"
              >
                Administrar usuarios
              </a>
            </div>

            <div className="rounded-[2rem] border border-[#E1E4E8] bg-white p-7 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                Licencia
              </p>

              <h3 className="mt-1 text-2xl font-black">
                Trial activo
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#5F6673]">
                US$10 mensual por módulo. Incluye hasta 10 usuarios. Usuarios
                adicionales requieren bloque extra de US$10.
              </p>

              <a
                href="/licencia"
                className="mt-5 inline-flex rounded-full border border-[#D7DBE0] bg-white px-4 py-2 text-sm font-black text-[#0B0C0E] hover:bg-[#F5F6F7]"
              >
                Ver licencia
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}