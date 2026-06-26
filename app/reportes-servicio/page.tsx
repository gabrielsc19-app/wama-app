"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardList,
  Loader2,
  LogOut,
  Send,
  Shield,
  Sparkles,
  TriangleAlert,
  Users,
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

type ChecklistTemplate = {
  id: number;
  title: string;
  frequency: "diario" | "semanal" | "quincenal" | "mensual";
  active: boolean;
  requires_photo: boolean;
  organization_id: number;
  sector: string | null;
};

type ChecklistResponse = {
  id: number;
  template_id: number;
  service_date: string;
  status: "si" | "no" | "pendiente";
  observation: string | null;
  photo_url: string | null;
};

type ChecklistState = {
  status: "si" | "no" | "pendiente";
  observation: string;
  photo: File | null;
};

type QuickTemplate = {
  title: string;
  reportType: string;
  description: string;
  priority: string;
};

const FIXLOOP_SESSION_KEY = "fixloop_pumay_session";

const labels: Record<string, string> = {
  diario: "Tareas diarias",
  semanal: "Tareas semanales",
  quincenal: "Tareas quincenales",
  mensual: "Tareas mensuales",
};

const reportTypesAseo = [
  "Reporte diario",
  "Hallazgo de aseo",
  "Tarea cumplida",
  "Tarea pendiente",
  "Solicitud de apoyo",
  "Otro",
];

const reportTypesSeguridad = [
  "Ronda",
  "Novedad informativa",
  "Incidente / requiere gestión",
  "Apoyo operacional",
  "Otro",
];

const priorities = ["Baja", "Media", "Alta", "Crítica"];

const seguridadTemplates: QuickTemplate[] = [
  {
    title: "Ronda sin novedades",
    reportType: "Ronda",
    priority: "Baja",
    description:
      "Se realiza ronda preventiva por los sectores asignados. No se registran novedades relevantes.",
  },
  {
    title: "Novedad informativa",
    reportType: "Novedad informativa",
    priority: "Media",
    description:
      "Se informa una novedad observada durante el turno, sin requerir gestión inmediata.",
  },
  {
    title: "Incidente / requiere gestión",
    reportType: "Incidente / requiere gestión",
    priority: "Alta",
    description:
      "Se registra un incidente o situación que requiere revisión, apoyo o gestión del equipo Pumay.",
  },
];

const aseoTemplates: QuickTemplate[] = [
  {
    title: "Checklist completado",
    reportType: "Tarea cumplida",
    priority: "Baja",
    description:
      "Se completa revisión de aseo del sector asignado, dejando registro para seguimiento.",
  },
  {
    title: "Reposición requerida",
    reportType: "Solicitud de apoyo",
    priority: "Media",
    description:
      "Se requiere reposición de insumos o apoyo operativo en el sector indicado.",
  },
  {
    title: "Hallazgo de aseo",
    reportType: "Hallazgo de aseo",
    priority: "Media",
    description:
      "Durante la revisión se detecta un hallazgo que requiere seguimiento del equipo Pumay.",
  },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function norm(role?: string | null) {
  return String(role || "").toLowerCase().trim();
}

function isAseoRole(role?: string | null) {
  const value = norm(role);
  return value === "aseo" || value.includes("aseo");
}

function isSeguridadRole(role?: string | null) {
  const value = norm(role);
  return value === "seguridad" || value.includes("seguridad");
}

function canUseServiceReports(role?: string | null) {
  return isAseoRole(role) || isSeguridadRole(role);
}

function savedEmail() {
  if (typeof window === "undefined") return "";

  try {
    const saved = localStorage.getItem(FIXLOOP_SESSION_KEY);
    return saved ? String(JSON.parse(saved)?.email || "").toLowerCase().trim() : "";
  } catch {
    return "";
  }
}

function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(FIXLOOP_SESSION_KEY, JSON.stringify(profile));
  } catch {
    // No bloquea el flujo.
  }
}

function clearProfile() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(FIXLOOP_SESSION_KEY);
  } catch {
    // No bloquea el flujo.
  }
}

function statusLabel(status: string) {
  if (status === "si") return "Sí";
  if (status === "no") return "No";
  return "Pendiente";
}

export default function ServiceReportPage() {
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [reportDate, setReportDate] = useState(todayIso());
  const [reportType, setReportType] = useState("Reporte diario");
  const [priority, setPriority] = useState("Media");
  const [sector, setSector] = useState("");
  const [shift, setShift] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const [state, setState] = useState<Record<number, ChecklistState>>({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const aseo = isAseoRole(profile?.role);
  const seguridad = isSeguridadRole(profile?.role);
  const serviceLabel = aseo ? "Aseo" : seguridad ? "Seguridad" : "Servicio";
  const header = aseo
    ? "from-slate-950 via-slate-900 to-emerald-800"
    : "from-slate-950 via-slate-900 to-rose-800";
  const button = aseo
    ? "bg-emerald-700 hover:bg-emerald-800"
    : "bg-rose-700 hover:bg-rose-800";
  const iconTone = aseo ? "text-emerald-700" : "text-rose-700";
  const reportTypes = aseo ? reportTypesAseo : reportTypesSeguridad;
  const quickTemplates = aseo ? aseoTemplates : seguridadTemplates;

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile && aseo) loadChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, reportDate]);

  useEffect(() => {
    if (profile) {
      setReportType(aseo ? reportTypesAseo[0] : reportTypesSeguridad[0]);
    }
  }, [profile, aseo]);

  async function loadSession() {
    setLoading(true);
    setError("");

    const { data } = await supabase.auth.getSession();
    const activeEmail = data.session?.user?.email || savedEmail();

    if (!activeEmail) {
      setProfile(null);
      setLoading(false);
      return;
    }

    await loadProfile(activeEmail);
    setLoading(false);
  }

  async function loadProfile(userEmail: string) {
    const clean = userEmail.toLowerCase().trim();

    const { data, error } = await supabase
      .from("users_pumay")
      .select("*")
      .eq("email", clean)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      setProfile(null);
      setError("No se encontró un perfil activo para este usuario.");
      return;
    }

    const activeProfile = data as UserProfile;
    setProfile(activeProfile);
    saveProfile(activeProfile);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAppLoading(true);
    setError("");

    const clean = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: clean,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setAppLoading(false);
      return;
    }

    await loadProfile(clean);
    setAppLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    clearProfile();
    setProfile(null);
    setEmail("");
    setPassword("");
  }

  async function loadChecklist() {
    if (!profile) return;

    const date = new Date(`${reportDate}T12:00:00`);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const response = await fetch(
      `/api/cleaning-checklist?organizationId=${profile.organization_id}&month=${month}&year=${year}&serviceDate=${reportDate}`
    );
    const json = await response.json();

    if (!response.ok || !json.ok) {
      setError(json.error || "No se pudo cargar el checklist de aseo.");
      return;
    }

    const nextTemplates = (json.templates || []) as ChecklistTemplate[];
    const nextResponses = (json.responses || []) as ChecklistResponse[];

    setTemplates(nextTemplates);
    setResponses(nextResponses);

    const nextState: Record<number, ChecklistState> = {};
    nextTemplates.forEach((item) => {
      const existing = nextResponses.find((response) => response.template_id === item.id);
      nextState[item.id] = {
        status: existing?.status || "pendiente",
        observation: existing?.observation || "",
        photo: null,
      };
    });

    setState(nextState);
  }

  function updateItem(id: number, patch: Partial<ChecklistState>) {
    setState((current) => ({
      ...current,
      [id]: {
        status: current[id]?.status || "pendiente",
        observation: current[id]?.observation || "",
        photo: current[id]?.photo || null,
        ...patch,
      },
    }));
  }

  async function submitChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    setAppLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      const answers = templates.map((template) => {
        const item = state[template.id] || {
          status: "pendiente",
          observation: "",
          photo: null,
        };

        if (item.photo) {
          formData.append(`photo_${template.id}`, item.photo);
        }

        return {
          templateId: template.id,
          status: item.status,
          observation: item.observation,
        };
      });

      formData.append("organizationId", String(profile.organization_id));
      formData.append("serviceDate", reportDate);
      formData.append("completedByName", profile.name);
      formData.append("completedByEmail", profile.email);
      formData.append("answers", JSON.stringify(answers));

      const response = await fetch("/api/cleaning-checklist", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        setError(json.error || "No se pudo guardar el checklist.");
        return;
      }

      setSuccess(`Checklist de aseo guardado correctamente. Tareas registradas: ${json.saved}.`);
      await loadChecklist();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el checklist de aseo.");
    } finally {
      setAppLoading(false);
    }
  }

  async function createServiceReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    if (!canUseServiceReports(profile.role)) {
      setError("Tu perfil no está autorizado para generar reportes.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Debes completar título y descripción.");
      return;
    }

    setAppLoading(true);
    setError("");
    setSuccess("");

    try {
      const enrichedDescription = [
        sector.trim() ? `Sector: ${sector.trim()}` : "",
        shift.trim() ? `Turno: ${shift.trim()}` : "",
        priority.trim() ? `Prioridad: ${priority.trim()}` : "",
        "",
        description.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      const formData = new FormData();
      formData.append("userEmail", profile.email);
      formData.append("reportType", reportType);
      formData.append("title", title.trim());
      formData.append("description", enrichedDescription);
      formData.append("serviceDate", reportDate);

      if (photo) formData.append("photo", photo);

      const response = await fetch("/api/service-reports", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        setError(json.error || "No se pudo guardar el reporte.");
        return;
      }

      await fetch("/api/push/notify-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: profile.organization_id,
          title: `FixLoop | Pumay: nuevo reporte de ${serviceLabel}`,
          body: `${profile.name} registró: ${title.trim()}`,
          url: aseo ? "/informes/aseo" : "/informes/seguridad",
        }),
      });

      setSuccess("Reporte enviado correctamente a Pumay para seguimiento operativo.");
      setTitle("");
      setDescription("");
      setSector("");
      setShift("");
      setPriority("Media");
      setPhoto(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar el reporte.");
    } finally {
      setAppLoading(false);
    }
  }

  function applyTemplate(template: QuickTemplate) {
    setTitle(template.title);
    setReportType(template.reportType);
    setPriority(template.priority);
    setDescription(template.description);
    setSuccess("Plantilla aplicada. Completa sector, turno y ajusta el detalle si corresponde.");
    setError("");
  }

  const groups = useMemo(() => {
    const grouped: Record<string, ChecklistTemplate[]> = {
      diario: [],
      semanal: [],
      quincenal: [],
      mensual: [],
    };

    templates.forEach((template) => grouped[template.frequency].push(template));

    return grouped;
  }, [templates]);

  const metrics = useMemo(() => {
    const total = templates.length;
    const values = Object.values(state);
    const si = values.filter((item) => item.status === "si").length;
    const no = values.filter((item) => item.status === "no").length;
    const pendiente = values.filter((item) => item.status === "pendiente").length;
    const cumplimiento = total ? Math.round((si / total) * 100) : 0;

    return { total, si, no, pendiente, cumplimiento };
  }, [templates, state]);

  const progress = useMemo(() => {
    const fields = [reportDate, reportType, priority, title, description, sector, shift];
    const completed = fields.filter((field) => String(field || "").trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [reportDate, reportType, priority, title, description, sector, shift]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="mt-3">Cargando sesión...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">FixLoop | Pumay</h1>
          <p className="mt-2 text-sm text-slate-600">
            Inicia sesión para registrar reportes.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
              placeholder="correo@pumay.cl"
              type="email"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
              placeholder="Contraseña"
              type="password"
            />
            <button
              disabled={appLoading}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {appLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!canUseServiceReports(profile.role)) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </button>

          <h1 className="mt-8 text-3xl font-black text-slate-950">
            Acceso restringido
          </h1>
          <p className="mt-2 text-slate-600">
            Esta sección está habilitada solo para usuarios con rol aseo o seguridad.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-900"
          >
            Cerrar sesión
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className={`rounded-3xl bg-gradient-to-r ${header} p-6 text-white shadow-sm md:p-8`}>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="mb-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al panel
              </button>

              <p className="text-sm text-white/80">FixLoop | Pumay</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                Reporte de {serviceLabel} a Pumay
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-white md:text-base">
                Registra novedades, tareas cumplidas, hallazgos, apoyos requeridos
                o eventos ocurridos durante el servicio.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm md:min-w-[260px]">
              <p className="text-sm text-white/80">Sesión activa</p>
              <p className="mt-1 text-xl font-bold">{profile.name}</p>
              <p className="text-sm text-white/80">Rol: {profile.role}</p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        {appLoading && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-700">
            Procesando...
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Servicio"
            value={serviceLabel}
            icon={aseo ? <Sparkles className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
            tone={aseo ? "emerald" : "rose"}
          />
          <MetricCard
            label="Fecha"
            value={reportDate}
            icon={<ClipboardList className="h-6 w-6" />}
            tone="sky"
          />
          <MetricCard
            label="Avance reporte"
            value={`${progress}%`}
            icon={<CheckCircle2 className="h-6 w-6" />}
            tone={progress >= 80 ? "emerald" : "amber"}
          />
        </section>

        {aseo && (
          <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-6 w-6 text-emerald-700" />
                  <h2 className="text-2xl font-black">Checklist mensual de Aseo</h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Marca cada tarea como Sí, No o Pendiente. Las observaciones y fotos son opcionales.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                Cumplimiento: {metrics.cumplimiento}%
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric label="Total" value={metrics.total} />
              <Metric label="Sí" value={metrics.si} />
              <Metric label="No" value={metrics.no} />
              <Metric label="Pendiente" value={metrics.pendiente} />
            </div>

            <form onSubmit={submitChecklist} className="mt-6 space-y-6">
              <div>
                <label className="text-sm font-bold text-slate-700">Fecha del checklist</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(event) => setReportDate(event.target.value)}
                  className="mt-2 rounded-2xl border px-4 py-3"
                />
              </div>

              {(["diario", "semanal", "quincenal", "mensual"] as const).map((frequency) => (
                <ChecklistGroup
                  key={frequency}
                  title={labels[frequency]}
                  items={groups[frequency] || []}
                  state={state}
                  responses={responses}
                  onChange={updateItem}
                />
              ))}

              <button
                disabled={appLoading || templates.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                Guardar checklist de aseo
              </button>
            </form>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              {aseo ? (
                <Sparkles className={`h-6 w-6 ${iconTone}`} />
              ) : (
                <Shield className={`h-6 w-6 ${iconTone}`} />
              )}
              <div>
                <h2 className="text-2xl font-black">Nuevo reporte de {serviceLabel}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {seguridad
                    ? "Selecciona si corresponde a ronda, novedad o incidente, y luego completa el detalle."
                    : "Usa una plantilla rápida o completa el formulario manualmente."}
                </p>
              </div>
            </div>

            <a
              href="/tarea-equipo"
              className="inline-flex w-fit items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100"
            >
              <Users className="h-4 w-4" />
              Reportar caso al equipo Pumay
            </a>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {quickTemplates.map((template) => (
              <button
                key={template.title}
                type="button"
                onClick={() => applyTemplate(template)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              >
                <p className="font-black text-slate-900">{template.title}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {template.reportType} · {template.priority}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {template.description}
                </p>
              </button>
            ))}
          </div>

          {seguridad && (
            <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-5 w-5 shrink-0 text-rose-700" />
                <div>
                  <h3 className="text-base font-black text-slate-950">
                    Clasificación del reporte de Seguridad
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">
                    Separa rondas, novedades e incidentes para que el informe de Seguridad quede más limpio y fácil de revisar.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setReportType("Ronda");
                    setPriority("Baja");
                    setTitle("Ronda sin novedades");
                    setDescription("Se realiza ronda preventiva por los sectores asignados. No se registran novedades relevantes.");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    reportType === "Ronda"
                      ? "border-rose-400 bg-white shadow-sm"
                      : "border-rose-100 bg-rose-50 hover:bg-white"
                  }`}
                >
                  <p className="font-black text-slate-900">Ronda</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-rose-700">Registro preventivo</p>
                  <p className="mt-2 text-sm text-slate-600">Para recorridos realizados con o sin novedades menores.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReportType("Novedad informativa");
                    setPriority("Media");
                    setTitle("Novedad informativa");
                    setDescription("Se informa una novedad observada durante el turno, sin requerir gestión inmediata.");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    reportType === "Novedad informativa"
                      ? "border-rose-400 bg-white shadow-sm"
                      : "border-rose-100 bg-rose-50 hover:bg-white"
                  }`}
                >
                  <p className="font-black text-slate-900">Novedad</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-rose-700">Informativo</p>
                  <p className="mt-2 text-sm text-slate-600">Para dejar constancia de algo observado sin abrir una gestión urgente.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReportType("Incidente / requiere gestión");
                    setPriority("Alta");
                    setTitle("Incidente de seguridad");
                    setDescription("Se registra un incidente o situación que requiere revisión, apoyo o gestión del equipo Pumay.");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    reportType === "Incidente / requiere gestión"
                      ? "border-rose-400 bg-white shadow-sm"
                      : "border-rose-100 bg-rose-50 hover:bg-white"
                  }`}
                >
                  <p className="font-black text-slate-900">Incidente</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-rose-700">Requiere gestión</p>
                  <p className="mt-2 text-sm text-slate-600">Para hechos que deben ser revisados, tomados o cerrados por Pumay.</p>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={createServiceReport} className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Fecha">
                <input
                  type="date"
                  value={reportDate}
                  onChange={(event) => setReportDate(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3"
                />
              </Field>

              <Field label="Tipo">
                <select
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3"
                >
                  {reportTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>

              <Field label="Prioridad">
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3"
                >
                  {priorities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>

              <Field label="Turno">
                <input
                  value={shift}
                  onChange={(event) => setShift(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3"
                  placeholder="Ej: Día / Noche"
                />
              </Field>
            </div>

            <Field label="Sector">
              <input
                value={sector}
                onChange={(event) => setSector(event.target.value)}
                className="w-full rounded-2xl border px-4 py-3"
                placeholder="Ej: Pajaritos, Chacabuco, pasillo central, baños..."
              />
            </Field>

            <Field label="Título">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border px-4 py-3"
                placeholder={aseo ? "Ej: Apoyo en sector patio central" : "Ej: Ronda realizada sin novedades"}
              />
            </Field>

            <Field label="Detalle">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[150px] w-full rounded-2xl border px-4 py-3"
                placeholder="Describe la novedad, sector, acción realizada o antecedente relevante."
              />
            </Field>

            <Field label="Fotografía opcional">
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-600">
                <Camera className="h-4 w-4" />
                <span className="truncate">{photo ? photo.name : "Adjuntar imagen"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setPhoto(event.target.files?.[0] || null)}
                />
              </label>
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                disabled={appLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white disabled:opacity-60 ${button}`}
              >
                <Send className="h-4 w-4" />
                Enviar reporte de {serviceLabel}
              </button>

              <a
                href="/tarea-equipo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100"
              >
                <ClipboardList className="h-4 w-4" />
                Reportar caso al equipo Pumay
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
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
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "emerald" | "rose" | "sky" | "amber";
}) {
  const classes: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-3 ${classes[tone]}`}>{icon}</div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-xl font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ChecklistGroup({
  title,
  items,
  state,
  responses,
  onChange,
}: {
  title: string;
  items: ChecklistTemplate[];
  state: Record<number, ChecklistState>;
  responses: ChecklistResponse[];
  onChange: (id: number, patch: Partial<ChecklistState>) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>

      <div className="mt-4 space-y-4">
        {items.map((item) => {
          const current = state[item.id] || {
            status: "pendiente",
            observation: "",
            photo: null,
          };
          const existing = responses.find((response) => response.template_id === item.id);

          return (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{item.title}</p>
                  {existing && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Último estado guardado para la fecha: {statusLabel(existing.status)}
                    </p>
                  )}
                </div>

                <select
                  value={current.status}
                  onChange={(event) =>
                    onChange(item.id, {
                      status: event.target.value as ChecklistState["status"],
                    })
                  }
                  className="rounded-2xl border px-4 py-2 text-sm font-bold"
                >
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_280px]">
                <input
                  value={current.observation}
                  onChange={(event) =>
                    onChange(item.id, { observation: event.target.value })
                  }
                  className="rounded-2xl border px-4 py-3 text-sm"
                  placeholder="Observación opcional"
                />

                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-600">
                  <Camera className="h-4 w-4" />
                  <span className="truncate">{current.photo ? current.photo.name : "Foto opcional"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      onChange(item.id, { photo: event.target.files?.[0] || null })
                    }
                  />
                </label>
              </div>

              {existing?.photo_url && (
                <a
                  href={existing.photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"
                >
                  <Camera className="h-4 w-4" />
                  Ver foto guardada
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
