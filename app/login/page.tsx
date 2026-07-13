"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";

type TrialCompany = {
  companyName?: string;
  contactEmail?: string;
  selectedModule?: string;
  companyLogo?: string | null;
  status?: "trial" | "active" | "expired" | "blocked";
};

type WamaUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  temporaryPassword: string;
  password?: string;
  mustChangePassword: boolean;
};

export default function LoginPage() {
  const router = useRouter();

  const [company, setCompany] = useState<TrialCompany>({
    companyName: "Empresa Demo",
    contactEmail: "admin@empresa.cl",
    selectedModule: "Sales Hub",
    companyLogo: null,
    status: "trial",
  });

  const [users, setUsers] = useState<WamaUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    const storedCompany = localStorage.getItem("wamaTrialCompany");
    const storedUsers = localStorage.getItem("wamaCompanyUsers");

    if (storedCompany) {
      try {
        const parsedCompany = JSON.parse(storedCompany) as TrialCompany;
        setCompany(parsedCompany);
        setEmail(parsedCompany.contactEmail || "");
      } catch {
        localStorage.removeItem("wamaTrialCompany");
      }
    }

    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers) as WamaUser[];
        setUsers(parsedUsers);
      } catch {
        localStorage.removeItem("wamaCompanyUsers");
      }
    }
  }, []);

  function redirectByModule(moduleName?: string) {
    if (moduleName === "Sales Hub") {
      router.push("/sales-hub/crm");
      return;
    }

    if (moduleName === "Operación") {
      router.push("/operacion");
      return;
    }

    if (moduleName === "Finanzas") {
      router.push("/finanzas");
      return;
    }

    router.push("/app");
  }

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    const foundUser = users.find(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );

    if (!foundUser) {
      setError("No encontramos un usuario con ese correo en esta empresa.");
      return;
    }

    const validPassword =
      password === foundUser.temporaryPassword || password === foundUser.password;

    if (!validPassword) {
      setError("La clave ingresada no es correcta.");
      return;
    }

    if (company.status === "blocked") {
      setError("La cuenta se encuentra bloqueada. Contacta a WAMA para activar licencia.");
      return;
    }

    localStorage.setItem(
      "wamaSession",
      JSON.stringify({
        userId: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        companyName: company.companyName,
        module: company.selectedModule,
        status: company.status || "trial",
        loggedAt: new Date().toISOString(),
      })
    );

    if (foundUser.mustChangePassword) {
      router.push("/cambiar-clave");
      return;
    }

    redirectByModule(company.selectedModule);
  }

  const companyInitial = company.companyName
    ? company.companyName.slice(0, 1).toUpperCase()
    : "E";

  return (
    <WamaShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Acceso al software
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Ingresa al portal contratado.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
            Acceso para empresas con prueba gratuita o licencia activa. Cada usuario
            ingresa con su correo y clave. En el primer ingreso deberá cambiar su
            clave provisoria.
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-7 text-[#C4C7CC]">
            <strong className="text-[#F5F6F7]">Demo:</strong> usa el correo
            administrador que ingresaste al activar la prueba y la clave provisoria
            asignada al usuario.
          </div>
        </div>

        <WamaCard className="p-7">
          <div className="mb-7 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-3xl font-black text-[#00E5D6]">
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
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                {company.companyName || "Empresa Demo"}
              </p>

              <h2 className="mt-1 text-3xl font-black text-[#F5F6F7]">
                {company.selectedModule || "Portal"} by WAMA
              </h2>

              <p className="mt-1 text-sm text-[#C4C7CC]">
                Estado: {company.status === "active" ? "Licencia activa" : "Trial activo"}
              </p>
            </div>
          </div>

          <form className="grid gap-5" onSubmit={handleLogin}>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#F5F6F7]">
                Correo
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                placeholder="admin@empresa.cl"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#F5F6F7]">
                Clave
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                placeholder="Clave de acceso"
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-semibold text-[#0B0C0E] transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,229,214,0.35)]"
            >
              Entrar al software
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#C4C7CC]">
            En producción, este login quedará protegido con Supabase Auth,
            recuperación de contraseña, sesiones seguras y control de licencia.
          </div>
        </WamaCard>
      </section>
    </WamaShell>
  );
}