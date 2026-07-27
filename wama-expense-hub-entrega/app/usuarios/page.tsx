"use client";

import { useEffect, useState } from "react";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

type WamaUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
};

type TrialCompany = {
  companyName?: string;
  companyLogo?: string | null;
  includedUsers?: number;
  requestedUsers?: number;
  modulePriceUsd?: number;
  extraUsersBlockPriceUsd?: number;
};

const includedUsers = 10;

export default function UsersPage() {
  const [company, setCompany] = useState<TrialCompany>({
    companyName: "Empresa Demo",
    includedUsers: 10,
    modulePriceUsd: 10,
    extraUsersBlockPriceUsd: 10,
  });

  const [users, setUsers] = useState<WamaUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showLimitNotice, setShowLimitNotice] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Usuario comercial",
  });

  useEffect(() => {
    const storedCompany = localStorage.getItem("wamaTrialCompany");
    const storedUsers = localStorage.getItem("wamaCompanyUsers");

    if (storedCompany) {
      try {
        setCompany(JSON.parse(storedCompany));
      } catch {
        localStorage.removeItem("wamaTrialCompany");
      }
    }

    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch {
        localStorage.removeItem("wamaCompanyUsers");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wamaCompanyUsers", JSON.stringify(users));
  }, [users]);

  function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (users.length >= includedUsers) {
      setShowLimitNotice(true);
      setShowForm(false);
      return;
    }

    const createdUser: WamaUser = {
      id: Date.now(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "Invitado",
      temporaryPassword: "WamaUser2026!",
      mustChangePassword: true,
    };

    setUsers((currentUsers) => [...currentUsers, createdUser]);
    setNewUser({
      name: "",
      email: "",
      role: "Usuario comercial",
    });
    setShowForm(false);
  }

  function handleDeleteUser(id: number) {
    setUsers((currentUsers) => currentUsers.filter((user) => user.id !== id));
    setShowLimitNotice(false);
  }

  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Gestión de usuarios
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Administra los accesos de tu empresa.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              El plan base incluye hasta 10 usuarios. Cada usuario recibe una
              clave provisoria y debe cambiarla al primer ingreso.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <WamaButton href="/sales-hub/crm" variant="secondary">
              Volver al CRM
            </WamaButton>

            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-semibold text-[#0B0C0E]"
            >
              + Agregar usuario
            </button>
          </div>
        </div>

        <WamaCard className="mb-8 p-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                {company.companyName || "Empresa Demo"}
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                Usuarios del plan
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#C4C7CC]">
                Usuarios activos/invitados: {users.length} de {includedUsers}
              </p>
            </div>

            <div className="rounded-3xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Plan base
              </p>

              <p className="mt-2 text-2xl font-black text-[#F5F6F7]">
                US$10 / módulo
              </p>

              <p className="mt-1 text-sm text-[#C4C7CC]">
                Incluye 10 usuarios. Usuario 11 requiere bloque adicional de
                US$10.
              </p>
            </div>
          </div>
        </WamaCard>

        {showLimitNotice && (
          <WamaCard className="mb-8 border-[#00E5D6]/40 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
              Límite de usuarios alcanzado
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
              Tu plan incluye 10 usuarios.
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#C4C7CC]">
              Para agregar el usuario número 11, la empresa debe activar un
              bloque adicional de usuarios por US$10.
            </p>

            <div className="mt-5">
              <WamaButton href="/licencia">Activar usuarios adicionales</WamaButton>
            </div>
          </WamaCard>
        )}

        {showForm && (
          <WamaCard className="mb-8 p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Nuevo usuario
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Crear acceso al software
              </h2>
            </div>

            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleCreateUser}>
              <Field label="Nombre">
                <input
                  value={newUser.name}
                  onChange={(event) =>
                    setNewUser({ ...newUser, name: event.target.value })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none"
                  placeholder="Nombre usuario"
                  required
                />
              </Field>

              <Field label="Correo">
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser({ ...newUser, email: event.target.value })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none"
                  placeholder="usuario@empresa.cl"
                  required
                />
              </Field>

              <Field label="Rol">
                <select
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser({ ...newUser, role: event.target.value })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-[#F5F6F7] outline-none"
                >
                  <option>Administrador</option>
                  <option>Usuario comercial</option>
                  <option>Visualizador</option>
                  <option>Finanzas</option>
                  <option>Operación</option>
                </select>
              </Field>

              <div className="flex gap-3 md:col-span-3">
                <button
                  type="submit"
                  className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-semibold text-[#0B0C0E]"
                >
                  Crear usuario
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#F5F6F7]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </WamaCard>
        )}

        <div className="grid gap-5">
          {users.length === 0 ? (
            <WamaCard className="p-8 text-center">
              <h2 className="text-2xl font-black text-[#F5F6F7]">
                Aún no hay usuarios creados.
              </h2>

              <p className="mt-3 text-sm text-[#C4C7CC]">
                Agrega el primer usuario para dar acceso al software.
              </p>
            </WamaCard>
          ) : (
            users.map((user) => (
              <WamaCard key={user.id} className="p-5">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00E5D6]">
                      {user.role}
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                      {user.name}
                    </h3>

                    <p className="mt-1 text-sm text-[#C4C7CC]">{user.email}</p>

                    <p className="mt-2 text-xs text-[#C4C7CC]">
                      Clave provisoria: {user.temporaryPassword} · Debe cambiar
                      clave al primer ingreso.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
                      {user.status}
                    </span>

                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#C4C7CC]"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </WamaCard>
            ))
          )}
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