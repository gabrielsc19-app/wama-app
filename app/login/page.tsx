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

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    const foundUser = users.find(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );

    if (!foundUser) {
      setError("No encontramos un usuario activo con ese correo.");
      return;
    }

    const validPassword =
      password === foundUser.temporaryPassword || password === foundUser.password;

    if (!validPassword) {
      setError("La clave ingresada no es correcta.");
      return;
    }

    if (company.status === "blocked") {
      setError(
        "La cuenta se encuentra bloqueada. Contacta a WAMA para activar licencia."
      );
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
        companyLogo: company.companyLogo,
        module: company.selectedModule,
        status: company.status || "trial",
        loggedAt: new Date().toISOString(),
      })
    );

    if (foundUser.mustChangePassword) {
      router.push("/cambiar-clave");
      return;
    }

    router.push("/portal");
  }

  return (
    <WamaShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Portal privado
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Accede a tu portal WAMA.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
            Ingresa con el correo y clave asignados a tu empresa. Por seguridad,
            WAMA no muestra información de empresas antes del inicio de sesión.
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-7 text-[#C4C7CC]">
            Si activaste una prueba gratuita, usa el correo administrador
            registrado y la clave provisoria recibida.
          </div>
        </div>

        <WamaCard className="p-7">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
              Acceso al software
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
              Iniciar sesión
            </h2>

            <p className="mt-2 text-sm text-[#C4C7CC]">
              El portal de tu empresa se mostrará después de validar el acceso.
            </p>
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
                placeholder="usuario@empresa.cl"
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
              Acceder al portal
            </button>
          </form>
        </WamaCard>
      </section>
    </WamaShell>
  );
}