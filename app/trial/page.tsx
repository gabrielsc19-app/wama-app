"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";

const modules = ["Sales Hub", "Operación", "Finanzas"];

const saleTypes = [
  "Venta spot",
  "Venta recurrente",
  "Venta mixta",
  "Arriendo / contrato mensual",
  "Proyecto único",
  "Servicio operacional",
];

const businessModels = [
  "Producto",
  "Servicio",
  "Software / SaaS",
  "Arriendo",
  "Proyecto",
  "Mantención",
  "Facility / operación",
  "Otro",
];

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

  const [businessModel, setBusinessModel] = useState("Servicio");
  const [saleType, setSaleType] = useState("Venta recurrente");
  const [whatCompanySells, setWhatCompanySells] = useState("");
  const [averageTicket, setAverageTicket] = useState("");
  const [salesCycle, setSalesCycle] = useState("");
  const [currency, setCurrency] = useState("CLP");
  const [requestedUsers, setRequestedUsers] = useState("10");

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

      businessModel,
      saleType,
      whatCompanySells,
      averageTicket,
      salesCycle,
      currency,
      requestedUsers: Number(requestedUsers),
      includedUsers: 10,
      modulePriceUsd: 10,
      extraUsersBlockPriceUsd: 10,

      adminEmail: contactEmail,
      temporaryPassword: "WamaTrial2026!",
      mustChangePassword: true,
    };

    const initialUsers = [
      {
        id: 1,
        name: contactName || "Administrador trial",
        email: contactEmail || "admin@empresa.cl",
        role: "Administrador",
        status: "Activo",
        temporaryPassword: "WamaTrial2026!",
        mustChangePassword: true,
      },
    ];

    localStorage.setItem("wamaTrialCompany", JSON.stringify(trialData));
    localStorage.setItem("wamaCompanyUsers", JSON.stringify(initialUsers));

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
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Prueba gratis 14 días
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Activa WAMA para tu empresa.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              Configura una prueba gratuita, define qué vende tu empresa,
              selecciona el módulo inicial y prepara el acceso al software.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                "14 días gratis sin pago inicial",
                "Configuración comercial por tipo de negocio",
                "Logo y datos de empresa",
                "10 usuarios incluidos",
                "US$10 mensual por módulo después del trial",
                "Usuarios adicionales por US$10 extra",
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
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre de empresa">
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                    placeholder="Ej: Empresa Demo SpA"
                    required
                  />
                </Field>

                <Field label="RUT empresa">
                  <input
                    value={companyRut}
                    onChange={(event) => setCompanyRut(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                    placeholder="Ej: 76.123.456-7"
                  />
                </Field>

                <Field label="Rubro">
                  <input
                    value={industry}
                    onChange={(event) => setIndustry(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                    placeholder="Ej: Retail, servicios, industrial"
                  />
                </Field>

                <Field label="Responsable">
                  <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                    placeholder="Nombre del contacto principal"
                  />
                </Field>

                <Field label="Correo administrador">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                    placeholder="correo@empresa.cl"
                    required
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                    placeholder="+56 9 1234 5678"
                  />
                </Field>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  Configuración comercial
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="¿Qué vende tu empresa?">
                    <textarea
                      value={whatCompanySells}
                      onChange={(event) =>
                        setWhatCompanySells(event.target.value)
                      }
                      className="min-h-[108px] w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                      placeholder="Ej: Servicios de mantenimiento, arriendo de espacios, productos, software, proyectos, asesorías..."
                      required
                    />
                  </Field>

                  <div className="grid gap-4">
                    <Field label="Modelo de negocio">
                      <select
                        value={businessModel}
                        onChange={(event) =>
                          setBusinessModel(event.target.value)
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none focus:border-[#00E5D6]/60"
                      >
                        {businessModels.map((model) => (
                          <option key={model}>{model}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Tipo de venta">
                      <select
                        value={saleType}
                        onChange={(event) => setSaleType(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none focus:border-[#00E5D6]/60"
                      >
                        {saleTypes.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Ticket promedio estimado">
                    <input
                      value={averageTicket}
                      onChange={(event) => setAverageTicket(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                      placeholder="Ej: 15000000"
                    />
                  </Field>

                  <Field label="Ciclo de venta estimado">
                    <input
                      value={salesCycle}
                      onChange={(event) => setSalesCycle(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                      placeholder="Ej: 30 días, 60 días, 3 meses"
                    />
                  </Field>

                  <Field label="Moneda de trabajo">
                    <select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none focus:border-[#00E5D6]/60"
                    >
                      <option>CLP</option>
                      <option>UF</option>
                      <option>USD</option>
                    </select>
                  </Field>

                  <Field label="Usuarios solicitados">
                    <input
                      type="number"
                      min="1"
                      value={requestedUsers}
                      onChange={(event) => setRequestedUsers(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                    />
                  </Field>
                </div>

                {Number(requestedUsers) > 10 && (
                  <div className="mt-5 rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 p-4 text-sm leading-6 text-[#F5F6F7]">
                    El plan base incluye 10 usuarios. Para activar más de 10
                    usuarios se debe contratar un bloque adicional por US$10.
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Módulo inicial">
                  <select
                    value={selectedModule}
                    onChange={(event) => setSelectedModule(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none focus:border-[#00E5D6]/60"
                  >
                    {modules.map((module) => (
                      <option key={module}>{module}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Logo de empresa">
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
                </Field>
              </div>

              <WamaCard className="p-5">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
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
                        {selectedModule} by WAMA · Trial 14 días
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-5 py-4 text-sm text-[#F5F6F7]">
                    Usuario admin: {contactEmail || "correo@empresa.cl"}
                    <br />
                    Clave provisoria: WamaTrial2026!
                  </div>
                </div>
              </WamaCard>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-semibold text-[#0B0C0E] transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,229,214,0.35)]"
              >
                Activar prueba gratis
              </button>
            </form>
          </WamaCard>
        </div>
      </section>
    </WamaShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-[#F5F6F7]">{label}</label>
      {children}
    </div>
  );
}