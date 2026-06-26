"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
  Send,
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

type Location = {
  id: number;
  name: string;
  local_code?: string | null;
  floor?: string | number | null;
  brand_name?: string | null;
  sector?: string | null;
  category?: string | null;
  active?: boolean;
  organization_id: number;
};

const FIXLOOP_SESSION_KEY = "fixloop_pumay_session";

const TYPES = [
  "Cortina / acceso del local",
  "Mantención",
  "Seguridad",
  "Aseo",
  "Operación",
  "Otro",
];

function getSavedSessionEmail() {
  if (typeof window === "undefined") return "";

  try {
    const saved = window.localStorage.getItem(FIXLOOP_SESSION_KEY);
    if (!saved) return "";

    const parsed = JSON.parse(saved);
    return String(parsed?.email || "").toLowerCase().trim();
  } catch {
    return "";
  }
}

function saveProfileSession(profile: UserProfile) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FIXLOOP_SESSION_KEY, JSON.stringify(profile));
  } catch {
    // No bloquea el flujo.
  }
}

function canUsePumayFlows(role?: string | null) {
  const normalizedRole = String(role || "").toLowerCase().trim();

  return [
    "owner",
    "super_admin",
    "operaciones",
    "mantencion",
    "mantención",
    "mantenimiento",
    "comercial",
    "admin",
  ].includes(normalizedRole);
}

function normalizeSearch(value?: string | number | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getLocationLabel(location?: Location | null) {
  if (!location) return "";
  return `${location.local_code ? `${location.local_code} · ` : ""}${location.name}`;
}

function getLocationMeta(location?: Location | null) {
  if (!location) return "";

  const parts = [
    location.brand_name,
    location.sector,
    location.category,
    location.floor ? `Piso ${location.floor}` : null,
  ].filter(Boolean);

  return parts.join(" · ");
}

export default function ReportarLocalPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationComboboxOpen, setLocationComboboxOpen] = useState(false);
  const [type, setType] = useState(TYPES[0]);
  const [priority, setPriority] = useState("Media");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notifyLocalContact, setNotifyLocalContact] = useState(true);
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const comboboxRef = useRef<HTMLDivElement | null>(null);

  const selectedLocation = useMemo(
    () => locations.find((item) => String(item.id) === String(locationId)) || null,
    [locations, locationId]
  );

  const filteredLocations = useMemo(() => {
    const term = normalizeSearch(locationSearch);

    if (!term) return locations.slice(0, 25);

    return locations
      .filter((location) => {
        const haystack = [
          location.local_code,
          location.name,
          location.brand_name,
          location.sector,
          location.category,
          location.floor,
        ]
          .map(normalizeSearch)
          .join(" ");

        return haystack.includes(term);
      })
      .slice(0, 25);
  }, [locations, locationSearch]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!comboboxRef.current) return;
      if (!comboboxRef.current.contains(event.target as Node)) {
        setLocationComboboxOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function load() {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user?.email || getSavedSessionEmail();

    if (!email) {
      setMessage({ kind: "error", text: "Debes iniciar sesión desde el panel principal." });
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from("users_pumay")
      .select("id,name,email,role,active,organization_id")
      .eq("email", email)
      .eq("active", true)
      .maybeSingle();

    if (!userData || !canUsePumayFlows(userData.role)) {
      setMessage({ kind: "error", text: "Tu perfil no está autorizado para reportar casos a locales." });
      setLoading(false);
      return;
    }

    setProfile(userData as UserProfile);
    saveProfileSession(userData as UserProfile);

    const { data: locationData, error: locationError } = await supabase
      .from("locations")
      .select("id,name,local_code,floor,brand_name,sector,category,active,organization_id")
      .eq("organization_id", userData.organization_id)
      .eq("active", true)
      .order("local_code", { ascending: true });

    if (locationError) {
      console.error("Error cargando locales:", locationError);
      setMessage({ kind: "error", text: "No se pudieron cargar los locales activos." });
      setLocations([]);
      setLoading(false);
      return;
    }

    setLocations((locationData || []) as Location[]);
    setLoading(false);
  }

  function handleSelectLocation(location: Location) {
    setLocationId(String(location.id));
    setLocationSearch(getLocationLabel(location));
    setLocationComboboxOpen(false);
  }

  function clearSelectedLocation() {
    setLocationId("");
    setLocationSearch("");
    setLocationComboboxOpen(false);
  }

  function getCreatedIncidentId(result: any) {
    const candidates = [
      result?.incident?.id,
      result?.incidentId,
      result?.id,
      result?.case?.id,
      result?.data?.id,
    ];

    const found = candidates.find((value) => Number(value) > 0);
    return Number(found || 0);
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

  function handlePhotoSelection(fileList: FileList | null) {
    const incomingFiles = Array.from(fileList || []);
    if (incomingFiles.length === 0) return;

    const allowedFiles = incomingFiles.filter((file) => isImageFile(file) || isVideoFile(file));

    if (incomingFiles.length > allowedFiles.length) {
      setMessage({ kind: "error", text: "Solo se permiten imágenes o videos MP4, MOV, WEBM." });
      return;
    }

    const nextFiles = [...photos];

    for (const file of allowedFiles) {
      if (isImageFile(file) && nextFiles.filter(isImageFile).length < 5) {
        nextFiles.push(file);
      }

      if (isVideoFile(file) && nextFiles.filter(isVideoFile).length < 1) {
        nextFiles.push(file);
      }
    }

    if (allowedFiles.some(isImageFile) && nextFiles.filter(isImageFile).length > 5) {
      setMessage({ kind: "error", text: "Solo puedes adjuntar hasta 5 fotos." });
      return;
    }

    if (allowedFiles.some(isVideoFile) && nextFiles.filter(isVideoFile).length > 1) {
      setMessage({ kind: "error", text: "Solo puedes adjuntar hasta 1 video." });
      return;
    }

    setPhotos(nextFiles);
    setMessage(null);
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
  }

  async function uploadIncidentPhotos(incidentId: number) {
    if (!profile || photos.length === 0) return { ok: true };

    const photoFormData = new FormData();
    photoFormData.append("incidentId", String(incidentId));
    photoFormData.append("organizationId", String(profile.organization_id || 1));
    photoFormData.append("photoType", "creation");
    photoFormData.append("uploadedBy", profile.name || "Usuario Pumay");
    photoFormData.append("uploadedByEmail", profile.email || "");
    photoFormData.append("setMainPhoto", "true");

    photos.forEach((file) => {
      photoFormData.append("files", file);
    });

    const response = await fetch("/api/incident-photos", {
      method: "POST",
      body: photoFormData,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      return {
        ok: false,
        error: result?.error || "El caso fue creado, pero no se pudieron subir los adjuntos.",
      };
    }

    return { ok: true };
  }


  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    if (!locationId || !title.trim() || !description.trim()) {
      setMessage({ kind: "error", text: "Debes seleccionar local, título y descripción." });
      return;
    }

    if (photos.filter(isImageFile).length > 5) {
      setMessage({ kind: "error", text: "Solo puedes adjuntar hasta 5 fotos." });
      return;
    }

    if (photos.filter(isVideoFile).length > 1) {
      setMessage({ kind: "error", text: "Solo puedes adjuntar hasta 1 video." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const formData = new FormData();

    formData.append("organizationId", String(profile.organization_id || 1));
    formData.append("reporterName", profile.name || "Usuario Pumay");
    formData.append("reporterEmail", profile.email || "");
    formData.append("userName", profile.name || "Usuario Pumay");
    formData.append("userEmail", profile.email || "");

    formData.append("locationId", locationId);
    formData.append("localCaseLocationId", locationId);
    formData.append("caseType", type);
    formData.append("type", type);
    formData.append("priority", priority);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("notifyLocalContact", String(notifyLocalContact));


    const response = await fetch("/api/pumay-to-local", {
      method: "POST",
      body: formData,
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      setMessage({ kind: "error", text: result?.error || "No se pudo crear el caso al local." });
      setSaving(false);
      return;
    }

    const incidentId = getCreatedIncidentId(result);

    if (photos.length > 0) {
      if (!incidentId) {
        setMessage({
          kind: "error",
          text: "El caso fue creado, pero no se pudo identificar el ID para subir las fotos.",
        });
        setSaving(false);
        return;
      }

      const photoUploadResult = await uploadIncidentPhotos(incidentId);

      if (!photoUploadResult.ok) {
        setMessage({
          kind: "error",
          text: photoUploadResult.error || "El caso fue creado, pero no se pudieron subir los adjuntos.",
        });
        setSaving(false);
        return;
      }
    }

    setMessage({ kind: "ok", text: "Caso enviado correctamente al local." });
    setLocationId("");
    setLocationSearch("");
    setType(TYPES[0]);
    setPriority("Media");
    setTitle("");
    setDescription("");
    setNotifyLocalContact(true);
    setPhotos([]);
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef4fa] p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-700" />
          <p className="mt-3 font-semibold text-slate-700">Cargando formulario...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef4fa] p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-slate-300">FixLoop | Pumay</p>
              <h1 className="mt-1 text-3xl font-bold">Reportar caso a local</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                Crea una observación, falla o incumplimiento que debe gestionar el encargado del local.
              </p>
            </div>

            <a
              href="/"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al panel
            </a>
          </div>
        </header>

        {message && (
          <section
            className={`rounded-3xl border p-4 text-sm font-bold shadow-sm ${
              message.kind === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-950">
                <Building2 className="h-6 w-6 text-sky-700" />
                Nuevo caso para local
              </h2>
              <p className="mt-1 text-sm text-slate-600">El caso quedará trazado como flujo Pumay → Local.</p>
            </div>

            <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
              Pumay → Local
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Local afectado">
                <div ref={comboboxRef} className="relative">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={locationSearch}
                      onFocus={() => setLocationComboboxOpen(true)}
                      onChange={(event) => {
                        setLocationSearch(event.target.value);
                        setLocationId("");
                        setLocationComboboxOpen(true);
                      }}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-11 py-3 pr-20 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Buscar local"
                      autoComplete="off"
                    />

                    <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                      {locationSearch && (
                        <button
                          type="button"
                          onClick={clearSelectedLocation}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Limpiar local"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setLocationComboboxOpen((value) => !value)}
                        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Abrir listado de locales"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {locationComboboxOpen && (
                    <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">
                      {filteredLocations.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">No se encontraron locales.</div>
                      ) : (
                        filteredLocations.map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => handleSelectLocation(location)}
                            className={`w-full rounded-xl px-4 py-3 text-left transition hover:bg-sky-50 ${
                              String(location.id) === String(locationId) ? "bg-sky-50" : "bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-950">{getLocationLabel(location)}</p>
                                {getLocationMeta(location) && (
                                  <p className="mt-0.5 text-xs text-slate-500">{getLocationMeta(location)}</p>
                                )}
                              </div>

                              {String(location.id) === String(locationId) && (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Tipo de caso">
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  {TYPES.map((item) => (
                    <option className="text-slate-900" key={item}>{item}</option>
                  ))}
                </select>
              </Field>

              <Field label="Prioridad">
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option className="text-slate-900">Baja</option>
                  <option className="text-slate-900">Media</option>
                  <option className="text-slate-900">Alta</option>
                </select>
              </Field>
            </div>

            {selectedLocation && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-bold text-slate-900">Local seleccionado:</span>{" "}
                {getLocationLabel(selectedLocation)}
                {getLocationMeta(selectedLocation) ? ` · ${getLocationMeta(selectedLocation)}` : ""}
              </div>
            )}

            <Field label="Título del caso">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                placeholder="Ej: Cortina del local presenta falla al cierre"
              />
            </Field>

            <Field label="Descripción">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-36 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                placeholder="Describe la observación, ubicación exacta, evidencia y acción esperada por parte del local."
              />
            </Field>

            <label className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <input
                type="checkbox"
                checked={notifyLocalContact}
                onChange={(event) => setNotifyLocalContact(event.target.checked)}
                className="mt-1"
              />
              <span>
                <b>Notificar al encargado del local.</b> Se avisará a los usuarios del local que puedan recibir casos.
              </span>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Camera className="h-4 w-4 text-sky-700" />
                Fotos y video del caso opcionales
              </label>

              <input
                type="file"
                accept="image/*,video/mp4,video/quicktime,video/webm,.heic,.heif,.mov,.m4v"
                multiple
                onChange={(event) => {
                  handlePhotoSelection(event.target.files);
                  event.target.value = "";
                }}
                className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />

              <p className="mt-2 text-xs text-slate-500">
                Puedes adjuntar hasta 5 fotos y 1 video. Fotos: JPG, PNG, WEBP o HEIC. Video: MP4, MOV o WEBM.
              </p>

              {photos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {photos.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <span className="min-w-0 truncate">
                        {index + 1}. {file.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Quitar adjunto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-4 text-sm font-bold text-white transition hover:bg-sky-800 disabled:opacity-60 md:w-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar caso al local
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
