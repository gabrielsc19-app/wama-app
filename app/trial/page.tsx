"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";

const modules = ["Sales Hub", "Operación", "Finanzas"];

export default function TrialPage() {
  const router = useRouter();

  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Empresa demo");
  const [companyRut, setCompanyRut] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedModule, setSelectedModule] = useState("Sales Hub");

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setCompanyLogo(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

  function handleCreateTrial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const today = new Date();
    const trialEndsAt = new Date(today);
    trialEndsAt.setDate(today.getDate() + 14);

    const trialData = {
      companyName: companyName || "Empresa demo",
      companyRut,
      industry,
      contactName,
      contactEmail,
      contactPhone,
      selectedModule,
      companyLogo,
      status: "trial",
      trialStartedAt: today.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      trialDaysRemaining: 14,
    };

    localStorage.setItem("wamaTrialCompany", JSON.stringify(trialData));

    if (selectedModule === "Sales Hub") {
      router.push("/acceso/sales-hub");
      return;
    }

    if (selectedModule === "Operación") {
      router.push("/operacion");
      return;
    }

    if (selectedModule === "Finanzas") {
      router.push("/finanzas");
      return;
    }

    router.push("/app");
  }

  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Prueba gratis 14 días
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Activa WAMA para tu empresa.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              Configura una prueba gratis de 14 días, carga los datos básicos
              de tu empresa y comienza a usar el módulo seleccionado con una
              experiencia personalizada.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                "Sin pago inicial",
                "Configuración comercial guiada",
                "Logo y datos de empresa",
                "Acceso demo al módulo seleccionado",
                "Activación de licencia al terminar la prueba",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[#F5F6F7]"
                >
                  <span className="h-2 w-2 rounded-full bg-[#00E5D6]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <WamaCard className="p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Datos de activación
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Configura la prueba
              </h2>
            </div>

            <form className="grid gap-5" onSubmit={handleCreateTrial}>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#F5F6F7]">
                  Nombre de empresa
                </label>

                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                  placeholder="Ej: Empresa Demo SpA"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#F5F6F7]">
                  RUT empresa
                </label>

                <input
                  value={companyRut}
                  onChange={(event) => setCompanyRut(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                  placeholder="Ej: 76.123.456-7"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#F5F6F7]">
                  Rubro
                </label>

                <input
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                  placeholder="Ej: Retail, inmobiliaria, servicios, industrial"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#F5F6F7]">
                  Responsable
                </label>

                <input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                  placeholder="Nombre del contacto principal"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#F5F6F7]">
                  Correo
                </label>

                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                  placeholder="correo@empresa.cl"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#F5F6F7]">
                  Teléfono
                </label>

                <input
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#F5F6F7]">
                  Módulo inicial
                </label>

                <select
                  value={selectedModule}
                  onChange={(event) => setSelectedModule(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none focus:border-[#00E5D6]/60"
                >
                  {modules.map((module) => (
                    <option key={module}>{module}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-semibold text-[#F5F6F7]">
                  Logo de empresa
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-[#00E5D6]/35 bg-[#00E5D6]/5 px-4 py-4 text-sm text-[#C4C7CC]">
                  <span>Subir logo PNG, JPG o SVG</span>

                  <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                    Elegir archivo
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-semibold text-[#0B0C0E] transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,229,214,0.35)]"
              >
                Activar prueba gratis
              </button>
            </form>
          </WamaCard>
        </div>

        <div className="mt-10">
          <WamaCard className="p-6">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt="Logo empresa"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-2xl font-black text-[#00E5D6]">
                      {companyName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[#C4C7CC]">
                    Vista previa del portal
                  </p>

                  <h3 className="text-2xl font-black text-[#F5F6F7]">
                    {companyName || "Empresa demo"}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-[#00E5D6]">
                    {selectedModule} by WAMA · Prueba gratis 14 días
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-5 py-4 text-sm text-[#F5F6F7]">
                Al activar la prueba, estos datos se usarán para personalizar el
                portal del cliente.
              </div>
            </div>
          </WamaCard>
        </div>
      </section>
    </WamaShell>
  );
}