"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Settings2,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "../../../app/lib/supabase";

type Team = { id: string; name: string };
type Project = { id: string; name: string };
type Invitation = {
  status: string;
  sent_at?: string | null;
  send_attempts?: number;
  last_error?: string | null;
  provider_message_id?: string | null;
  email_delivery_status?: string | null;
  email_last_event_type?: string | null;
  email_last_event_at?: string | null;
  email_delivered_at?: string | null;
  email_bounced_at?: string | null;
  email_opened_at?: string | null;
  email_clicked_at?: string | null;
  email_delivery_detail?: string | null;
} | null;

type User = {
  id: string;
  full_name: string;
  email: string;
  profile_status: string;
  enterprise_role: string;
  module_role: string;
  license_status: string;
  invitation: Invitation;
  teams: Array<{ id: string; name: string; role: string }>;
};

type Payload = {
  users: User[];
  teams: Team[];
  projects: Project[];
  license: { used: number; capacity: number };
  error?: string;
};

const operationsRoles = [
  { value: "operations_admin", label: "Administrador de Operations", description: "Administra proyectos, equipos, usuarios y todos los casos del módulo." },
  { value: "operations_coordinator", label: "Coordinador", description: "Supervisa los casos del equipo, asigna responsables y controla avances." },
  { value: "operations_operator", label: "Operativo", description: "Ejecuta trabajos asignados, actualiza estados y adjunta evidencias." },
  { value: "operations_reporter", label: "Reportante", description: "Crea casos, adjunta evidencias y sigue los casos que reportó." },
  { value: "operations_observer", label: "Observador", description: "Consulta la información autorizada sin modificar casos ni configuración." },
];

function formatEventDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function invitationView(invitation: Invitation, profileStatus: string) {
  if (profileStatus === "active" || invitation?.status === "accepted") {
    return {
      label: "Invitación aceptada",
      detail: invitation?.email_delivered_at
        ? `Correo entregado · ${formatEventDate(invitation.email_delivered_at)}`
        : "Usuario activo en WAMA",
      tone: "success" as const,
    };
  }

  const state = invitation?.email_delivery_status || invitation?.status || "pending";
  const eventAt =
    invitation?.email_last_event_at ||
    invitation?.sent_at ||
    null;

  if (state === "delivered") {
    return {
      label: "Correo entregado",
      detail: eventAt ? formatEventDate(eventAt) : "El servidor del destinatario confirmó la entrega.",
      tone: "success" as const,
    };
  }

  if (state === "opened") {
    return {
      label: "Correo abierto",
      detail: eventAt ? formatEventDate(eventAt) : "El destinatario abrió el correo.",
      tone: "success" as const,
    };
  }

  if (state === "clicked") {
    return {
      label: "Enlace abierto",
      detail: eventAt ? formatEventDate(eventAt) : "El destinatario abrió un enlace del correo.",
      tone: "success" as const,
    };
  }

  if (state === "delayed") {
    return {
      label: "Entrega demorada",
      detail:
        invitation?.email_delivery_detail ||
        (eventAt ? formatEventDate(eventAt) : "El servidor del destinatario está demorando la entrega."),
      tone: "warning" as const,
    };
  }

  if (["bounced", "failed", "suppressed", "complained"].includes(state)) {
    return {
      label:
        state === "bounced"
          ? "Correo rebotado"
          : state === "suppressed"
            ? "Correo suprimido"
            : state === "complained"
              ? "Marcado como no deseado"
              : "Error de envío",
      detail:
        invitation?.email_delivery_detail ||
        invitation?.last_error ||
        "Revisa el correo y utiliza Reenviar.",
      tone: "error" as const,
    };
  }

  if (state === "sent") {
    return {
      label: "Enviado a Resend",
      detail: eventAt
        ? `${formatEventDate(eventAt)} · esperando confirmación de entrega`
        : "Esperando confirmación de entrega.",
      tone: "warning" as const,
    };
  }

  return {
    label: "Invitación pendiente",
    detail: eventAt ? formatEventDate(eventAt) : "Aún no existe confirmación de entrega.",
    tone: "warning" as const,
  };
}

async function call(url: string, init?: RequestInit) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session)
    throw new Error("Sesión caducada. Vuelve a iniciar sesión.");

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...init?.headers,
    },
  });

  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "No fue posible completar la solicitud.");

  return body;
}

export default function OperationsUsersPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [open, setOpen] = useState(false);
  const [editingTeams, setEditingTeams] = useState<User | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    moduleRole: "operations_operator",
    projectId: "",
    teamIds: [] as string[],
    coordinatorTeamIds: [] as string[],
  });

  const [teamForm, setTeamForm] = useState({
    teamIds: [] as string[],
    coordinatorTeamIds: [] as string[],
  });

  async function load() {
    setError("");
    try {
      setData(await call("/api/operations/users"));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cargar usuarios.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setBusy("invite");
    setError("");

    try {
      await call("/api/operations/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setForm({
        fullName: "",
        email: "",
        moduleRole: "operations_operator",
        projectId: "",
        teamIds: [],
        coordinatorTeamIds: [],
      });

      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo invitar.");
    } finally {
      setBusy("");
    }
  }

  async function resend(profileId: string) {
    setBusy(profileId);
    setError("");

    try {
      await call("/api/operations/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", profileId }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo reenviar.");
    } finally {
      setBusy("");
    }
  }

  async function changeAccess(user: User, value: string) {
    setBusy(user.id);
    setError("");

    try {
      if (value === "enterprise_admin") {
        await call("/api/operations/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "enterpriseRole",
            profileId: user.id,
            enterpriseRole: "admin",
          }),
        });
      } else {
        await call("/api/operations/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "role",
            profileId: user.id,
            moduleRole: value,
          }),
        });
      }

      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cambiar el perfil.",
      );
    } finally {
      setBusy("");
    }
  }

  function openTeams(user: User) {
    setEditingTeams(user);
    setTeamForm({
      teamIds: user.teams.map((team) => team.id),
      coordinatorTeamIds: user.teams
        .filter((team) => team.role === "coordinator")
        .map((team) => team.id),
    });
  }

  async function saveTeams() {
    if (!editingTeams) return;

    setBusy(`teams-${editingTeams.id}`);
    setError("");

    try {
      await call("/api/operations/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "teams",
          profileId: editingTeams.id,
          ...teamForm,
        }),
      });

      setEditingTeams(null);
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron actualizar los equipos.",
      );
    } finally {
      setBusy("");
    }
  }

  const remaining = Math.max(
    0,
    (data?.license.capacity || 0) - (data?.license.used || 0),
  );

  return (
    <div className="grid gap-5">
      <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">
              Usuarios de Operations
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Licencias, perfiles e invitaciones
            </h2>
            <p className="mt-2 text-sm text-[#69717D]">
              Una persona consume un cupo aunque participe en varios equipos.
            </p>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black"
          >
            <UserPlus className="h-4 w-4" />
            Enviar invitación
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-[#F4F8F8] p-4">
          <div className="flex justify-between text-sm">
            <strong>
              {data?.license.used || 0} de {data?.license.capacity || 0} licencias
              utilizadas
            </strong>
            <span>{remaining} disponibles</span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#DDE8E7]">
            <div
              className="h-full bg-[#00B8AE]"
              style={{
                width: `${Math.min(
                  100,
                  ((data?.license.used || 0) /
                    Math.max(1, data?.license.capacity || 1)) *
                    100,
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {open && (
        <form
          onSubmit={invite}
          className="grid gap-4 rounded-[2rem] border border-[#A8DCD7] bg-white p-6"
        >
          <h3 className="text-xl font-black">Nueva invitación</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Nombre completo
              <input
                required
                className="input"
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Correo
              <input
                required
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Proyecto
              <select
                required
                className="input"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">Selecciona un proyecto</option>
                {(data?.projects || []).map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <span className="text-xs font-normal text-[#69717D]">La persona quedará asociada a este proyecto.</span>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Equipo
              <select
                required
                className="input"
                value={form.teamIds[0] || ""}
                onChange={(e) => setForm({ ...form, teamIds: e.target.value ? [e.target.value] : [], coordinatorTeamIds: [] })}
              >
                <option value="">Selecciona un equipo</option>
                {(data?.teams || []).map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <span className="text-xs font-normal text-[#69717D]">Quedará incorporado automáticamente al equipo al aceptar la invitación.</span>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-black">
            Perfil
            <select
              className="input"
              value={form.moduleRole}
              onChange={(e) => setForm({ ...form, moduleRole: e.target.value })}
            >
              {operationsRoles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <span className="rounded-xl bg-[#F4F8F8] px-3 py-2 text-xs font-normal text-[#52606A]">
              {operationsRoles.find((role) => role.value === form.moduleRole)?.description}
            </span>
          </label>

          <button
            disabled={busy === "invite" || remaining < 1}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-5 py-4 font-black disabled:opacity-40"
          >
            {busy === "invite" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Plus />
            )}
            {busy === "invite"
              ? "Creando y enviando…"
              : "Crear licencia y enviar invitación"}
          </button>
        </form>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#DCE1E6] bg-white">
        <div className="divide-y">
          {data?.users.map((user) => {
            const invitationStatus = invitationView(
              user.invitation,
              user.profile_status,
            );
            const canResend =
              user.profile_status !== "active" &&
              user.invitation?.status !== "accepted";
            const failed = invitationStatus.tone === "error";
            const pending = invitationStatus.tone === "warning";
            const isOwner = user.enterprise_role === "owner";
            const selectedValue = isOwner
              ? "owner"
              : user.enterprise_role === "admin"
                ? "enterprise_admin"
                : user.module_role;

            return (
              <article
                key={user.id}
                className="grid gap-4 p-5 lg:grid-cols-[1.2fr_.8fr_.8fr_auto] lg:items-center"
              >
                <div>
                  <strong className="block">{user.full_name}</strong>
                  <span className="text-sm text-[#69717D]">{user.email}</span>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {isOwner && (
                      <span className="rounded-full bg-[#DFFFFA] px-2 py-1 text-xs font-black text-[#007E76]">
                        Propietario
                      </span>
                    )}

                    {user.enterprise_role === "admin" && (
                      <span className="rounded-full bg-[#DFFFFA] px-2 py-1 text-xs font-black text-[#007E76]">
                        Administrador de la empresa
                      </span>
                    )}

                    {user.teams.map((team) => (
                      <span
                        key={team.id}
                        className="rounded-full bg-[#EEF5F4] px-2 py-1 text-xs font-bold"
                      >
                        Equipo {team.name} ·{" "}
                        {team.role === "coordinator"
                          ? "Coordinador"
                          : "Integrante"}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => openTeams(user)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#C9D3D7] px-3 py-2 text-xs font-black text-[#334047] hover:border-[#00B8AE]"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Gestionar equipos
                  </button>
                </div>

                <select
                  disabled={busy === user.id || isOwner}
                  value={selectedValue}
                  onChange={(e) => void changeAccess(user, e.target.value)}
                  className="input text-sm"
                >
                  {isOwner && <option value="owner">Propietario de la empresa</option>}
                  {!isOwner && (
                    <>
                      <option value="enterprise_admin">
                        Administrador de la empresa · acceso total
                      </option>
                      {operationsRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                <div
                  className={`rounded-2xl p-3 text-xs font-bold ${
                    failed
                      ? "bg-red-50 text-red-700"
                      : pending
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {failed ? (
                    <XCircle className="mb-1 h-4 w-4" />
                  ) : pending ? (
                    <Mail className="mb-1 h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="mb-1 h-4 w-4" />
                  )}

                  <span className="block">{invitationStatus.label}</span>
                  <span className="mt-1 block font-normal leading-5 opacity-80">
                    {invitationStatus.detail}
                  </span>
                </div>

                <button
                  disabled={!canResend || busy === user.id}
                  onClick={() => void resend(user.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-black disabled:opacity-30"
                >
                  {busy === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Reenviar
                </button>
              </article>
            );
          })}

          {!data?.users.length && (
            <p className="p-10 text-center text-sm text-[#69717D]">
              Aún no hay usuarios licenciados.
            </p>
          )}
        </div>
      </section>

      {editingTeams && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/55 p-4">
          <section className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">
                  Autogestión de equipos
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {editingTeams.full_name}
                </h3>
                <p className="mt-1 text-sm text-[#69717D]">
                  {editingTeams.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingTeams(null)}
                className="rounded-full border p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid max-h-[45vh] gap-2 overflow-y-auto sm:grid-cols-2">
              {data?.teams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#DCE1E6] p-3 text-sm font-bold"
                >
                  <input
                    type="checkbox"
                    checked={teamForm.teamIds.includes(team.id)}
                    onChange={(e) =>
                      setTeamForm({
                        ...teamForm,
                        teamIds: e.target.checked
                          ? [...teamForm.teamIds, team.id]
                          : teamForm.teamIds.filter((id) => id !== team.id),
                        coordinatorTeamIds: e.target.checked
                          ? teamForm.coordinatorTeamIds
                          : teamForm.coordinatorTeamIds.filter(
                              (id) => id !== team.id,
                            ),
                      })
                    }
                  />

                  <span className="min-w-0 flex-1 truncate">{team.name}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTeams(null)}
                className="rounded-full border px-5 py-3 text-sm font-black"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void saveTeams()}
                disabled={busy === `teams-${editingTeams.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black disabled:opacity-50"
              >
                {busy === `teams-${editingTeams.id}` && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Guardar equipos
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
