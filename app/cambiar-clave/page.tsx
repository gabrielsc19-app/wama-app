"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";

type WamaSession = {
  userId: number;
  name: string;
  email: string;
  role: string;
  companyName: string;
  module: string;
  status: string;
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

export default function ChangePasswordPage() {
  const router = useRouter();

  const [session, setSession] = useState<WamaSession | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedSession = localStorage.getItem("wamaSession");

    if (!storedSession) {
      router.push("/login");
      return;
    }

    try {
      const parsedSession = JSON.parse(storedSession) as WamaSession;
      setSession(parsedSession);
    } catch {
      localStorage.removeItem("wamaSession");
      router.push("/login");
    }
  }, [router]);

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

  function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!session) {
      setError("No hay una sesión activa.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva clave debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las claves no coinciden.");
      return;
    }

    const storedUsers = localStorage.getItem("wamaCompanyUsers");

    if (!storedUsers) {
      setError("No se encontró la lista de usuarios de la empresa.");
      return;
    }

    try {
      const users = JSON.parse(storedUsers) as WamaUser[];

      const updatedUsers = users.map((user) =>
        user.id === session.userId
          ? {
              ...user,
              password: newPassword,
              temporaryPassword: "",
              mustChangePassword: false,
              status: "Activo",
            }
          : user
      );

      localStorage.setItem("wamaCompanyUsers", JSON.stringify(updatedUsers));

      localStorage.setItem(
        "wamaSession",
        JSON.stringify({
          ...session,
          passwordChangedAt: new Date().toISOString(),
        })
      );

      redirectByModule(session.module);
    } catch {
      setError("No se pudo actualizar la clave. Intenta nuevamente.");
    }
  }

  return (
    <WamaShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Seguridad de acceso
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Cambia tu clave provisoria.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
            Para proteger el acceso al software, el primer ingreso requiere
            reemplazar la clave provisoria por una clave propia.
          </p>
        </div>

        <WamaCard className="p-7">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
              {session?.companyName || "Empresa"}
            </p>

            <h2 className="mt-1 text-3xl font-black text-[#F5F6F7]">
              {session?.name || "Usuario"}
            </h2>

            <p className="mt-2 text-sm text-[#C4C7CC]">
              {session?.email || ""}
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleChangePassword}>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#F5F6F7]">
                Nueva clave
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#F5F6F7]">
                Confirmar clave
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none placeholder:text-[#C4C7CC]/60 focus:border-[#00E5D6]/60"
                placeholder="Repite tu nueva clave"
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
              Guardar nueva clave
            </button>
          </form>
        </WamaCard>
      </section>
    </WamaShell>
  );
}