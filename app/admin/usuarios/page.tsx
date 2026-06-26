"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserCog,
  X,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  organization_id: number;
};

type UserRow = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  organization_id: number;
  must_change_password?: boolean | null;
};

type Summary = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  owners: number;
  superAdmins: number;
  comerciales: number;
  operativos: number;
};

type UserForm = {
  id?: number | null;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

const FIXLOOP_SESSION_KEY = "fixloop_pumay_session";

const roleOptions = [
  { value: "owner", label: "Owner" },
  { value: "super_admin", label: "Super administrador" },
  { value: "comercial", label: "Comercial" },
  { value: "aseo", label: "Aseo" },
  { value: "seguridad", label: "Seguridad" },
  { value: "mantencion", label: "Mantención" },
  { value: "operaciones", label: "Operaciones" },
  { value: "admin", label: "Admin" },
];

const emptyForm: UserForm = {
  id: null,
  name: "",
  email: "",
  role: "operaciones",
  active: true,
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function getSavedEmail() {
  if (typeof window === "undefined") return "";

  try {
    const saved = window.localStorage.getItem(FIXLOOP_SESSION_KEY);
    if (!saved) return "";

    const parsed = JSON.parse(saved);
    return normalizeEmail(parsed?.email);
  } catch {
    return "";
  }
}

function roleLabel(role: string) {
  return roleOptions.find((item) => item.value === role)?.label || role;
}


function getApiErrorMessage(result: any, fallback: string) {
  const raw = result?.error ?? result?.message ?? result?.emailWarning ?? result?.details;

  if (!raw) return fallback;
  if (typeof raw === "string") return raw;
  if (typeof raw?.message === "string") return raw.message;
  if (typeof raw?.error === "string") return raw.error;

  try {
    return JSON.stringify(raw);
  } catch {
    return fallback;
  }
}

async function readApiJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return { ok: response.ok };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: text || `${response.status} ${response.statusText}`.trim(),
    };
  }
}

function roleBadgeClass(role: string) {
  if (role === "owner") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (role === "super_admin") return "border-sky-200 bg-sky-50 text-sky-800";
  if (role === "comercial") return "border-violet-200 bg-violet-50 text-violet-800";
  if (role === "aseo") return "border-teal-200 bg-teal-50 text-teal-800";
  if (role === "seguridad") return "border-amber-200 bg-amber-50 text-amber-800";
  if (role === "mantencion" || role === "mantención") return "border-orange-200 bg-orange-50 text-orange-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function AdminUsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    owners: 0,
    superAdmins: 0,
    comerciales: 0,
    operativos: 0,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<UserForm>(emptyForm);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile?.role === "owner") {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, roleFilter, activeFilter]);

  const requesterEmail = normalizeEmail(profile?.email);

  const visibleUsers = useMemo(() => users, [users]);

  async function loadProfile() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data } = await supabase.auth.getSession();
      const activeEmail = data.session?.user?.email || getSavedEmail();

      if (!activeEmail) {
        setErrorMessage("No hay sesión activa.");
        setLoading(false);
        return;
      }

      const { data: userProfile, error } = await supabase
        .from("users_pumay")
        .select("*")
        .eq("organization_id", 1)
        .eq("email", normalizeEmail(activeEmail))
        .eq("active", true)
        .maybeSingle();

      if (error || !userProfile) {
        setErrorMessage("No se encontró tu perfil activo.");
        setLoading(false);
        return;
      }

      setProfile(userProfile as UserProfile);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo cargar tu perfil.");
      setLoading(false);
    }
  }

  async function loadUsers() {
    if (!profile) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams({
        organizationId: "1",
        requesterEmail,
        role: roleFilter,
        active: activeFilter,
      });

      if (cleanText(search)) params.set("search", cleanText(search));

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const result = await readApiJson(response);

      if (!response.ok || !result.ok) {
        setErrorMessage(getApiErrorMessage(result, "No se pudieron cargar los usuarios."));
        return;
      }

      setUsers(result.users || []);
      setSummary(
        result.summary || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          owners: 0,
          superAdmins: 0,
          comerciales: 0,
          operativos: 0,
        }
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormMode("create");
    setForm(emptyForm);
    setFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openEditForm(user: UserRow) {
    setFormMode("edit");
    setForm({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      role: user.role || "operaciones",
      active: user.active,
    });
    setFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function updateForm(patch: Partial<UserForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        organizationId: 1,
        requesterEmail,
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active,
      };

      const isCreate = formMode === "create";
      const url = isCreate ? "/api/admin/users" : `/api/admin/users/${form.id}`;
      const method = isCreate ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await readApiJson(response);

      if (!response.ok || !result.ok) {
        setErrorMessage(getApiErrorMessage(result, "No se pudo guardar el usuario."));
        return;
      }

      if (isCreate) {
        if (result.emailSent === false) {
          setSuccessMessage(
            `Usuario creado correctamente, pero no se pudo enviar el correo de acceso. ${
              getApiErrorMessage({ error: result.emailWarning }, "Puedes enviarlo manualmente desde la tabla.")
            }`
          );
        } else {
          setSuccessMessage("Usuario creado correctamente. Se enviaron las instrucciones de acceso por correo.");
        }
      } else {
        setSuccessMessage("Usuario actualizado correctamente.");
      }

      setFormOpen(false);
      await loadUsers();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user: UserRow) {
    const nextActive = !user.active;
    const confirmed = window.confirm(
      `${nextActive ? "¿Activar" : "¿Desactivar"} a ${user.name || user.email}?`
    );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: 1,
          requesterEmail,
          name: user.name,
          email: user.email,
          role: user.role,
          active: nextActive,
        }),
      });

      const result = await readApiJson(response);

      if (!response.ok || !result.ok) {
        setErrorMessage(getApiErrorMessage(result, "No se pudo cambiar el estado del usuario."));
        return;
      }

      setSuccessMessage(nextActive ? "Usuario activado correctamente." : "Usuario desactivado correctamente.");
      await loadUsers();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo cambiar el estado del usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function sendAccessEmail(user: UserRow) {
    const confirmed = window.confirm(
      `¿Enviar correo de acceso a ${user.name || user.email}?\n\nEsto dejará una contraseña temporal activa y obligará al usuario a crear su propia contraseña en el primer ingreso.`
    );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/send-internal-user-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: 1,
          requesterEmail,
          recipientName: user.name,
          recipientEmail: user.email,
          role: user.role,
        }),
      });

      const result = await readApiJson(response);

      if (!response.ok || !result.ok) {
        setErrorMessage(getApiErrorMessage(result, "No se pudo enviar el correo de acceso."));
        return;
      }

      setSuccessMessage(`Correo de acceso enviado correctamente a ${user.email}.`);
      await loadUsers();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo enviar el correo de acceso.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          <p className="mt-3 text-sm text-slate-600">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  if (profile && profile.role !== "owner") {
    return (
      <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </button>

          <h1 className="mt-8 text-3xl font-black">Administración de usuarios Pumay</h1>
          <p className="mt-2 text-slate-600">
            Esta sección está reservada para usuarios owner.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-sm md:p-8">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="mb-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </button>

          <p className="text-sm text-white/80">FixLoop | Pumay</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Administración de usuarios Pumay
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-white md:text-base">
            Control superior de perfiles internos, roles y accesos. Los locatarios se administran desde cada local.
          </p>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {successMessage}
          </div>
        )}

        {saving && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-700">
            Procesando cambio...
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-6">
          <MetricCard label="Usuarios internos" value={summary.totalUsers} />
          <MetricCard label="Activos" value={summary.activeUsers} />
          <MetricCard label="Inactivos" value={summary.inactiveUsers} alert />
          <MetricCard label="Owners" value={summary.owners} />
          <MetricCard label="Super admin" value={summary.superAdmins} />
          <MetricCard label="Comercial" value={summary.comerciales} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px_auto_auto] lg:items-end">
            <div>
              <label className="text-sm font-bold text-slate-700">Buscar</label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") loadUsers();
                  }}
                  className="w-full outline-none"
                  placeholder="Nombre, correo o rol interno..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Rol</label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="all">Todos</option>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Activo</label>
              <select
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" />
              Crear usuario interno
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
          <strong>Nota operativa:</strong> esta vista solo administra perfiles internos Pumay.
          Los locatarios, encargados de local y contactos externos se administran desde <strong>Administración de locales</strong>.
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <UserCog className="h-6 w-6 text-emerald-700" />
            <div>
              <h2 className="text-2xl font-black">Usuarios Pumay internos</h2>
              <p className="mt-1 text-sm text-slate-600">
                Perfiles owner, super admin, comercial y equipos operativos.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              <p className="mt-2 text-sm text-slate-600">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Usuario</th>
                    <th className="px-3 py-3">Correo</th>
                    <th className="px-3 py-3">Rol</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Control</th>
                    <th className="px-3 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => {
                    const isSelf = normalizeEmail(user.email) === requesterEmail;

                    return (
                      <tr key={user.id} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-3">
                          <p className="font-black">{user.name}</p>
                          <p className="mt-1 text-xs text-slate-500">ID {user.id}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{user.email}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${roleBadgeClass(user.role)}`}>
                            {roleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${user.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                            {user.active ? "Activo" : "Inactivo"}
                          </span>
                          {user.must_change_password && (
                            <p className="mt-2 text-xs font-bold text-amber-700">Cambio de clave pendiente</p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {user.role === "owner" ? (
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                              <ShieldCheck className="h-4 w-4" />
                              Control superior
                            </div>
                          ) : user.role === "super_admin" ? (
                            <span className="text-xs font-bold text-sky-700">Operación completa</span>
                          ) : user.role === "comercial" ? (
                            <span className="text-xs font-bold text-violet-700">Vista comercial</span>
                          ) : (
                            <span className="text-xs text-slate-500">Gestión operativa</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(user)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                            >
                              <Edit3 className="h-4 w-4" />
                              Editar
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => sendAccessEmail(user)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100"
                              >
                                <Mail className="h-4 w-4" />
                                Enviar acceso
                              </button>
                            )}

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => toggleUser(user)}
                                className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold ${
                                  user.active
                                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                <X className="h-4 w-4" />
                                {user.active ? "Desactivar" : "Activar"}
                              </button>
                            )}

                            {isSelf && (
                              <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                                Tu usuario
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        No hay usuarios internos para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {formOpen && (
          <section className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
            <div className="mx-auto my-8 max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">
                    {formMode === "create" ? "Crear usuario Pumay interno" : "Editar usuario Pumay interno"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Solo owner puede cambiar roles y accesos internos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-2xl border border-slate-300 p-3"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submitForm} className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Nombre"
                    value={form.name}
                    onChange={(value) => updateForm({ name: value })}
                    placeholder="Nombre completo"
                  />

                  <TextField
                    label="Correo"
                    value={form.email}
                    onChange={(value) => updateForm({ email: value })}
                    placeholder="correo@pumay.cl"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Rol interno</span>
                    <select
                      value={form.role}
                      onChange={(event) => updateForm({ role: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                    >
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Toggle
                    label="Usuario activo"
                    checked={form.active}
                    onChange={(checked) => updateForm({ active: checked })}
                  />
                </div>

                {formMode === "create" && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                    <strong>Correo automático:</strong> al crear el usuario se enviarán las instrucciones de acceso con contraseña temporal y cambio obligatorio de contraseña.
                  </div>
                )}

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <strong>Importante:</strong> esta vista no administra locatarios. Los contactos externos se manejan desde el módulo de locales.
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${alert && value > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
        {alert && value > 0 ? <TriangleAlert className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      </div>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
        placeholder={placeholder}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${checked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}
