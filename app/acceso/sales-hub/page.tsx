"use client";

import { useEffect, useState } from "react";
import WamaShell from "../../../src/components/brand/WamaShell";
import WamaButton from "../../../src/components/brand/WamaButton";
import WamaCard from "../../../src/components/brand/WamaCard";

type TrialCompany = {
  companyName: string;
  companyRut?: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  selectedModule?: string;
  companyLogo?: string | null;
  status?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
};

function getRemainingDays(trialEndsAt?: string) {
  if (!trialEndsAt) return 14;

  const today = new Date();
  const endDate = new Date(trialEndsAt);
  const diff = endDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(days, 0);
}

export default function SalesHubAccessPage() {
  const [trialCompany, setTrialCompany] = useState<TrialCompany>({
    companyName: "Empresa Demo",
    selectedModule: "Sales Hub",
    companyLogo: null,
    status: "trial",
  });

  useEffect(() => {
    const storedTrial = localStorage.getItem("wamaTrialCompany");

    if (!storedTrial) return;

    try {
      const parsedTrial = JSON.parse(storedTrial) as TrialCompany;
      setTrialCompany(parsedTrial);
    } catch {
      localStorage.removeItem("wamaTrialCompany");
    }
  }, []);

  const remainingDays = getRemainingDays(trialCompany.trialEndsAt);

  const companyInitial = trialCompany.companyName
    ? trialCompany.companyName.slice(0, 1).toUpperCase()
    : "E";

  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Prueba gratuita activada
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Tu acceso a WAMA está listo.
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#C4C7CC]">
            La empresa ya fue configurada para comenzar una prueba gratuita de
            14 días. Para ingresar al software, el usuario administrador debe
            acceder por la pantalla de login con el correo registrado.
          </p>
        </div>

        <WamaCard className="mx-auto mt-12 max-w-5xl p-7">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-3xl font-black text-[#00E5D6]">
                {trialCompany.companyLogo ? (
                  <img
                    src={trialCompany.companyLogo}
                    alt={`Logo ${trialCompany.companyName}`}
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  companyInitial
                )}
              </div>

              <div className="text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  {trialCompany.companyName || "Empresa Demo"}
                </p>

                <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                  {trialCompany.selectedModule || "Sales Hub"} by WAMA
                </h2>

                <p className="mt-2 text-sm text-[#C4C7CC]">
                  {trialCompany.industry || "Rubro no informado"} ·{" "}
                  {trialCompany.companyRut || "RUT no informado"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-6 py-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Estado
              </p>
              <p className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Trial activo
              </p>
              <p className="mt-1 text-sm text-[#C4C7CC]">
                {remainingDays} días restantes.
              </p>
            </div>
          </div>
        </WamaCard>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
          <WamaCard className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
              01
            </div>

            <h3 className="text-2xl font-black text-[#F5F6F7]">
              Ingreso seguro
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#C4C7CC]">
              El cliente entra al portal contratado desde la pantalla de login
              con su correo administrador.
            </p>
          </WamaCard>

          <WamaCard className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
              02
            </div>

            <h3 className="text-2xl font-black text-[#F5F6F7]">
              Cambio de clave
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#C4C7CC]">
              En el primer ingreso, el usuario debe cambiar su clave provisoria
              antes de entrar al software.
            </p>
          </WamaCard>

          <WamaCard className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
              03
            </div>

            <h3 className="text-2xl font-black text-[#F5F6F7]">
              Acceso al módulo
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#C4C7CC]">
              Luego del login, WAMA redirige al módulo contratado: Sales Hub,
              Operación o Finanzas.
            </p>
          </WamaCard>
        </div>

        <div className="mx-auto mt-10 flex max-w-5xl flex-col justify-center gap-4 sm:flex-row">
          <WamaButton href="/login">Entrar al software</WamaButton>

          <WamaButton href="/onboarding/sales-hub" variant="secondary">
            Revisar canvas
          </WamaButton>

          <WamaButton href="/licencia" variant="secondary">
            Ver plan
          </WamaButton>
        </div>

        <WamaCard className="mx-auto mt-10 max-w-5xl p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Importante
              </p>

              <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                La prueba gratuita dura 14 días
              </h3>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#C4C7CC]">
                Durante este periodo, el cliente puede probar el módulo
                seleccionado. Al finalizar la prueba, deberá activar una licencia
                para mantener acceso completo al CRM y sus datos.
              </p>
            </div>

            <WamaButton href="/login">Entrar al software</WamaButton>
          </div>
        </WamaCard>
      </section>
    </WamaShell>
  );
}