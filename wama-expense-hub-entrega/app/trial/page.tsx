"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WamaShell from "../../src/components/brand/WamaShell";

const modules = ["Sales Hub", "Operación", "Finanzas"];

export default function TrialPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedModule, setSelectedModule] = useState("Sales Hub");
  const [requestedUsers, setRequestedUsers] = useState("10");
  const [error, setError] = useState("");

  function handleCreateTrial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanCompany = companyName.trim();
    const cleanName = contactName.trim();
    const cleanEmail = contactEmail.trim().toLowerCase();
    const users = Number(requestedUsers);

    if (!cleanCompany || !cleanName || !cleanEmail) {
      setError("Completa empresa, responsable y correo para activar la prueba.");
      return;
    }

    if (!Number.isFinite(users) || users < 1) {
      setError("La cantidad de usuarios debe ser mayor a cero.");
      return;
    }

    const today = new Date();
    const trialEndsAt = new Date(today);
    trialEndsAt.setDate(today.getDate() + 14);

    const logoText = cleanCompany
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const temporaryPassword = "WamaTrial2026!";

    const trialClient = {
      id: `trial-${Date.now()}`,
      companyName: cleanCompany,
      moduleName: selectedModule,
      email: cleanEmail,
      password: temporaryPassword,
      rut: "Pendiente de configurar",
      industry: "Empresa en periodo de prueba",
      logoText: logoText || "W",
      trialDays: 14,
      userLimit: users,
      monthlyPrice: "US$10 por módulo / mes",
      trialStartedAt: today.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      contactName: cleanName,
      contactPhone: contactPhone.trim(),
      deals: [],
    };

    const initialUsers = [
      {
        id: 1,
        name: cleanName,
        email: cleanEmail,
        role: "Administrador",
        status: "Activo",
        temporaryPassword,
        mustChangePassword: true,
      },
    ];

    window.localStorage.setItem(
      "wamaTrialCompany",
      JSON.stringify(trialClient),
    );
    window.localStorage.setItem(
      "wamaCompanyUsers",
      JSON.stringify(initialUsers),
    );
    window.localStorage.setItem(
      "wamaActiveClient",
      JSON.stringify(trialClient),
    );

    router.push("/portal");
  }

  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <section className="relative overflow-hidden bg-[#0B0C0E] text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-10rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[#00E5D6]/10 blur-[170px]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:py-28">
            <div className="lg:sticky lg:top-32">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
                Prueba gratis por 14 días
              </p>

              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl">
                Activa WAMA sin una implementación compleja.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#B7BEC8]">
                Crea tu portal, define el primer módulo y comienza con un acceso
                administrador para tu empresa.
              </p>

              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                <Benefit number="01" text="14 días de prueba sin pago inicial" />
                <Benefit number="02" text="Hasta 10 usuarios incluidos" />
                <Benefit number="03" text="Acceso inmediato al portal" />
                <Benefit number="04" text="Implementación por módulos" />
              </div>
            </div>

            <form
              onSubmit={handleCreateTrial}
              className="rounded-[2rem] bg-white p-7 text-[#0B0C0E] shadow-[0_35px_110px_rgba(0,0,0,0.28)] sm:p-10"
            >
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#008F87]">
                Datos de activación
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em]">
                Crea tu portal.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#69717D]">
                Pediremos la configuración comercial detallada después, dentro
                de WAMA. Primero necesitamos activar tu acceso.
              </p>

              <div className="mt-8 grid gap-5">
                <Field label="Empresa">
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className={inputClass}
                    placeholder="Nombre de la empresa"
                    required
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Responsable">
                    <input
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                      className={inputClass}
                      placeholder="Nombre y apellido"
                      required
                    />
                  </Field>

                  <Field label="Teléfono">
                    <input
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                      className={inputClass}
                      placeholder="+56 9 1234 5678"
                    />
                  </Field>
                </div>

                <Field label="Correo administrador">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    className={inputClass}
                    placeholder="correo@empresa.cl"
                    required
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Módulo inicial">
                    <select
                      value={selectedModule}
                      onChange={(event) => setSelectedModule(event.target.value)}
                      className={inputClass}
                    >
                      {modules.map((module) => (
                        <option key={module}>{module}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Usuarios">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={requestedUsers}
                      onChange={(event) => setRequestedUsers(event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              {Number(requestedUsers) > 10 && (
                <div className="mt-5 border-l-4 border-[#00AFA4] bg-[#E7FFFC] px-4 py-3 text-sm leading-6 text-[#315A57]">
                  El plan base incluye 10 usuarios. Los usuarios adicionales se
                  configuran después de activar el portal.
                </div>
              )}

              {error && (
                <div className="mt-5 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(0,229,214,0.22)]"
              >
                Activar prueba gratis
              </button>

              <p className="mt-5 text-center text-xs leading-6 text-[#7C8490]">
                Se creará un acceso temporal con clave WamaTrial2026!
              </p>
            </form>
          </div>
        </section>
      </main>
    </WamaShell>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[#D7DBE0] bg-[#F7F8FA] px-4 py-4 text-sm text-[#0B0C0E] outline-none transition placeholder:text-[#8B929D] focus:border-[#00AFA4] focus:bg-white";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black">{label}</span>
      {children}
    </label>
  );
}

function Benefit({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[3rem_1fr] gap-4 py-5">
      <span className="text-xs font-black text-[#00E5D6]">{number}</span>
      <p className="text-sm font-black text-white">{text}</p>
    </div>
  );
}
