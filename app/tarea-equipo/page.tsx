"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  organization_id: number;
};

type TeamOption = {
  label: string;
  area: string;
  visibleText: string;
  chips: string[];
};

const APP_NAME = "FixLoop | Pumay";
const FIXLOOP_SESSION_KEY = "fixloop_pumay_session";

const TEAM_OPTIONS: TeamOption[] = [
  {
    label: "Equipo Operaciones",
    area: "operaciones",
    visibleText:
      "Esta tarea será visible para el Equipo Operaciones. Todos los usuarios activos con rol Operaciones, además de owner y super_admin, podrán verla según sus permisos.",
    chips: ["Operaciones", "Owner", "Super admin"],
  },
  {
    label: "Equipo Mantención",
    area: "mantencion",
    visibleText:
      "Esta tarea será visible para el Equipo Mantención. Todos los usuarios activos con rol Mantención podrán verla y recibir notificación si tienen notificaciones activadas.",
    chips: ["Mantención"],
  },
  {
    label: "Equipo Seguridad",
    area: "seguridad",
    visibleText:
      "Esta tarea será visible para el Equipo Seguridad. Todos los usuarios activos con rol Seguridad podrán verla y recibir notificación si tienen notificaciones activadas.",
    chips: ["Seguridad"],
  },
  {
    label: "Equipo Aseo",
    area: "aseo",
    visibleText:
      "Esta tarea será visible para el Equipo Aseo. Todos los usuarios activos con rol Aseo podrán verla y recibir notificación si tienen notificaciones activadas.",
    chips: ["Aseo"],
  },
  {
    label: "Equipo Comercial",
    area: "comercial",
    visibleText:
      "Esta tarea será visible para el Equipo Comercial. Todos los usuarios activos con rol Comercial podrán verla y recibir notificación si tienen notificaciones activadas.",
    chips: ["Comercial"],
  },
  {
    label: "Todos responsables Pumay",
    area: "todos",
    visibleText:
      "Esta tarea será visible para todos los equipos internos responsables. Se notificará por área y no a una persona específica.",
    chips: ["Operaciones", "Mantención", "Seguridad", "Aseo", "Comercial"],
  },
];

const TASK_TYPES = [
  "Tarea operacional",
  "Aseo",
  "Mantención",
  "Seguridad",
  "Operaciones",
  "Comercial",
  "Revisión preventiva",
  "Apoyo a local",
  "Novedad interna",
  "Otro",
];

function normalizeRole(role?: string | null) {
  return String(role || "").toLowerCase().trim();
}

function canUseInternalTask(role?: string | null) {
  const value = normalizeRole(role);
  return [
    "owner",
    "super_admin",
    "operaciones",
    "mantencion",
    "mantención",
    "mantenimiento",
    "seguridad",
    "aseo",
    "comercial",
    "admin",
  ].includes(value);
}

function getSavedProfileSession(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(FIXLOOP_SESSION_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as UserProfile;
    if (!parsed?.email || !parsed?.organization_id) return null;

    return parsed;
  } catch {
    window.localStorage.removeItem(FIXLOOP_SESSION_KEY);
    return null;
  }
}

function saveProfileSession(profile: UserProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FIXLOOP_SESSION_KEY, JSON.stringify(profile));
}

export default function TareaEquipoPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [teamLabel, setTeamLabel] = useState("Equipo Mantención");
  const [taskType, setTaskType] = useState("Tarea operacional");
  const [priority, setPriority] = useState("Media");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const selectedTeam = useMemo(() => {
    return TEAM_OPTIONS.find((team) => team.label === teamLabel) || TEAM_OPTIONS[1];
  }, [teamLabel]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setErrorMessage("");

    const savedProfile = getSavedProfileSession();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const activeEmail = String(session?.user?.email || savedProfile?.email || "")
      .toLowerCase()
      .trim();

    if (!activeEmail) {
      setProfile(null);
      setErrorMessage("Debes iniciar sesión desde el panel principal.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("users_pumay")
      .select("*")
      .eq("email", activeEmail)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      setProfile(null);
      setErrorMessage("No se encontró un perfil activo para esta sesión.");
      setLoading(false);
      return;
    }

    const activeProfile = data as UserProfile;

    if (!canUseInternalTask(activeProfile.role)) {
      setProfile(activeProfile);
      setErrorMessage("Tu perfil no tiene permiso para crear tareas internas.");
      setLoading(false);
      return;
    }

    setProfile(activeProfile);
    saveProfileSession(activeProfile);
    setLoading(false);
  }

  function isImageFile(file: File) {
    const name = file.name.toLowerCase();
    return file.type.startsWith("image/") || name.endsWith(".heic") || name.endsWith(".heif");
  }

  function isVideoFile(file: File) {
    const name = file.name.toLowerCase();
    return (
      file.type.startsWith("video/") ||
      name.endsWith(".mp4") ||
      name.endsWith(".mov") ||
      name.endsWith(".webm") ||
      name.endsWith(".m4v")
    );
  }

  function addPhotos(fileList: FileList | null) {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const allowed = incoming.filter((file) => isImageFile(file) || isVideoFile(file));

    setPhotos((current) => {
      const next = [...current];

      for (const file of allowed) {
        if (isImageFile(file) && next.filter(isImageFile).length < 5) {
          next.push(file);
        }

        if (isVideoFile(file) && next.filter(isVideoFile).length < 1) {
          next.push(file);
        }
      }

      return next;
    });
  }

  function removePhoto(indexToRemove: number) {
    setPhotos((current) => current.filter((_, index) => index !== indexToRemove));
  }

  async function uploadPhotos(incidentId: number) {
    if (!profile || photos.length === 0) return;

    const imageFiles = photos.filter(isImageFile);
    const videoFiles = photos.filter(isVideoFile);

    if (imageFiles.length > 5) {
      throw new Error("Solo puedes adjuntar hasta 5 fotos.");
    }

    if (videoFiles.length > 1) {
      throw new Error("Solo puedes adjuntar hasta 1 video.");
    }

    const tooLargeImage = imageFiles.find((file) => file.size > 10 * 1024 * 1024);
    if (tooLargeImage) {
      throw new Error(
        `La foto "${tooLargeImage.name}" pesa más de 10 MB. Usa una imagen más liviana o envíala como captura.`
      );
    }

    const tooLargeVideo = videoFiles.find((file) => file.size > 50 * 1024 * 1024);
    if (tooLargeVideo) {
      throw new Error(
        `El video "${tooLargeVideo.name}" pesa más de 50 MB. Usa un video más corto o comprimido.`
      );
    }

    /*
      Subimos uno por uno para evitar que el celular o Vercel rechacen
      una solicitud demasiado pesada cuando se adjuntan varias fotos/videos.
    */
    for (let index = 0; index < photos.length; index += 1) {
      const file = photos[index];
      const isFirstImage = isImageFile(file) && imageFiles[0] === file;

      const formData = new FormData();
      formData.append("incidentId", String(incidentId));
      formData.append("organizationId", String(profile.organization_id));
      formData.append("photoType", "creation");
      formData.append("uploadedBy", profile.name || "");
      formData.append("uploadedByEmail", profile.email || "");
      formData.append("setMainPhoto", isFirstImage ? "true" : "false");
      formData.append("files", file);

      const response = await fetch("/api/incident-photos", {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      let result: any = {};

      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        result = {};
      }

      if (!response.ok || !result.ok) {
        if (response.status === 413) {
          throw new Error(
            `El adjunto "${file.name}" es demasiado pesado para subir desde el celular. Prueba con una foto más liviana o un video más corto.`
          );
        }

        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : `No se pudo subir el adjunto "${file.name}".`
        );
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      setErrorMessage("Debes iniciar sesión desde el panel principal.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Debes ingresar un título para la tarea.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Debes ingresar una descripción para la tarea.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/internal-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: profile.organization_id,
          createdByName: profile.name,
          createdByEmail: profile.email,
          createdByRole: profile.role,
          assignedTo: selectedTeam.label,
          targetArea: selectedTeam.area,
          responsibleArea: selectedTeam.area,
          type: taskType,
          priority,
          title: title.trim(),
          description: description.trim(),
          photoUrl: null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(
          typeof result?.error === "string"
            ? result.error
            : "No se pudo crear la tarea interna."
        );
        setSaving(false);
        return;
      }

      const createdIncidentId = Number(result?.incident?.id || 0);

      if (createdIncidentId && photos.length > 0) {
        await uploadPhotos(createdIncidentId);
      }

      setSuccessMessage(
        `Tarea interna creada correctamente para ${selectedTeam.label}. Será visible para el equipo asignado.`
      );

      setTitle("");
      setDescription("");
      setTaskType("Tarea operacional");
      setPriority("Media");
      setPhotos([]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo crear la tarea interna."
      );
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[#eef4fa] p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </button>

        <header className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 p-5 text-white shadow-sm sm:rounded-[2rem] sm:p-8">
          <p className="text-sm text-slate-300">{APP_NAME}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Asignar tarea a equipo Pumay
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-200 sm:mt-4 sm:text-lg">
            Crea una tarea interna para Operaciones, Mantención, Seguridad, Aseo,
            Comercial o todos los equipos responsables Pumay.
          </p>
        </header>

        {loading && (
          <div className="mb-4 rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-800">
            Cargando sesión...
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {successMessage}
          </div>
        )}

        {profile && canUseInternalTask(profile.role) && (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="flex items-center gap-3 text-3xl font-black text-slate-950">
                  <ClipboardList className="h-8 w-8 text-indigo-700" />
                  Nueva tarea interna
                </h2>
                <p className="mt-2 max-w-3xl text-slate-600">
                  La tarea quedará trazada como flujo Pumay → Equipo interno y será
                  visible para todos los usuarios activos del equipo seleccionado.
                </p>
              </div>

              <span className="w-fit rounded-3xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-700">
                Pumay → Equipo interno
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Equipo responsable
                </label>
                <select
                  value={teamLabel}
                  onChange={(event) => setTeamLabel(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {TEAM_OPTIONS.map((team) => (
                    <option key={team.label} value={team.label}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-900">
                <p className="text-sm font-black">Visibilidad de la tarea</p>
                <p className="mt-2 text-sm leading-6">{selectedTeam.visibleText}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTeam.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-700"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Tipo de tarea
                  </label>
                  <select
                    value={taskType}
                    onChange={(event) => setTaskType(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    {TASK_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option>Baja</option>
                    <option>Media</option>
                    <option>Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Título de la tarea
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej: Revisar baños del segundo piso"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe la tarea, ubicación, plazo esperado o antecedente relevante."
                  className="min-h-36 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                  <ImageIcon className="h-4 w-4 text-indigo-700" />
                  Fotos y video adjuntos opcionales
                </label>
                <input
                  type="file"
                  accept="image/*,video/mp4,video/quicktime,video/webm,.heic,.heif,.mov,.m4v"
                  multiple
                  onChange={(event) => {
                    addPhotos(event.target.files);
                    event.target.value = "";
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Puedes adjuntar hasta 5 fotos y 1 video. Fotos: JPG, PNG, WEBP o HEIC. Video: MP4, MOV o WEBM.
                </p>

                {photos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {photos.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <span className="min-w-0 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="ml-3 inline-flex items-center gap-1 rounded-xl px-2 py-1 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <Users className="mt-0.5 h-4 w-4 text-indigo-700" />
                  <span>
                    No se asigna a una persona individual. La tarea queda asociada al
                    equipo funcional seleccionado.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-800 disabled:opacity-60"
                >
                  {saving ? (
                    "Creando tarea..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Crear tarea interna
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {!loading && !profile && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-600" />
            <p className="mt-3 text-lg font-black text-slate-900">
              No hay sesión activa válida.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Vuelve al panel principal, inicia sesión y entra nuevamente a esta página.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
