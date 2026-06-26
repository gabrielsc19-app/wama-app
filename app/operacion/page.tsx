"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { supabase } from "@/app/lib/supabase";
import LocatarioCommercialNotificationCard from "@/app/components/LocatarioCommercialNotificationCard";
import PumayCommercialNotificationCard from "@/app/components/PumaycommercialNotificationCard";
import AppBadgeSync from "@/app/components/AppBadgeSync";
import {
  AlertTriangle,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  EyeOff,
  History,
  ImageIcon,
  LogOut,
  Mail,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Siren,
  Trash2,
  User2,
  Wrench,
  X,
} from "lucide-react";

type UserProfile = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  location_id: number | null;
  active: boolean;
  organization_id: number;
};

type Location = {
  id: number;
  created_at: string;
  name: string;
  floor: number | null;
  active: boolean;
  organization_id: number;
  local_code: string | null;
  brand_name: string | null;
  sector: string | null;
  category: string | null;
  status: string | null;
  notes: string | null;
};

type LocalUserAccess = {
  id: number;
  organization_id: number;
  location_id: number | null;
  local_code: string | null;
  local_name: string | null;
  user_email: string;
  user_role_in_local: string;
  can_report: boolean;
  receives_notifications: boolean;
  can_respond_pumay_cases: boolean;
  is_primary_contact: boolean;
  active: boolean;
  invitation_sent?: boolean | null;
  invitation_sent_at?: string | null;
};

type LocalInvitation = LocalUserAccess & {
  user_name?: string | null;
  user_profile_role?: string | null;
  password: string;
};

type Incident = {
  id: number;
  created_at: string;
  title: string;
  type: string;
  status: string;
  description: string;
  location_id?: number | null;
  local_code?: string | null;
  location_name: string | null;
  report_direction?: string | null;
  target_local_contact_email?: string | null;
  target_local_contact_name?: string | null;
  target_local_can_respond?: boolean | null;
  requires_local_response?: boolean | null;
  local_response_comment?: string | null;
  local_responded_at?: string | null;
  local_responded_by?: string | null;
  local_responded_by_email?: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  priority: string;
  assigned_to: string | null;
  assigned_to_email?: string | null;
  assigned_by?: string | null;
  assigned_by_email?: string | null;
  assigned_at?: string | null;
  taken_at?: string | null;
  resolution_comment: string | null;
  closed_at: string | null;
  organization_id: number;
  photo_url: string | null;
  created_by_email?: string | null;
  is_test?: boolean | null;
  archived?: boolean | null;
  applies_to_metrics?: boolean | null;
  source_module?: string | null;
  service_type?: string | null;
  target_area?: string | null;
  responsible_area?: string | null;
};

type IncidentLog = {
  id: number;
  created_at: string;
  incident_id: number;
  action: string;
  description: string | null;
  performed_by: string | null;
  performed_by_email: string | null;
  organization_id: number;
};

type IncidentPhoto = {
  id: number;
  incident_id: number;
  organization_id: number;
  photo_url: string;
  photo_type: string;
  uploaded_by: string | null;
  uploaded_by_email: string | null;
  created_at: string;
  media_type?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
};

type ResponsibleMetric = {
  name: string;
  email: string;
  members: string[];
  total: number;
  nuevos: number;
  enProceso: number;
  cerrados: number;
  promedioResolucion: string;
};

const APP_NAME = "FixLoop | Pumay";
const FIXLOOP_SESSION_KEY = "fixloop_pumay_session";
const APP_TAGLINE = "Report. Assign. Resolve.";
const DEFAULT_LOCATARIO_PASSWORD = "FixLoop2026!";

const RESPONSIBLE_OPTIONS = [
  {
    name: "Equipo Operaciones",
    email: "jpino@pumay.cl",
    members: ["José Pino", "Álvaro León", "Percy Werth"],
  },
  {
    name: "Equipo Mantención",
    email: "aserrano@pumay.cl",
    members: ["Aldo Serrano"],
  },
  {
    name: "Equipo Seguridad",
    email: "pumay@zintex.cl",
    members: ["Jorge Pino"],
  },
  {
    name: "Equipo Aseo",
    email: "lizama-yasna@aramark.cl",
    members: ["Yasna Lizama"],
  },
  {
    name: "Equipo Comercial",
    email: "pwerth@pumay.cl",
    members: ["Percy Werth"],
  },
  {
    name: "Todos responsables Pumay",
    email: "",
    members: [
      "Equipo Operaciones",
      "Equipo Mantención",
      "Equipo Seguridad",
      "Equipo Aseo",
      "Equipo Comercial",
    ],
  },
];

const PUMAY_TO_LOCAL_TYPES = [
  "Cortina / acceso del local",
  "Orden y presentación",
  "Materiales fuera del local",
  "Basura / residuos",
  "Trabajos sin autorización",
  "Cámara hacia pasillo",
  "Documentación pendiente",
  "Mantención interna del local",
  "Otro",
];

const PUMAY_INTERNAL_TASK_TYPES = [
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

function getResponsibleEmail(name: string) {
  return RESPONSIBLE_OPTIONS.find((item) => item.name === name)?.email || null;
}

function getResponsibleForIncidentType(type?: string | null) {
  const normalized = normalizeAreaValue(type);

  if (normalized === "mantencion") {
    return {
      label: "Equipo Mantención",
      area: "mantencion",
      email: getResponsibleEmail("Equipo Mantención"),
    };
  }

  if (normalized === "aseo") {
    return {
      label: "Equipo Aseo",
      area: "aseo",
      email: getResponsibleEmail("Equipo Aseo"),
    };
  }

  if (normalized === "seguridad") {
    return {
      label: "Equipo Seguridad",
      area: "seguridad",
      email: getResponsibleEmail("Equipo Seguridad"),
    };
  }

  if (normalized === "comercial") {
    return {
      label: "Equipo Comercial",
      area: "comercial",
      email: getResponsibleEmail("Equipo Comercial"),
    };
  }

  return {
    label: "Equipo Operaciones",
    area: "operaciones",
    email: getResponsibleEmail("Equipo Operaciones"),
  };
}

function normalizeAreaValue(value?: string | null) {
  const raw = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!raw) return "operaciones";

  if (raw.includes("comercial")) return "comercial";
  if (raw.includes("aseo")) return "aseo";
  if (raw.includes("seguridad")) return "seguridad";

  if (raw.includes("mantencion") || raw.includes("mantenimiento")) {
    return "mantencion";
  }

  if (
    raw.includes("operacion") ||
    raw.includes("operaciones") ||
    raw.includes("coordinador")
  ) {
    return "operaciones";
  }

  if (raw.includes("todos") || raw.includes("responsables pumay")) {
    return "todos";
  }

  return raw;
}

function getResponsibleLabelByArea(area: string, fallback?: string | null) {
  if (area === "comercial") return "Equipo Comercial";
  if (area === "aseo") return "Equipo Aseo";
  if (area === "seguridad") return "Equipo Seguridad";
  if (area === "mantencion") return "Equipo Mantención";
  if (area === "operaciones") return "Equipo Operaciones";
  if (area === "todos") return "Todos responsables Pumay";

  return fallback || "Equipo Operaciones";
}

function getResponsibleAreaForIncident(incident: Incident) {
  return normalizeAreaValue(
    incident.target_area ||
      incident.responsible_area ||
      incident.assigned_to ||
      incident.type,
  );
}

function isLocalRole(role?: string | null) {
  const value = String(role || "")
    .toLowerCase()
    .trim();

  return value === "locatario" || value.startsWith("locatario_");
}

function normalizeRoleValue(role?: string | null) {
  return String(role || "")
    .toLowerCase()
    .trim();
}

function canReportToLocalRole(role?: string | null) {
  const normalizedRole = normalizeRoleValue(role);

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

function canReportToTeamRole(role?: string | null) {
  const normalizedRole = normalizeRoleValue(role);

  return [
    "owner",
    "super_admin",
    "operaciones",
    "mantencion",
    "mantención",
    "mantenimiento",
    "comercial",
    "seguridad",
    "aseo",
    "admin",
  ].includes(normalizedRole);
}

function normalizeStatus(status?: string) {
  const value = (status || "").toLowerCase().trim();

  if (
    value === "nuevo" ||
    value === "abierto" ||
    value === "open" ||
    value === "new"
  ) {
    return "abierto";
  }

  if (
    value === "en proceso" ||
    value === "en revisión" ||
    value === "en revision" ||
    value === "tomado" ||
    value === "revisando"
  ) {
    return "en revisión";
  }

  if (value === "cerrado" || value === "closed") {
    return "cerrado";
  }

  return "abierto";
}

function normalizePriority(priority?: string) {
  const value = (priority || "").toLowerCase().trim();

  if (
    value === "alta" ||
    value === "crítica" ||
    value === "critica" ||
    value === "high"
  ) {
    return "alta";
  }

  if (value === "media" || value === "medium") {
    return "media";
  }

  if (value === "baja" || value === "low") {
    return "baja";
  }

  return "media";
}

function prettyStatus(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "abierto") return "Nuevo";
  if (normalized === "en revisión") return "En proceso";
  if (normalized === "cerrado") return "Cerrado";

  return "Nuevo";
}

function prettyPriority(priority?: string) {
  const normalized = normalizePriority(priority);

  if (normalized === "alta") return "Crítica";
  if (normalized === "media") return "Media";
  if (normalized === "baja") return "Baja";

  return "Media";
}

function prettyAction(action: string) {
  if (action === "created") return "Caso creado";
  if (action === "pumay_to_local_created") return "Caso enviado al local";
  if (action === "pumay_internal_created") return "Tarea interna creada";
  if (action === "urgent_security_created") return "Alerta urgente creada";
  if (action === "assigned") return "Responsable asignado";
  if (action === "taken") return "Caso tomado";
  if (action === "status_updated") return "Estado actualizado";
  if (action === "closed") return "Caso cerrado";
  if (action === "local_response") return "Respuesta del local";

  return action;
}

function prettyDirection(direction?: string | null) {
  if (direction === "pumay_to_local") return "Pumay → Local";
  if (direction === "pumay_internal") return "Pumay → Equipo interno";
  if (direction === "internal_to_pumay") return "Interno → Pumay";
  return "Local → Pumay";
}

function getStatusStyle(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "abierto") {
    return "bg-red-100 text-red-700 border border-red-200";
  }

  if (normalized === "en revisión") {
    return "bg-amber-100 text-amber-700 border border-amber-200";
  }

  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
}

function getPriorityStyle(priority?: string) {
  const normalized = normalizePriority(priority);

  if (normalized === "alta") {
    return "bg-rose-100 text-rose-700 border border-rose-200";
  }

  if (normalized === "media") {
    return "bg-sky-100 text-sky-700 border border-sky-200";
  }

  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
}

function getDirectionStyle(direction?: string | null) {
  if (direction === "pumay_to_local") {
    return "bg-violet-100 text-violet-700 border border-violet-200";
  }

  if (direction === "pumay_internal") {
    return "bg-indigo-100 text-indigo-700 border border-indigo-200";
  }

  if (direction === "internal_to_pumay") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  return "bg-sky-100 text-sky-700 border border-sky-200";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function calculateDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return "No calculado";

  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();

  if (Number.isNaN(startDate) || Number.isNaN(endDate)) {
    return "No calculado";
  }

  const diffMs = Math.max(0, endDate - startDate);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;

  return `${hours} h ${minutes} min`;
}

function calculateAverageResolution(incidents: Incident[]) {
  const closedWithDates = incidents.filter((incident) => {
    const start = incident.assigned_at || incident.created_at;
    const end = incident.closed_at;

    return Boolean(start && end);
  });

  if (closedWithDates.length === 0) {
    return "Sin cierres";
  }

  const totalMs = closedWithDates.reduce((sum, incident) => {
    const start = new Date(
      incident.assigned_at || incident.created_at,
    ).getTime();
    const end = new Date(incident.closed_at || "").getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return sum;
    }

    return sum + Math.max(0, end - start);
  }, 0);

  const averageMs = totalMs / closedWithDates.length;
  const totalMinutes = Math.floor(averageMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;

  return `${hours} h ${minutes} min`;
}

function isDashboardMetricIncident(incident: Incident) {
  const normalize = (value?: string | null) =>
    String(value || "")
      .toLowerCase()
      .trim();

  const title = normalize(incident.title);
  const description = normalize(incident.description);
  const type = normalize(incident.type);
  const direction = normalize(incident.report_direction);
  const sourceModule = normalize(incident.source_module);
  const serviceType = normalize(incident.service_type);
  const reporterEmail = normalize(incident.reporter_email);
  const reporterName = normalize(incident.reporter_name);
  const locationName = normalize(incident.location_name);

  if (incident.is_test === true) return false;
  if (incident.archived === true) return false;
  if (incident.applies_to_metrics === false) return false;

  if (
    ["1", "test", "prueba", "pruebas", "sin titulo", "sin título"].includes(
      title,
    )
  ) {
    return false;
  }

  if (
    title.includes("prueba") ||
    title.includes("test") ||
    description.includes("prueba") ||
    description.includes("test")
  ) {
    return false;
  }

  if (
    title.includes("checklist") ||
    description.includes("checklist") ||
    type.includes("checklist") ||
    sourceModule.includes("checklist") ||
    locationName.includes("checklist")
  ) {
    return false;
  }

  if (direction === "internal_to_pumay") return false;

  const isServiceReport =
    sourceModule.includes("service") ||
    sourceModule.includes("servicio") ||
    serviceType === "aseo" ||
    serviceType === "seguridad" ||
    reporterEmail.includes("lizama-yasna") ||
    reporterEmail.includes("aramark") ||
    reporterEmail.includes("pumay@zintex") ||
    reporterName.includes("yasna") ||
    reporterName.includes("jorge pino");

  if (isServiceReport) return false;

  return true;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function saveProfileSession(profile: UserProfile) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FIXLOOP_SESSION_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("No se pudo guardar la sesión local:", error);
  }
}

function getSavedProfileSession(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(FIXLOOP_SESSION_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as UserProfile;
    if (!parsed?.email || !parsed?.organization_id) return null;

    return parsed;
  } catch (error) {
    console.error("No se pudo leer la sesión local:", error);
    window.localStorage.removeItem(FIXLOOP_SESSION_KEY);
    return null;
  }
}

function clearSavedProfileSession() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(FIXLOOP_SESSION_KEY);
  } catch (error) {
    console.error("No se pudo limpiar la sesión local:", error);
  }
}

async function registerFixLoopServiceWorker() {
  if (typeof window === "undefined") return null;

  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker no soportado en este navegador.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    return registration;
  } catch (error) {
    console.error("Error registrando Service Worker:", error);
    return null;
  }
}

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [appLoading, setAppLoading] = useState(false);
  const [caseActionMessage, setCaseActionMessage] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [localAccessLocations, setLocalAccessLocations] = useState<Location[]>(
    [],
  );

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentLogs, setIncidentLogs] = useState<IncidentLog[]>([]);
  const [incidentPhotosByIncidentId, setIncidentPhotosByIncidentId] = useState<
    Record<number, IncidentPhoto[]>
  >({});
  const [criticalAlert, setCriticalAlert] = useState<Incident | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pushStatus, setPushStatus] = useState("");

  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentType, setIncidentType] = useState("Mantención");
  const [incidentPriority, setIncidentPriority] = useState("Media");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentPhotos, setIncidentPhotos] = useState<File[]>([]);

  const [localCaseLocationId, setLocalCaseLocationId] = useState("");
  const [localCaseType, setLocalCaseType] = useState(
    "Cortina / acceso del local",
  );
  const [localCasePriority, setLocalCasePriority] = useState("Media");
  const [localCaseTitle, setLocalCaseTitle] = useState("");
  const [localCaseDescription, setLocalCaseDescription] = useState("");
  const [localCasePhotos, setLocalCasePhotos] = useState<File[]>([]);
  const [notifyLocalContact, setNotifyLocalContact] = useState(true);

  const [internalTaskResponsible, setInternalTaskResponsible] =
    useState("Equipo Aseo");
  const [internalTaskType, setInternalTaskType] = useState("Tarea operacional");
  const [internalTaskPriority, setInternalTaskPriority] = useState("Media");
  const [internalTaskTitle, setInternalTaskTitle] = useState("");
  const [internalTaskDescription, setInternalTaskDescription] = useState("");
  const [internalTaskPhotos, setInternalTaskPhotos] = useState<File[]>([]);

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todos");
  const [responsibleFilter, setResponsibleFilter] = useState("Todos");
  const [directionFilter, setDirectionFilter] = useState("Todos");
  const [localResponseFilter, setLocalResponseFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [localInvitations, setLocalInvitations] = useState<LocalInvitation[]>(
    [],
  );
  const [invitationSearchTerm, setInvitationSearchTerm] = useState("");
  const [invitationStatusFilter, setInvitationStatusFilter] =
    useState("Pendientes");

  const currentRole = normalizeRoleValue(userProfile?.role);
  const isOwner = currentRole === "owner";
  const isLocatario = isLocalRole(userProfile?.role);
  const isSuperAdmin = currentRole === "super_admin";
  const isOperationalUser =
    !!userProfile &&
    !isLocalRole(userProfile.role) &&
    !["owner", "super_admin"].includes(currentRole);

  useEffect(() => {
    registerFixLoopServiceWorker();
    checkSession();
  }, []);

  useEffect(() => {
    if (!userProfile || isLocalRole(userProfile.role)) return;

    const channel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "incidents",
          filter: `organization_id=eq.${userProfile.organization_id}`,
        },
        async (payload) => {
          const newIncident = payload.new as Incident;

          await loadIncidents(userProfile);

          const isCritical =
            normalizePriority(newIncident.priority) === "alta" &&
            newIncident.type === "Seguridad";

          if (isCritical) {
            setCriticalAlert(newIncident);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  async function checkSession() {
    setAuthLoading(true);
    setErrorMessage("");

    const savedProfile = getSavedProfileSession();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error al revisar la sesión:", error);
    }

    const activeEmail = session?.user?.email || savedProfile?.email;

    if (!activeEmail) {
      setUserProfile(null);
      setUserLocation(null);
      setLocations([]);
      setLocalAccessLocations([]);
      setLocalInvitations([]);
      setAuthLoading(false);
      return;
    }

    if (savedProfile?.email && !session?.user?.email) {
      setUserProfile(savedProfile);
    }

    await loadUserProfile(activeEmail);
    setAuthLoading(false);
  }

  async function loadUserProfile(userEmail: string) {
    setAppLoading(true);
    setErrorMessage("");

    const normalizedEmail = String(userEmail || "")
      .toLowerCase()
      .trim();

    const { data: profile, error: profileError } = await supabase
      .from("users_pumay")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("active", true)
      .single();

    if (profileError || !profile) {
      setErrorMessage(
        "El usuario existe en Auth, pero no tiene perfil activo en users_pumay.",
      );
      setUserProfile(null);
      setUserLocation(null);
      setLocations([]);
      setLocalAccessLocations([]);
      setLocalInvitations([]);
      setAppLoading(false);
      return;
    }

    const activeProfile = profile as UserProfile;
    setUserProfile(activeProfile);
    saveProfileSession(activeProfile);

    if (isLocalRole(activeProfile.role)) {
      const locationIds = new Set<number>();

      if (activeProfile.location_id) {
        locationIds.add(activeProfile.location_id);
      }

      const { data: accessRows, error: accessError } = await supabase
        .from("local_user_access")
        .select("*")
        .eq("organization_id", activeProfile.organization_id)
        .eq("user_email", normalizedEmail)
        .eq("active", true);

      if (!accessError && accessRows) {
        (accessRows as LocalUserAccess[]).forEach((access) => {
          if (access.location_id) {
            locationIds.add(access.location_id);
          }
        });
      }

      const ids = Array.from(locationIds);

      if (ids.length > 0) {
        const { data: localLocations, error: locationsError } = await supabase
          .from("locations")
          .select("*")
          .eq("organization_id", activeProfile.organization_id)
          .eq("active", true)
          .in("id", ids)
          .order("name", { ascending: true });

        if (locationsError) {
          setErrorMessage("No se pudieron cargar los locales asociados.");
          setUserLocation(null);
          setLocations([]);
          setLocalAccessLocations([]);
        } else {
          const parsedLocations = (localLocations || []) as Location[];

          setLocations(parsedLocations);
          setLocalAccessLocations(parsedLocations);
          setUserLocation(parsedLocations[0] || null);
        }

        await loadIncidents(activeProfile, ids);
      } else {
        setUserLocation(null);
        setLocations([]);
        setLocalAccessLocations([]);
        await loadIncidents(activeProfile, []);
      }

      setAppLoading(false);
      return;
    }

    setLocalAccessLocations([]);

    if (activeProfile.location_id) {
      const { data: location } = await supabase
        .from("locations")
        .select("*")
        .eq("id", activeProfile.location_id)
        .eq("active", true)
        .single();

      setUserLocation((location as Location) || null);
    } else {
      setUserLocation(null);
    }

    await loadLocations(activeProfile.organization_id);
    await loadIncidents(activeProfile);

    if (
      ["owner", "super_admin"].includes(normalizeRoleValue(activeProfile.role))
    ) {
      await loadLocalInvitations(activeProfile.organization_id);
    } else {
      setLocalInvitations([]);
    }

    setAppLoading(false);
  }

  async function loadLocations(organizationId: number) {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      setErrorMessage("No se pudieron cargar los locales.");
      setLocations([]);
      return;
    }

    setLocations((data || []) as Location[]);
  }

  async function loadLocalInvitations(organizationId?: number) {
    const activeOrganizationId = organizationId || userProfile?.organization_id;
    if (!activeOrganizationId) return;

    const { data: accessRows, error: accessError } = await supabase
      .from("local_user_access")
      .select("*")
      .eq("organization_id", activeOrganizationId)
      .eq("active", true)
      .order("local_code", { ascending: true })
      .order("user_email", { ascending: true });

    if (accessError) {
      console.error("Error cargando invitaciones:", accessError);
      setErrorMessage("No se pudieron cargar los locatarios para invitar.");
      setLocalInvitations([]);
      return;
    }

    const rows = (accessRows || []) as LocalUserAccess[];
    const emails = Array.from(
      new Set(rows.map((row) => row.user_email).filter(Boolean)),
    );

    let profilesByEmail: Record<
      string,
      { name?: string | null; role?: string | null }
    > = {};

    if (emails.length > 0) {
      const { data: profiles } = await supabase
        .from("users_pumay")
        .select("name,email,role")
        .eq("organization_id", activeOrganizationId)
        .in("email", emails);

      profilesByEmail = Object.fromEntries(
        (profiles || []).map(
          (profile: {
            name?: string | null;
            email: string;
            role?: string | null;
          }) => [
            String(profile.email || "")
              .toLowerCase()
              .trim(),
            { name: profile.name, role: profile.role },
          ],
        ),
      );
    }

    setLocalInvitations(
      rows.map((row) => {
        const profile =
          profilesByEmail[
            String(row.user_email || "")
              .toLowerCase()
              .trim()
          ];

        return {
          ...row,
          user_name: profile?.name || null,
          user_profile_role: profile?.role || null,
          password: DEFAULT_LOCATARIO_PASSWORD,
        };
      }),
    );
  }

  async function loadIncidents(
    profile?: UserProfile,
    localLocationIds?: number[],
  ) {
    const activeProfile = profile || userProfile;
    if (!activeProfile) return;

    const activeRole = normalizeRoleValue(activeProfile.role);
    const activeEmail = String(activeProfile.email || "")
      .toLowerCase()
      .trim();
    const activeArea = normalizeAreaValue(activeRole);

    const isRestrictedInternalRole =
      !isLocalRole(activeProfile.role) &&
      !["owner", "super_admin"].includes(activeRole);

    let query = supabase
      .from("incidents")
      .select("*")
      .eq("organization_id", activeProfile.organization_id)
      .order("created_at", { ascending: false });

    if (isLocalRole(activeProfile.role)) {
      const locationIds =
        localLocationIds && localLocationIds.length > 0
          ? localLocationIds
          : localAccessLocations.length > 0
            ? localAccessLocations.map((location) => location.id)
            : activeProfile.location_id
              ? [activeProfile.location_id]
              : [];

      if (locationIds.length > 0) {
        query = query.or(
          [
            `location_id.in.(${locationIds.join(",")})`,
            `reporter_email.eq.${activeEmail}`,
            `target_local_contact_email.eq.${activeEmail}`,
            `assigned_to_email.eq.${activeEmail}`,
          ].join(","),
        );
      } else {
        query = query.or(
          [
            `reporter_email.eq.${activeEmail}`,
            `target_local_contact_email.eq.${activeEmail}`,
            `assigned_to_email.eq.${activeEmail}`,
          ].join(","),
        );
      }
    }

    if (isRestrictedInternalRole) {
      /*
        Visibilidad de equipos internos:
        - Primero usamos campos normalizados target_area/responsible_area.
        - Además agregamos fallback por texto para casos antiguos creados antes
          de normalizar áreas, por ejemplo assigned_to = "Equipo Aseo".
        - Para evitar problemas con espacios en PostgREST, buscamos solo la
          palabra del área: Aseo, Seguridad, Comercial, Mantención, Operaciones.
      */
      const fallbackAreaFilters =
        activeArea === "mantencion"
          ? [
              "assigned_to.ilike.*Mantencion*",
              "assigned_to.ilike.*Mantención*",
              "type.ilike.*Mantencion*",
              "type.ilike.*Mantención*",
            ]
          : activeArea === "seguridad"
            ? [
                "assigned_to.ilike.*Seguridad*",
                "type.ilike.*Seguridad*",
                "responsible_area.ilike.*seguridad*",
                "target_area.ilike.*seguridad*",
              ]
            : activeArea === "aseo"
              ? [
                  "assigned_to.ilike.*Aseo*",
                  "type.ilike.*Aseo*",
                  "responsible_area.ilike.*aseo*",
                  "target_area.ilike.*aseo*",
                ]
              : activeArea === "comercial"
                ? [
                    "assigned_to.ilike.*Comercial*",
                    "type.ilike.*Comercial*",
                    "responsible_area.ilike.*comercial*",
                    "target_area.ilike.*comercial*",
                  ]
                : activeArea === "operaciones"
                  ? [
                      "assigned_to.ilike.*Operaciones*",
                      "assigned_to.ilike.*Operacion*",
                      "assigned_to.ilike.*Operación*",
                      "type.ilike.*Operaciones*",
                      "type.ilike.*Operacion*",
                      "type.ilike.*Operación*",
                    ]
                  : [];

      query = query.or(
        [
          `assigned_to_email.eq.${activeEmail}`,
          `reporter_email.eq.${activeEmail}`,
          `assigned_by_email.eq.${activeEmail}`,
          `created_by_email.eq.${activeEmail}`,
          `target_area.eq.${activeArea}`,
          `responsible_area.eq.${activeArea}`,
          `target_area.eq.todos`,
          `responsible_area.eq.todos`,
          "assigned_to.ilike.*Todos*",
          ...fallbackAreaFilters,
        ].join(","),
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error cargando incidentes:", error);
      setErrorMessage(
        `No se pudieron cargar los incidentes. ${
          error.message ? `Detalle: ${error.message}` : ""
        }`,
      );
      return;
    }

    setErrorMessage("");
    setIncidents((data || []) as Incident[]);
  }

  async function loadIncidentLogs(incidentId: number) {
    if (!userProfile) return;

    setLogsLoading(true);
    setIncidentLogs([]);

    try {
      const response = await fetch(
        `/api/incidents/logs?incidentId=${incidentId}&organizationId=${userProfile.organization_id}`,
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setIncidentLogs([]);
        setLogsLoading(false);
        return;
      }

      setIncidentLogs(result.logs || []);
    } catch {
      setIncidentLogs([]);
    }

    setLogsLoading(false);
  }

  async function handleViewDetail(incidentId: number) {
    setSelectedIncidentId(incidentId);
    await Promise.all([
      loadIncidentLogs(incidentId),
      loadIncidentPhotos(incidentId),
    ]);
  }

  async function deleteIncident(incident: Incident) {
    if (!userProfile) return;

    const activeRole = normalizeRoleValue(userProfile.role);

    if (activeRole !== "owner") {
      setErrorMessage("Solo usuarios owner pueden eliminar casos.");
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar definitivamente el caso "${incident.title}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      "Confirmación final: se borrará el caso y su historial. Usa esta opción solo para pruebas, duplicados o casos mal creados.",
    );

    if (!secondConfirmation) return;

    setAppLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/incidents/${incident.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          userEmail: userProfile.email,
          userRole: userProfile.role,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(
          typeof result?.error === "string"
            ? result.error
            : "No se pudo eliminar el caso.",
        );
        setAppLoading(false);
        return;
      }

      setSuccessMessage("Caso eliminado correctamente.");
      setSelectedIncidentId(null);
      setIncidentLogs([]);
      await loadIncidents(userProfile);
    } catch (error) {
      console.error("Error eliminando caso:", error);
      setErrorMessage("No se pudo eliminar el caso.");
    }

    setAppLoading(false);
  }

  async function createIncidentLog({
    incidentId,
    action,
    description,
  }: {
    incidentId: number;
    action: string;
    description: string;
  }) {
    if (!userProfile) return false;

    try {
      const response = await fetch("/api/incidents/logs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incidentId,
          action,
          description,
          performedBy: userProfile.name,
          performedByEmail: userProfile.email,
          organizationId: userProfile.organization_id,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        console.error("No se pudo guardar el historial del caso:", result);
        setErrorMessage(
          typeof result?.error === "string"
            ? `No se pudo guardar historial: ${result.error}`
            : "No se pudo guardar el historial del caso.",
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("No se pudo guardar el historial del caso:", error);
      setErrorMessage("No se pudo guardar el historial del caso.");
      return false;
    }
  }

  async function notifyAdminsAndOwnerOnNewCase(incident: Incident) {
    if (!userProfile) return;

    try {
      await fetch("/api/push-notify-critical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          title: "FixLoop | Pumay: nuevo caso reportado",
          body: `${incident.type} · ${
            incident.location_name || "Local no informado"
          } · Reporta: ${incident.reporter_name || "Locatario no informado"}`,
          url: "/",
          onlySuperAdmins: true,
          includeOwners: true,
          includeOwner: true,
          notifyOwners: true,
        }),
      });
    } catch {
      console.error("No se pudo notificar a owner y súper administradores.");
    }
  }

  async function notifyResponsibleTeamOnNewCase(incident: Incident) {
    if (!userProfile) return;

    const routing = getResponsibleForIncidentType(incident.type);

    try {
      await fetch("/api/push/notify-assigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          assignedToEmail: routing.email,
          assignedToName: routing.label,
          assignedTo: routing.label,
          targetArea: routing.area,
          responsibleArea: routing.area,
          assignedByName: incident.reporter_name || userProfile.name,
          incidentTitle: incident.title,
          incidentLocation: incident.location_name || "Local no informado",
          title: `FixLoop | Pumay: nuevo caso de ${incident.type}`,
          body: `${incident.title} · ${incident.location_name || "Local no informado"}`,
          url: "/",
        }),
      });
    } catch {
      console.error("No se pudo notificar al equipo responsable del caso.");
    }
  }

  async function notifyAllUsersForCriticalSecurity(incident: Incident) {
    if (!userProfile) return;

    try {
      await fetch("/api/push-notify-critical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          title: "FixLoop | Pumay: alerta urgente de seguridad",
          body: `Seguridad · ${
            incident.location_name || "Local no informado"
          } · Reporta: ${incident.reporter_name || "Locatario no informado"}`,
          url: "/",
        }),
      });
    } catch {
      console.error("No se pudo notificar la alerta crítica a todos.");
    }
  }

  async function notifyLocalContactPush(incident: Incident) {
    if (!userProfile) return;

    try {
      await fetch("/api/push/notify-local-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          locationId: incident.location_id || null,
          localCode: incident.local_code || null,
          localName: incident.location_name || null,
          incidentTitle: incident.title,
          incidentType: incident.type,
          reportedByName: userProfile.name,
          url: "/",
        }),
      });
    } catch {
      console.error("No se pudo notificar al contacto del local.");
    }
  }

  async function notifyCaseCreatorOnClose(incident: Incident) {
    if (!userProfile) return;

    const creatorEmail = String(
      incident.created_by_email || incident.reporter_email || "",
    )
      .toLowerCase()
      .trim();

    const currentUserEmail = String(userProfile.email || "")
      .toLowerCase()
      .trim();

    if (!creatorEmail || creatorEmail === currentUserEmail) {
      return;
    }

    try {
      await fetch("/api/push/notify-assigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          assignedToEmail: creatorEmail,
          assignedToName:
            incident.reporter_name || incident.assigned_by || "usuario creador",
          assignedTo:
            incident.reporter_name || incident.assigned_by || creatorEmail,
          assignedByName: userProfile.name,
          incidentTitle: incident.title,
          incidentLocation: incident.location_name || "Caso FixLoop",
          title: "FixLoop | Pumay: caso cerrado",
          body: `${incident.title} · Cerrado por ${userProfile.name}`,
          url: "/",
        }),
      });
    } catch {
      console.error(
        "No se pudo notificar al usuario creador del caso cerrado.",
      );
    }
  }

  async function notifyCaseCreatorOnTaken(
    incident: Incident,
    takeComment?: string | null,
  ) {
    if (!userProfile) return;

    const creatorEmail = String(
      incident.created_by_email ||
        incident.reporter_email ||
        incident.target_local_contact_email ||
        "",
    )
      .toLowerCase()
      .trim();

    const currentUserEmail = String(userProfile.email || "")
      .toLowerCase()
      .trim();

    if (!creatorEmail || creatorEmail === currentUserEmail) {
      return;
    }

    const managingTeam = incident.assigned_to || "equipo Pumay";
    const cleanComment = String(takeComment || "").trim();
    const commentText = cleanComment ? ` Comentario: ${cleanComment}` : "";

    try {
      await fetch("/api/push/notify-assigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          assignedToEmail: creatorEmail,
          assignedToName:
            incident.reporter_name ||
            incident.target_local_contact_name ||
            "usuario reportante",
          assignedTo:
            incident.reporter_name ||
            incident.target_local_contact_name ||
            creatorEmail,
          assignedByName: userProfile.name,
          incidentTitle: incident.title,
          incidentLocation: incident.location_name || "Caso FixLoop",
          title: "FixLoop | Pumay: tu caso fue tomado",
          body: `${incident.title} · Está siendo gestionado por ${managingTeam}.${commentText}`,
          url: "/",
        }),
      });
    } catch {
      console.error("No se pudo notificar al usuario creador del caso tomado.");
    }
  }

  async function notifyPumayOnLocalResponse(
    incident: Incident,
    responseComment: string,
  ) {
    if (!userProfile) return;

    try {
      await fetch("/api/push-notify-critical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          title: "FixLoop | Pumay: respuesta de local",
          body: `${incident.location_name || "Local"} respondió el caso: ${incident.title}.`,
          url: "/",
          onlySuperAdmins: true,
          includeOwners: true,
          includeOwner: true,
          notifyOwners: true,
          data: {
            incidentId: incident.id,
            responseComment,
          },
        }),
      });
    } catch {
      console.error("No se pudo notificar la respuesta del local a Pumay.");
    }
  }

  async function findPrimaryLocalContact(locationId: number) {
    const { data: accessRows, error } = await supabase
      .from("local_user_access")
      .select("*")
      .eq("location_id", locationId)
      .eq("active", true)
      .eq("can_respond_pumay_cases", true)
      .order("is_primary_contact", { ascending: false })
      .limit(1);

    if (error || !accessRows || accessRows.length === 0) {
      return null;
    }

    const access = accessRows[0] as LocalUserAccess;
    const email = String(access.user_email || "")
      .toLowerCase()
      .trim();

    const { data: profile } = await supabase
      .from("users_pumay")
      .select("name, email")
      .eq("email", email)
      .maybeSingle();

    return {
      email,
      name: profile?.name || email,
      canRespond: access.can_respond_pumay_cases,
    };
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoginLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setErrorMessage("Credenciales inválidas o usuario no encontrado.");
      setLoginLoading(false);
      return;
    }

    const signedInEmail = String(data.user?.email || cleanEmail)
      .toLowerCase()
      .trim();

    const { data: loginProfile, error: loginProfileError } = await supabase
      .from("users_pumay")
      .select("*")
      .eq("email", signedInEmail)
      .eq("active", true)
      .maybeSingle();

    if (loginProfileError || !loginProfile) {
      clearSavedProfileSession();
      setErrorMessage(
        "El usuario existe en Auth, pero no tiene perfil activo en users_pumay.",
      );
      setLoginLoading(false);
      return;
    }

    if (loginProfile.must_change_password === true) {
      clearSavedProfileSession();
      setLoginLoading(false);
      router.push("/reset-password?mode=first-login");
      return;
    }

    saveProfileSession(loginProfile as UserProfile);

    setLoginLoading(false);
    router.replace("/");
  }

  async function handlePasswordReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanEmail = String(resetEmail || email || "")
      .toLowerCase()
      .trim();

    if (!cleanEmail) {
      setErrorMessage("Ingresa el correo asociado a tu cuenta.");
      return;
    }

    setResetLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      console.error("Error enviando recuperación de contraseña:", error);
      setErrorMessage(
        "No se pudo enviar el correo de recuperación. Revisa el correo ingresado o intenta nuevamente.",
      );
      setResetLoading(false);
      return;
    }

    setSuccessMessage(
      "Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.",
    );
    setShowResetPasswordForm(false);
    setResetLoading(false);
  }

  async function handleLogout() {
    setErrorMessage("");
    setSuccessMessage("");
    setPushStatus("");
    setCaseActionMessage("");
    setIncidentLogs([]);
    setIncidentPhotosByIncidentId({});

    await supabase.auth.signOut();
    clearSavedProfileSession();

    setUserProfile(null);
    setUserLocation(null);
    setLocations([]);
    setLocalAccessLocations([]);
    setLocalInvitations([]);
    setIncidents([]);
    setEmail("");
    setPassword("");
    setSelectedIncidentId(null);
  }

  async function uploadIncidentPhotos({
    incidentId,
    files,
    photoType = "creation",
    setMainPhoto = false,
  }: {
    incidentId: number;
    files: File[];
    photoType?: "creation" | "response" | "closure";
    setMainPhoto?: boolean;
  }) {
    if (!userProfile || files.length === 0) return [];

    const imageCount = files.filter((file) =>
      file.type.startsWith("image/"),
    ).length;
    const videoCount = files.filter((file) =>
      file.type.startsWith("video/"),
    ).length;

    if (imageCount > 5) {
      throw new Error("Solo puedes adjuntar hasta 5 fotos.");
    }

    if (videoCount > 1) {
      throw new Error("Solo puedes adjuntar hasta 1 video.");
    }

    const formData = new FormData();
    formData.append("incidentId", String(incidentId));
    formData.append("organizationId", String(userProfile.organization_id));
    formData.append("photoType", photoType);
    formData.append("uploadedBy", userProfile.name || "");
    formData.append("uploadedByEmail", userProfile.email || "");
    formData.append("setMainPhoto", setMainPhoto ? "true" : "false");

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch("/api/incident-photos", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(
        typeof result?.error === "string"
          ? result.error
          : "No se pudieron subir los adjuntos.",
      );
    }

    const uploadedPhotos = (result.photos || []) as IncidentPhoto[];

    setIncidentPhotosByIncidentId((current) => ({
      ...current,
      [incidentId]: [...(current[incidentId] || []), ...uploadedPhotos],
    }));

    return uploadedPhotos;
  }

  async function uploadIncidentPhoto(file: File) {
    if (!userProfile) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("organizationId", String(userProfile.organization_id));
    formData.append("folder", "legacy-single-photo");

    const response = await fetch("/api/upload-incident-photo", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(
        typeof result?.error === "string"
          ? result.error
          : "No se pudo subir la foto.",
      );
    }

    return String(result.publicUrl || "");
  }

  async function loadIncidentPhotos(incidentId: number) {
    if (!userProfile) return;

    try {
      const response = await fetch(
        `/api/incident-photos?incidentId=${incidentId}&organizationId=${userProfile.organization_id}`,
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        return;
      }

      setIncidentPhotosByIncidentId((current) => ({
        ...current,
        [incidentId]: (result.photos || []) as IncidentPhoto[],
      }));
    } catch (error) {
      console.error("No se pudieron cargar las fotos del caso:", error);
    }
  }

  async function respondToPumayLocalCase(
    incidentId: number,
    responseComment: string,
    responsePhotos: File[] = [],
  ) {
    if (!userProfile) {
      setErrorMessage("No hay usuario activo.");
      return;
    }

    const activeRole = normalizeRoleValue(userProfile.role);

    if (!isLocalRole(activeRole)) {
      setErrorMessage("Solo el locatario puede responder este caso.");
      return;
    }

    const cleanComment = String(responseComment || "").trim();

    if (cleanComment.length < 5) {
      setErrorMessage("Debes escribir una respuesta de al menos 5 caracteres.");
      return;
    }

    const incident = incidents.find((item) => item.id === incidentId) || null;

    if (!incident) {
      setErrorMessage("No se encontró el caso para responder.");
      return;
    }

    if (incident.report_direction !== "pumay_to_local") {
      setErrorMessage("Solo se pueden responder casos enviados por Pumay al local.");
      return;
    }

    if (incident.target_local_can_respond === false) {
      setErrorMessage("Este usuario no tiene permiso para responder este caso.");
      return;
    }

    setAppLoading(true);
    setCaseActionMessage("Enviando respuesta a Pumay...");
    setErrorMessage("");
    setSuccessMessage("");

    const respondedAt = new Date().toISOString();

    try {
      const { error } = await supabase
        .from("incidents")
        .update({
          local_response_comment: cleanComment,
          local_responded_at: respondedAt,
          local_responded_by: userProfile.name,
          local_responded_by_email: userProfile.email,
        })
        .eq("id", incidentId)
        .eq("organization_id", userProfile.organization_id);

      if (error) {
        console.error("Error guardando respuesta del local:", error);
        setErrorMessage(
          "No se pudo guardar la respuesta del local. Revisa que las columnas de respuesta existan en Supabase.",
        );
        setAppLoading(false);
        setCaseActionMessage("");
        return;
      }

      if (responsePhotos.length > 0) {
        setCaseActionMessage("Subiendo evidencia del local...");

        await uploadIncidentPhotos({
          incidentId,
          files: responsePhotos,
          photoType: "response",
          setMainPhoto: false,
        });
      }

      setCaseActionMessage("Guardando historial...");

      await createIncidentLog({
        incidentId,
        action: "local_response",
        description: `${userProfile.name} respondió desde el local. Comentario: ${cleanComment}`,
      });

      setCaseActionMessage("Notificando a Pumay...");

      const updatedIncident = {
        ...incident,
        local_response_comment: cleanComment,
        local_responded_at: respondedAt,
        local_responded_by: userProfile.name,
        local_responded_by_email: userProfile.email,
      } as Incident;

      await notifyPumayOnLocalResponse(updatedIncident, cleanComment);

      setSuccessMessage("Respuesta enviada correctamente a Pumay.");
      await loadIncidents(userProfile);
      await Promise.all([
        loadIncidentLogs(incidentId),
        loadIncidentPhotos(incidentId),
      ]);
    } catch (error) {
      console.error("Error enviando respuesta del local:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la respuesta del local.",
      );
    }

    setCaseActionMessage("");
    setAppLoading(false);
  }

  async function createIncident(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userProfile) {
      setErrorMessage("No hay usuario activo.");
      return;
    }

    if (!incidentTitle.trim()) {
      setErrorMessage("Debes ingresar un título para el incidente.");
      return;
    }

    if (!incidentDescription.trim()) {
      setErrorMessage("Debes ingresar una descripción del incidente.");
      return;
    }

    const requiresPhoto =
      incidentType === "Mantención" || incidentType === "Emergencia";

    if (requiresPhoto && incidentPhotos.length === 0) {
      setErrorMessage(
        "Para mantención o emergencia debes adjuntar una foto del caso.",
      );
      return;
    }

    setAppLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const routing = getResponsibleForIncidentType(incidentType);
      const assignedAt = new Date().toISOString();

      const fullPayload = {
        title: incidentTitle.trim(),
        type: incidentType,
        status: "nuevo",
        description: incidentDescription.trim(),
        location_id: userLocation?.id || userProfile.location_id || null,
        local_code: userLocation?.local_code || null,
        location_name: userLocation?.name || null,
        report_direction: "local_to_pumay",
        reporter_name: userProfile.name,
        reporter_email: userProfile.email,
        reporter_phone: userProfile.phone,
        priority: incidentPriority.toLowerCase(),
        assigned_to: routing.label,
        assigned_to_email: routing.email,
        assigned_by: "Asignación automática",
        assigned_by_email: null,
        assigned_at: assignedAt,
        created_by_email: userProfile.email,
        target_area: routing.area,
        responsible_area: routing.area,
        source_module: "local_report",
        applies_to_metrics: true,
        is_test: false,
        archived: false,
        resolution_comment: null,
        closed_at: null,
        organization_id: userProfile.organization_id,
        photo_url: null,
      };

      const legacyPayload = {
        title: incidentTitle.trim(),
        type: incidentType,
        status: "nuevo",
        description: incidentDescription.trim(),
        location_id: userLocation?.id || userProfile.location_id || null,
        local_code: userLocation?.local_code || null,
        location_name: userLocation?.name || null,
        report_direction: "local_to_pumay",
        reporter_name: userProfile.name,
        reporter_email: userProfile.email,
        reporter_phone: userProfile.phone,
        priority: incidentPriority.toLowerCase(),
        assigned_to: routing.label,
        assigned_to_email: routing.email,
        assigned_by: "Asignación automática",
        assigned_by_email: null,
        assigned_at: assignedAt,
        resolution_comment: null,
        closed_at: null,
        organization_id: userProfile.organization_id,
        photo_url: null,
      };

      let { data, error } = await supabase
        .from("incidents")
        .insert(fullPayload)
        .select()
        .single();

      if (error) {
        const message = String(error.message || "").toLowerCase();
        const shouldRetryLegacy =
          message.includes("target_area") ||
          message.includes("responsible_area") ||
          message.includes("source_module") ||
          message.includes("applies_to_metrics") ||
          message.includes("created_by_email") ||
          message.includes("is_test") ||
          message.includes("archived") ||
          message.includes("schema cache");

        if (shouldRetryLegacy) {
          console.warn(
            "Insert de caso local reintentado con payload legacy:",
            error,
          );

          const retry = await supabase
            .from("incidents")
            .insert(legacyPayload)
            .select()
            .single();

          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        setErrorMessage("No se pudo crear el incidente.");
        setAppLoading(false);
        return;
      }

      if (data?.id) {
        if (incidentPhotos.length > 0) {
          await uploadIncidentPhotos({
            incidentId: data.id,
            files: incidentPhotos,
            photoType: "creation",
            setMainPhoto: true,
          });
        }

        await createIncidentLog({
          incidentId: data.id,
          action: "created",
          description: `Caso creado por ${userProfile.name}. Asignación automática: ${routing.label}.`,
        });

        await notifyAdminsAndOwnerOnNewCase(data as Incident);
        await notifyResponsibleTeamOnNewCase(data as Incident);
      }

      setIncidentTitle("");
      setIncidentType("Mantención");
      setIncidentPriority("Media");
      setIncidentDescription("");
      setIncidentPhotos([]);

      setSuccessMessage(
        "Alerta creada correctamente. Se notificó a owner, súper administradores y equipo responsable según el tipo de caso.",
      );

      await loadIncidents(userProfile);
    } catch {
      setErrorMessage("No se pudo subir el adjunto o crear el incidente.");
    }

    setAppLoading(false);
  }

  async function createPumayInternalTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const activeRole = normalizeRoleValue(userProfile?.role);

    if (!userProfile || !["owner", "super_admin"].includes(activeRole)) {
      setErrorMessage(
        "Solo owner o súper administrador pueden asignar tareas internas.",
      );
      return;
    }

    if (!internalTaskResponsible) {
      setErrorMessage("Debes seleccionar un equipo responsable.");
      return;
    }

    if (!internalTaskTitle.trim()) {
      setErrorMessage("Debes ingresar un título para la tarea interna.");
      return;
    }

    if (!internalTaskDescription.trim()) {
      setErrorMessage("Debes ingresar una descripción para la tarea interna.");
      return;
    }

    setAppLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const targetArea = normalizeAreaValue(internalTaskResponsible);
      const responsibleLabel = getResponsibleLabelByArea(
        targetArea,
        internalTaskResponsible,
      );
      const assignedEmail = getResponsibleEmail(responsibleLabel);
      const assignedAt = new Date().toISOString();

      const fullPayload = {
        title: internalTaskTitle.trim(),
        type: internalTaskType,
        status: "nuevo",
        description: internalTaskDescription.trim(),
        location_id: null,
        local_code: null,
        location_name: "Tarea interna Pumay",
        report_direction: "pumay_internal",
        reporter_name: userProfile.name,
        reporter_email: userProfile.email,
        reporter_phone: userProfile.phone,
        priority: internalTaskPriority.toLowerCase(),
        assigned_to: responsibleLabel,
        assigned_to_email: assignedEmail,
        assigned_by: userProfile.name,
        assigned_by_email: userProfile.email,
        assigned_at: assignedAt,
        created_by_email: userProfile.email,
        target_area: targetArea,
        responsible_area: targetArea,
        source_module: "internal_tasks",
        applies_to_metrics: true,
        is_test: false,
        archived: false,
        resolution_comment: null,
        closed_at: null,
        organization_id: userProfile.organization_id,
        photo_url: null,
      };

      const legacyPayload = {
        title: internalTaskTitle.trim(),
        type: internalTaskType,
        status: "nuevo",
        description: internalTaskDescription.trim(),
        location_id: null,
        local_code: null,
        location_name: "Tarea interna Pumay",
        report_direction: "pumay_internal",
        reporter_name: userProfile.name,
        reporter_email: userProfile.email,
        reporter_phone: userProfile.phone,
        priority: internalTaskPriority.toLowerCase(),
        assigned_to: responsibleLabel,
        assigned_to_email: assignedEmail,
        assigned_by: userProfile.name,
        assigned_by_email: userProfile.email,
        assigned_at: assignedAt,
        resolution_comment: null,
        closed_at: null,
        organization_id: userProfile.organization_id,
        photo_url: null,
      };

      let { data, error } = await supabase
        .from("incidents")
        .insert(fullPayload)
        .select()
        .single();

      if (error) {
        const message = String(error.message || "").toLowerCase();
        const shouldRetryLegacy =
          message.includes("target_area") ||
          message.includes("responsible_area") ||
          message.includes("source_module") ||
          message.includes("applies_to_metrics") ||
          message.includes("created_by_email") ||
          message.includes("is_test") ||
          message.includes("archived") ||
          message.includes("schema cache");

        if (shouldRetryLegacy) {
          console.warn(
            "Insert de tarea interna reintentado con payload legacy:",
            error,
          );

          const retry = await supabase
            .from("incidents")
            .insert(legacyPayload)
            .select()
            .single();

          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        console.error("Error creando tarea interna:", error);
        setErrorMessage("No se pudo crear la tarea interna.");
        setAppLoading(false);
        return;
      }

      if (data?.id) {
        if (internalTaskPhotos.length > 0) {
          await uploadIncidentPhotos({
            incidentId: data.id,
            files: internalTaskPhotos,
            photoType: "creation",
            setMainPhoto: true,
          });
        }

        await createIncidentLog({
          incidentId: data.id,
          action: "pumay_internal_created",
          description: `${userProfile.name} asignó una tarea interna a ${responsibleLabel}.`,
        });

        try {
          await fetch("/api/push/notify-assigned", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              organizationId: userProfile.organization_id,
              assignedToEmail: assignedEmail,
              assignedToName: responsibleLabel,
              assignedTo: responsibleLabel,
              targetArea,
              responsibleArea: targetArea,
              assignedByName: userProfile.name,
              incidentTitle: internalTaskTitle.trim(),
              incidentLocation: "Tarea interna Pumay",
              title: "FixLoop | Pumay: nueva tarea interna",
              body: `${internalTaskTitle.trim()} · ${responsibleLabel}`,
              url: "/",
            }),
          });
        } catch {
          console.error("No se pudo notificar la tarea interna asignada.");
        }
      }

      setInternalTaskResponsible("Equipo Aseo");
      setInternalTaskType("Tarea operacional");
      setInternalTaskPriority("Media");
      setInternalTaskTitle("");
      setInternalTaskDescription("");
      setInternalTaskPhotos([]);

      setSuccessMessage("Tarea interna creada y asignada correctamente.");
      await loadIncidents(userProfile);
    } catch {
      setErrorMessage(
        "No se pudieron subir los adjuntos o crear la tarea interna.",
      );
    }

    setAppLoading(false);
  }

  async function createPumayToLocalIncident(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userProfile) {
      setErrorMessage("No hay usuario activo.");
      return;
    }

    if (!localCaseLocationId) {
      setErrorMessage("Debes seleccionar el local afectado.");
      return;
    }

    if (!localCaseTitle.trim()) {
      setErrorMessage("Debes ingresar un título para el caso al local.");
      return;
    }

    if (!localCaseDescription.trim()) {
      setErrorMessage("Debes ingresar una descripción para el caso al local.");
      return;
    }

    const selectedLocation = locations.find(
      (location) => String(location.id) === String(localCaseLocationId),
    );

    if (!selectedLocation) {
      setErrorMessage("No se encontró el local seleccionado.");
      return;
    }

    setAppLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const primaryContact = await findPrimaryLocalContact(selectedLocation.id);

      const { data, error } = await supabase
        .from("incidents")
        .insert({
          title: localCaseTitle.trim(),
          type: localCaseType,
          status: "nuevo",
          description: localCaseDescription.trim(),
          location_id: selectedLocation.id,
          local_code: selectedLocation.local_code,
          location_name: selectedLocation.name,
          report_direction: "pumay_to_local",
          target_local_contact_email: primaryContact?.email || null,
          target_local_contact_name: primaryContact?.name || null,
          target_local_can_respond: primaryContact?.canRespond || false,
          requires_local_response: true,
          reporter_name: userProfile.name,
          reporter_email: userProfile.email,
          reporter_phone: userProfile.phone,
          priority: localCasePriority.toLowerCase(),
          assigned_to: primaryContact?.name || selectedLocation.name,
          assigned_to_email: primaryContact?.email || null,
          assigned_by: userProfile.name,
          assigned_by_email: userProfile.email,
          assigned_at: new Date().toISOString(),
          resolution_comment: null,
          closed_at: null,
          organization_id: userProfile.organization_id,
          photo_url: null,
        })
        .select()
        .single();

      if (error) {
        setErrorMessage("No se pudo crear el caso para el local.");
        setAppLoading(false);
        return;
      }

      if (data?.id) {
        if (localCasePhotos.length > 0) {
          await uploadIncidentPhotos({
            incidentId: data.id,
            files: localCasePhotos,
            photoType: "creation",
            setMainPhoto: true,
          });
        }

        await createIncidentLog({
          incidentId: data.id,
          action: "pumay_to_local_created",
          description: `${userProfile.name} reportó un caso al local ${selectedLocation.name}.`,
        });

        if (notifyLocalContact) {
          await notifyLocalContactPush(data as Incident);
        }

        await notifyAdminsAndOwnerOnNewCase(data as Incident);
      }

      setLocalCaseLocationId("");
      setLocalCaseType("Cortina / acceso del local");
      setLocalCasePriority("Media");
      setLocalCaseTitle("");
      setLocalCaseDescription("");
      setLocalCasePhotos([]);
      setNotifyLocalContact(true);

      setSuccessMessage(
        "Caso enviado al local correctamente. Se notificó al contacto del local y a los súper administradores activos.",
      );

      await loadIncidents(userProfile);
    } catch {
      setErrorMessage(
        "No se pudo subir el adjunto o crear el caso para el local.",
      );
    }

    setAppLoading(false);
  }

  async function createUrgentSecurityAlert() {
    if (!userProfile) {
      setErrorMessage("No hay usuario activo.");
      return;
    }

    const confirmed = window.confirm(
      "¿Confirmas que deseas reportar una alerta urgente de robo o seguridad?",
    );

    if (!confirmed) return;

    setAppLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const locationName = userLocation?.name || "Local no identificado";

    const { data, error } = await supabase
      .from("incidents")
      .insert({
        title: "Alerta urgente de seguridad",
        type: "Seguridad",
        status: "nuevo",
        description:
          "Alerta crítica generada por locatario desde botón rápido de robo / seguridad.",
        location_id: userLocation?.id || userProfile.location_id || null,
        local_code: userLocation?.local_code || null,
        location_name: locationName,
        report_direction: "local_to_pumay",
        reporter_name: userProfile.name,
        reporter_email: userProfile.email,
        reporter_phone: userProfile.phone,
        priority: "critica",
        assigned_to: "Todos responsables Pumay",
        assigned_to_email: null,
        assigned_by: null,
        assigned_by_email: null,
        assigned_at: null,
        resolution_comment: null,
        closed_at: null,
        organization_id: userProfile.organization_id,
        photo_url: null,
      })
      .select()
      .single();

    if (error) {
      setErrorMessage("No se pudo crear la alerta urgente.");
      setAppLoading(false);
      return;
    }

    if (data?.id) {
      await createIncidentLog({
        incidentId: data.id,
        action: "urgent_security_created",
        description: `Alerta urgente de seguridad generada por ${userProfile.name}.`,
      });

      await notifyAllUsersForCriticalSecurity(data as Incident);
    }

    setSuccessMessage(
      "Alerta urgente enviada. Todos los usuarios activos con notificaciones fueron avisados.",
    );

    await loadIncidents(userProfile);
    setAppLoading(false);
  }

  async function updateIncidentStatus(
    incidentId: number,
    newStatus: string,
    resolutionComment?: string,
    closurePhotos: File[] = [],
  ) {
    setAppLoading(true);
    setCaseActionMessage(
      newStatus === "cerrado"
        ? closurePhotos.length > 0
          ? "Cerrando caso y subiendo adjuntos..."
          : "Cerrando caso..."
        : newStatus === "en proceso"
          ? "Tomando caso y notificando al reportante..."
          : "Actualizando caso...",
    );
    setErrorMessage("");
    setSuccessMessage("");

    let finalResolutionComment = resolutionComment || null;
    let takenComment: string | null = null;
    const incidentBeforeUpdate =
      incidents.find((item) => item.id === incidentId) || null;

    try {
      if (newStatus === "en proceso") {
        const comment = window.prompt(
          "Escribe un comentario para quien reportó este caso. Ejemplo: Tomamos el caso y revisaremos el sector durante la tarde.",
        );

        if (!comment || comment.trim().length < 5) {
          setErrorMessage(
            "Para tomar un caso debes ingresar un comentario para quien lo reportó.",
          );
          setAppLoading(false);
          setCaseActionMessage("");
          return;
        }

        takenComment = comment.trim();
      }

      if (newStatus === "cerrado") {
        const isPumayToLocalWithResponse =
          incidentBeforeUpdate?.report_direction === "pumay_to_local" &&
          (Boolean(incidentBeforeUpdate.local_responded_at) ||
            Boolean(incidentBeforeUpdate.local_response_comment));

        const comment = window.prompt(
          isPumayToLocalWithResponse
            ? "Describe la validación realizada por Pumay luego de revisar la respuesta del local:"
            : "Describe brevemente qué gestión se realizó para cerrar este caso:",
        );

        if (!comment || comment.trim().length < 5) {
          setErrorMessage(
            isPumayToLocalWithResponse
              ? "Para cerrar este caso debes ingresar un comentario de validación de Pumay."
              : "Para cerrar un caso debes ingresar un comentario de gestión.",
          );
          setAppLoading(false);
          setCaseActionMessage("");
          return;
        }

        finalResolutionComment = comment.trim();
      }

      const updatePayload: {
        status: string;
        closed_at?: string | null;
        resolution_comment?: string | null;
        taken_at?: string | null;
      } = {
        status: newStatus,
      };

      if (newStatus === "en proceso") {
        updatePayload.taken_at = new Date().toISOString();
      }

      if (newStatus === "cerrado") {
        updatePayload.closed_at = new Date().toISOString();
        updatePayload.resolution_comment = finalResolutionComment;
      }

      const { error } = await supabase
        .from("incidents")
        .update(updatePayload)
        .eq("id", incidentId);

      if (error) {
        setErrorMessage("No se pudo actualizar el incidente.");
        setAppLoading(false);
        setCaseActionMessage("");
        return;
      }

      let attachmentWarning = "";

      if (newStatus === "cerrado") {
        if (closurePhotos.length > 0) {
          setCaseActionMessage("Subiendo fotos/video de cierre...");

          try {
            await uploadIncidentPhotos({
              incidentId,
              files: closurePhotos,
              photoType: "closure",
              setMainPhoto: false,
            });
          } catch (uploadError) {
            console.error(
              "Caso cerrado, pero falló la subida de adjuntos:",
              uploadError,
            );
            attachmentWarning =
              uploadError instanceof Error
                ? ` El caso se cerró, pero algunos adjuntos no se pudieron subir: ${uploadError.message}`
                : " El caso se cerró, pero algunos adjuntos no se pudieron subir.";
          }
        }

        setCaseActionMessage("Guardando historial de cierre...");

        const isPumayToLocalWithResponse =
          incidentBeforeUpdate?.report_direction === "pumay_to_local" &&
          (Boolean(incidentBeforeUpdate.local_responded_at) ||
            Boolean(incidentBeforeUpdate.local_response_comment));

        await createIncidentLog({
          incidentId,
          action: "closed",
          description: isPumayToLocalWithResponse
            ? `Cierre validado por Pumay luego de revisar la respuesta del local. Cerrado por ${
                userProfile?.name || "usuario"
              }. Comentario de validación: ${finalResolutionComment}`
            : `Caso cerrado por ${
                userProfile?.name || "usuario"
              }. Comentario: ${finalResolutionComment}`,
        });

        if (incidentBeforeUpdate) {
          const closedIncident = {
            ...incidentBeforeUpdate,
            status: "cerrado",
            closed_at: new Date().toISOString(),
            resolution_comment: finalResolutionComment,
          } as Incident;

          setCaseActionMessage("Notificando cierre...");

          await notifyAdminsAndOwnerOnNewCase(closedIncident);
          await notifyCaseCreatorOnClose(closedIncident);

          if (closedIncident.location_id) {
            await notifyLocalContactPush(closedIncident);
          }
        }

        setSuccessMessage(
          isPumayToLocalWithResponse
            ? `Caso Pumay → Local cerrado correctamente. Se dejó registrada la validación de Pumay luego de revisar la respuesta del local.${attachmentWarning}`
            : `Caso cerrado correctamente. Se guardó el comentario, el historial y se notificó al reportante.${attachmentWarning}`,
        );
      } else {
        const assignedLabel =
          incidentBeforeUpdate?.assigned_to || "equipo Pumay";

        setCaseActionMessage("Guardando historial...");

        await createIncidentLog({
          incidentId,
          action: newStatus === "en proceso" ? "taken" : "status_updated",
          description:
            newStatus === "en proceso"
              ? `Caso tomado por ${userProfile?.name || "usuario"}. Equipo asignado: ${assignedLabel}. Comentario enviado al reportante: ${takenComment}`
              : `Estado actualizado a ${newStatus} por ${userProfile?.name || "usuario"}.`,
        });

        if (newStatus === "en proceso" && incidentBeforeUpdate) {
          const takenIncident = {
            ...incidentBeforeUpdate,
            status: "en proceso",
            taken_at: new Date().toISOString(),
          } as Incident;

          setCaseActionMessage("Notificando al reportante...");
          await notifyCaseCreatorOnTaken(takenIncident, takenComment);

          setSuccessMessage(
            "Caso tomado correctamente. Se notificó al usuario que reportó el caso con el comentario ingresado.",
          );
        } else {
          setSuccessMessage("Incidente actualizado correctamente.");
        }
      }

      setCaseActionMessage("Actualizando vista...");
      await loadIncidents();
      await Promise.all([
        loadIncidentLogs(incidentId),
        loadIncidentPhotos(incidentId),
      ]);
    } catch (error) {
      console.error("Error actualizando estado del caso:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo completar la actualización del caso.",
      );
    }

    setCaseActionMessage("");
    setAppLoading(false);
  }

  async function updateIncidentAssignee(
    incidentId: number,
    assignedTo: string,
  ) {
    const activeRole = normalizeRoleValue(userProfile?.role);

    if (!userProfile || !["owner", "super_admin"].includes(activeRole)) {
      setErrorMessage(
        "Solo owner o súper administrador pueden asignar tareas.",
      );
      return;
    }

    setAppLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const incident = incidents.find((item) => item.id === incidentId) || null;
    const targetArea = assignedTo ? normalizeAreaValue(assignedTo) : null;
    const assignedEmail = assignedTo ? getResponsibleEmail(assignedTo) : null;
    const assignedAt = assignedTo ? new Date().toISOString() : null;

    const fullAssignmentPayload = {
      assigned_to: assignedTo || null,
      assigned_to_email: assignedEmail,
      assigned_by: userProfile.name,
      assigned_by_email: userProfile.email,
      assigned_at: assignedAt,
      target_area: targetArea,
      responsible_area: targetArea,
    };

    const legacyAssignmentPayload = {
      assigned_to: assignedTo || null,
      assigned_to_email: assignedEmail,
      assigned_by: userProfile.name,
      assigned_by_email: userProfile.email,
      assigned_at: assignedAt,
    };

    let { error } = await supabase
      .from("incidents")
      .update(fullAssignmentPayload)
      .eq("id", incidentId);

    if (error) {
      const message = String(error.message || "").toLowerCase();
      const shouldRetryLegacy =
        message.includes("target_area") ||
        message.includes("responsible_area") ||
        message.includes("schema cache");

      if (shouldRetryLegacy) {
        console.warn(
          "Actualización de responsable reintentada sin columnas de área:",
          error,
        );

        const retry = await supabase
          .from("incidents")
          .update(legacyAssignmentPayload)
          .eq("id", incidentId);

        error = retry.error;
      }
    }

    if (error) {
      setErrorMessage("No se pudo actualizar el responsable asignado.");
      setAppLoading(false);
      return;
    }

    await createIncidentLog({
      incidentId,
      action: "assigned",
      description: assignedTo
        ? `${userProfile.name} asignó el caso a ${assignedTo}.`
        : `${userProfile.name} dejó el caso sin responsable asignado.`,
    });

    if (assignedTo && assignedEmail && incident) {
      try {
        const notifyResponse = await fetch("/api/push/notify-assigned", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationId: userProfile.organization_id,
            assignedToEmail: assignedEmail,
            assignedToName: assignedTo,
            assignedTo,
            targetArea,
            responsibleArea: targetArea,
            assignedByName: userProfile.name,
            incidentTitle: incident.title,
            incidentLocation: incident.location_name,
            url: "/",
          }),
        });

        const notifyResult = await notifyResponse.json();

        if (notifyResponse.ok && notifyResult.sent > 0) {
          setSuccessMessage(
            `Responsable actualizado correctamente. Notificación enviada a ${assignedTo}.`,
          );
        } else {
          setSuccessMessage(
            `Responsable actualizado correctamente. ${assignedTo} no tiene notificaciones activadas en este dispositivo.`,
          );
        }
      } catch {
        setSuccessMessage(
          "Responsable actualizado correctamente, pero no se pudo enviar la notificación push.",
        );
      }
    } else {
      setSuccessMessage("Responsable actualizado correctamente.");
    }

    await loadIncidents();
    await loadIncidentLogs(incidentId);
    setAppLoading(false);
  }

  async function activatePushNotifications() {
    if (!userProfile) return;

    setPushStatus("");
    setErrorMessage("");
    setSuccessMessage("");

    if (!("serviceWorker" in navigator)) {
      setErrorMessage("Este navegador no soporta service workers.");
      return;
    }

    if (!("PushManager" in window)) {
      setErrorMessage("Este navegador no soporta notificaciones push.");
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      setErrorMessage("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setErrorMessage("No se autorizó el permiso de notificaciones.");
        return;
      }

      const registration =
        (await registerFixLoopServiceWorker()) ||
        (await navigator.serviceWorker.ready);
      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const response = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userEmail: userProfile.email,
          organizationId: userProfile.organization_id,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        setErrorMessage("No se pudo guardar la suscripción push.");
        return;
      }

      setPushStatus("Notificaciones activadas en este navegador.");
      setSuccessMessage("Notificaciones push activadas correctamente.");
    } catch {
      setErrorMessage("No se pudieron activar las notificaciones.");
    }
  }

  const metricIncidents = useMemo(() => {
    return incidents.filter(isDashboardMetricIncident);
  }, [incidents]);

  const visibleIncidents = useMemo(() => {
    /*
      Owner ve todo para limpieza.
      Usuarios operacionales (Aseo, Seguridad, Mantención, Comercial, Operaciones)
      deben ver todos los casos que loadIncidents ya les permitió cargar, incluyendo
      reportes internos/checklist y tareas asignadas por área. No usamos
      metricIncidents para ellos porque ese filtro excluye reportes de servicio.
    */
    return isOwner || isOperationalUser ? incidents : metricIncidents;
  }, [isOwner, isOperationalUser, incidents, metricIncidents]);

  const filteredIncidents = useMemo(() => {
    return visibleIncidents.filter((incident) => {
      const status = normalizeStatus(incident.status);
      const priority = normalizePriority(incident.priority);
      const direction = incident.report_direction || "local_to_pumay";

      const matchesStatus =
        statusFilter === "Todos" ||
        (statusFilter === "Nuevo" && status === "abierto") ||
        (statusFilter === "En proceso" && status === "en revisión") ||
        (statusFilter === "Cerrado" && status === "cerrado");

      const matchesType =
        typeFilter === "Todos" || incident.type === typeFilter;

      const matchesPriority =
        priorityFilter === "Todos" ||
        (priorityFilter === "Crítica" && priority === "alta") ||
        (priorityFilter === "Media" && priority === "media") ||
        (priorityFilter === "Baja" && priority === "baja");

      const matchesResponsible =
        responsibleFilter === "Todos" ||
        incident.assigned_to === responsibleFilter;

      const matchesDirection =
        directionFilter === "Todos" ||
        (directionFilter === "Local → Pumay" &&
          direction === "local_to_pumay") ||
        (directionFilter === "Pumay → Local" &&
          direction === "pumay_to_local") ||
        (directionFilter === "Pumay → Equipo interno" &&
          direction === "pumay_internal") ||
        (directionFilter === "Interno → Pumay" &&
          direction === "internal_to_pumay");

      const hasLocalResponse =
        Boolean(incident.local_responded_at) ||
        Boolean(incident.local_response_comment);

      const matchesLocalResponse =
        localResponseFilter === "Todos" ||
        (localResponseFilter === "Respondidos por local" &&
          incident.report_direction === "pumay_to_local" &&
          hasLocalResponse) ||
        (localResponseFilter === "Pendientes respuesta local" &&
          incident.report_direction === "pumay_to_local" &&
          !hasLocalResponse &&
          normalizeStatus(incident.status) !== "cerrado");

      const text = `${incident.title || ""} ${incident.description || ""} ${
        incident.location_name || ""
      } ${incident.reporter_name || ""} ${incident.assigned_to || ""} ${
        incident.local_code || ""
      } ${incident.target_local_contact_name || ""}`
        .toLowerCase()
        .trim();

      const matchesSearch =
        searchTerm.trim() === "" ||
        text.includes(searchTerm.toLowerCase().trim());

      return (
        matchesStatus &&
        matchesType &&
        matchesPriority &&
        matchesResponsible &&
        matchesDirection &&
        matchesLocalResponse &&
        matchesSearch
      );
    });
  }, [
    visibleIncidents,
    statusFilter,
    typeFilter,
    priorityFilter,
    responsibleFilter,
    directionFilter,
    localResponseFilter,
    searchTerm,
  ]);

  const selectedIncident = useMemo(() => {
    if (!selectedIncidentId) return null;

    return (
      incidents.find((incident) => incident.id === selectedIncidentId) || null
    );
  }, [incidents, selectedIncidentId]);

  const metricsBaseIncidents = useMemo(() => {
    return isOwner || isOperationalUser ? incidents : metricIncidents;
  }, [isOwner, isOperationalUser, incidents, metricIncidents]);

  const metrics = useMemo(() => {
    const total = metricsBaseIncidents.length;

    const abiertos = metricsBaseIncidents.filter(
      (i) => normalizeStatus(i.status) === "abierto",
    ).length;

    const revision = metricsBaseIncidents.filter(
      (i) => normalizeStatus(i.status) === "en revisión",
    ).length;

    const cerrados = metricsBaseIncidents.filter(
      (i) => normalizeStatus(i.status) === "cerrado",
    ).length;

    return { total, abiertos, revision, cerrados };
  }, [metricsBaseIncidents]);

  const responsibleMetrics = useMemo<ResponsibleMetric[]>(() => {
    return RESPONSIBLE_OPTIONS.map((responsible) => {
      const assignedIncidents = metricIncidents.filter(
        (incident) => incident.assigned_to === responsible.name,
      );

      const nuevos = assignedIncidents.filter(
        (incident) => normalizeStatus(incident.status) === "abierto",
      ).length;

      const enProceso = assignedIncidents.filter(
        (incident) => normalizeStatus(incident.status) === "en revisión",
      ).length;

      const cerrados = assignedIncidents.filter(
        (incident) => normalizeStatus(incident.status) === "cerrado",
      ).length;

      return {
        name: responsible.name,
        email: responsible.email,
        members: responsible.members,
        total: assignedIncidents.length,
        nuevos,
        enProceso,
        cerrados,
        promedioResolucion: calculateAverageResolution(assignedIncidents),
      };
    });
  }, [incidents]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#eef4fa] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{APP_NAME}</h1>
              <p className="text-slate-500">Cargando sesión...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!userProfile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-6 sm:p-8 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{APP_NAME}</h1>
                <p className="mt-1 text-sm text-slate-200">{APP_TAGLINE}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Correo
                </label>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder="correo@pumay.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white font-semibold transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loginLoading ? "Ingresando..." : "Iniciar sesión"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowResetPasswordForm((value) => !value);
                  setResetEmail(email);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="w-full text-center text-sm font-semibold text-sky-700 transition hover:text-sky-900"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>

            {showResetPasswordForm && (
              <form
                onSubmit={handlePasswordReset}
                className="mt-5 rounded-3xl border border-sky-200 bg-sky-50 p-4"
              >
                <h2 className="text-base font-bold text-slate-900">
                  Recuperar contraseña
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Ingresa tu correo y te enviaremos un enlace seguro para crear
                  una nueva contraseña.
                </p>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Correo
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    placeholder="correo@pumay.cl"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-sky-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-800 disabled:opacity-60"
                  >
                    {resetLoading ? "Enviando..." : "Enviar enlace"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetPasswordForm(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    );
  }

  async function sendLocatarioInvitation({
    id,
    localName,
    recipientName,
    recipientEmail,
    password,
  }: {
    id?: number;
    localName: string;
    recipientName?: string;
    recipientEmail: string;
    password: string;
  }) {
    const activeRole = normalizeRoleValue(userProfile?.role);

    if (!userProfile || !["owner", "super_admin"].includes(activeRole)) {
      setErrorMessage(
        "Solo owner o súper administrador pueden enviar invitaciones.",
      );
      return;
    }

    setAppLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/send-locatario-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          localName,
          recipientName,
          recipientEmail,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(
          typeof result?.error === "string"
            ? result.error
            : "No se pudo enviar la invitación.",
        );
        setAppLoading(false);
        return;
      }

      if (id) {
        const { error: updateError } = await supabase
          .from("local_user_access")
          .update({
            invitation_sent: true,
            invitation_sent_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("organization_id", userProfile.organization_id);

        if (updateError) {
          console.error(
            "Error actualizando estado de invitación:",
            updateError,
          );
        }
      }

      setSuccessMessage(
        `Invitación enviada correctamente a ${recipientEmail}.`,
      );
      await loadLocalInvitations(userProfile.organization_id);
    } catch {
      setErrorMessage("No se pudo enviar la invitación.");
    }

    setAppLoading(false);
  }

  async function sendPendingLocatarioInvitations() {
    const activeRole = normalizeRoleValue(userProfile?.role);

    if (!userProfile || !["owner", "super_admin"].includes(activeRole)) {
      setErrorMessage(
        "Solo owner o súper administrador pueden enviar invitaciones.",
      );
      return;
    }

    const pending = localInvitations.filter((item) => !item.invitation_sent);

    if (pending.length === 0) {
      setSuccessMessage("No hay invitaciones pendientes por enviar.");
      return;
    }

    const confirmed = window.confirm(
      `Estás por enviar ${pending.length} invitación(es) pendiente(s). ¿Confirmar envío?`,
    );

    if (!confirmed) return;

    setAppLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    let sent = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        const response = await fetch("/api/send-locatario-invitation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            localName: item.local_name || item.local_code || "Local Pumay",
            recipientName:
              item.user_name || item.user_role_in_local || "Locatario/a",
            recipientEmail: item.user_email,
            password: item.password || DEFAULT_LOCATARIO_PASSWORD,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          failed += 1;
          continue;
        }

        await supabase
          .from("local_user_access")
          .update({
            invitation_sent: true,
            invitation_sent_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .eq("organization_id", userProfile.organization_id);

        sent += 1;
      } catch {
        failed += 1;
      }
    }

    await loadLocalInvitations(userProfile.organization_id);

    if (failed > 0) {
      setErrorMessage(`Se enviaron ${sent} invitaciones y fallaron ${failed}.`);
    } else {
      setSuccessMessage(`Se enviaron ${sent} invitaciones correctamente.`);
    }

    setAppLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#eef4fa] p-3 sm:p-4 md:p-6">
      <AppBadgeSync userProfile={userProfile} userLocation={userLocation} />
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#005A7F] p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-44 items-center justify-center rounded-3xl bg-white p-3 shadow-sm">
                  <img
                    src="/logo-pumay.png"
                    alt="Pumay es Maipú"
                    className="max-h-14 w-auto object-contain"
                  />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-200">
                    Módulo operacional
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                    Gestión operacional
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-200">
                    Casos, locatarios, tareas internas, comunicaciones y
                    seguimiento diario del centro comercial.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm lg:min-w-[330px]">
                <p className="text-sm text-slate-200">Sesión activa</p>
                <p className="text-base font-black text-white">
                  {userProfile.name}
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  Rol: {userProfile.role}
                  {userLocation ? ` · ${userLocation.name}` : ""}
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={activatePushNotifications}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
                  >
                    <Bell className="h-4 w-4" />
                    Activar notificaciones
                  </button>

                  <a
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Módulos
                  </a>
                </div>

                {pushStatus && (
                  <p className="mt-2 text-xs font-semibold text-emerald-100">
                    {pushStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        {criticalAlert && (
          <div className="mb-4 rounded-3xl border border-red-300 bg-red-50 p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-3">
                <div className="rounded-2xl bg-red-600 p-3 text-white">
                  <Siren className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-800">
                    Alerta crítica de seguridad recibida
                  </h2>
                  <p className="mt-1 text-red-700">
                    {criticalAlert.location_name || "Local no informado"} ·{" "}
                    {criticalAlert.reporter_name || "Reportante no informado"}
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {criticalAlert.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCriticalAlert(null)}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-red-700 border border-red-200 hover:bg-red-100"
              >
                Cerrar aviso
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {appLoading && (
          <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
            Procesando...
          </div>
        )}

        {isLocatario ? (
          <LocatarioView
            userProfile={userProfile}
            userLocation={userLocation}
            incidentTitle={incidentTitle}
            setIncidentTitle={setIncidentTitle}
            incidentType={incidentType}
            setIncidentType={setIncidentType}
            incidentPriority={incidentPriority}
            setIncidentPriority={setIncidentPriority}
            incidentDescription={incidentDescription}
            setIncidentDescription={setIncidentDescription}
            incidentPhotos={incidentPhotos}
            setIncidentPhotos={setIncidentPhotos}
            appLoading={appLoading}
            createIncident={createIncident}
            createUrgentSecurityAlert={createUrgentSecurityAlert}
            incidents={incidents}
            updateIncidentStatus={updateIncidentStatus}
            updateIncidentAssignee={updateIncidentAssignee}
            handleViewDetail={handleViewDetail}
          />
        ) : (
          <>
            <AdminView
              userProfile={userProfile}
              userRole={userProfile?.role || ""}
            isSuperAdmin={isSuperAdmin}
            isOwner={isOwner}
            isOperationalUser={isOperationalUser}
            onOpenManagerReport={() => router.push("/informes/gerencial")}
            pushStatus={pushStatus}
            activatePushNotifications={activatePushNotifications}
            metrics={metrics}
            responsibleMetrics={responsibleMetrics}
            incidents={incidents}
            filteredIncidents={filteredIncidents}
            loadIncidents={loadIncidents}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            responsibleFilter={responsibleFilter}
            setResponsibleFilter={setResponsibleFilter}
            directionFilter={directionFilter}
            setDirectionFilter={setDirectionFilter}
            localResponseFilter={localResponseFilter}
            setLocalResponseFilter={setLocalResponseFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            updateIncidentStatus={updateIncidentStatus}
            updateIncidentAssignee={updateIncidentAssignee}
            handleViewDetail={handleViewDetail}
            deleteIncident={deleteIncident}
            locations={locations}
            localCaseLocationId={localCaseLocationId}
            setLocalCaseLocationId={setLocalCaseLocationId}
            localCaseType={localCaseType}
            setLocalCaseType={setLocalCaseType}
            localCasePriority={localCasePriority}
            setLocalCasePriority={setLocalCasePriority}
            localCaseTitle={localCaseTitle}
            setLocalCaseTitle={setLocalCaseTitle}
            localCaseDescription={localCaseDescription}
            setLocalCaseDescription={setLocalCaseDescription}
            localCasePhotos={localCasePhotos}
            setLocalCasePhotos={setLocalCasePhotos}
            notifyLocalContact={notifyLocalContact}
            setNotifyLocalContact={setNotifyLocalContact}
            createPumayToLocalIncident={createPumayToLocalIncident}
            internalTaskResponsible={internalTaskResponsible}
            setInternalTaskResponsible={setInternalTaskResponsible}
            internalTaskType={internalTaskType}
            setInternalTaskType={setInternalTaskType}
            internalTaskPriority={internalTaskPriority}
            setInternalTaskPriority={setInternalTaskPriority}
            internalTaskTitle={internalTaskTitle}
            setInternalTaskTitle={setInternalTaskTitle}
            internalTaskDescription={internalTaskDescription}
            setInternalTaskDescription={setInternalTaskDescription}
            internalTaskPhotos={internalTaskPhotos}
            setInternalTaskPhotos={setInternalTaskPhotos}
            createPumayInternalTask={createPumayInternalTask}
              appLoading={appLoading}
            />
          </>
        )}

        {selectedIncident && (
          <IncidentDetailModal
            incident={selectedIncident}
            logs={incidentLogs}
            photos={incidentPhotosByIncidentId[selectedIncident.id] || []}
            logsLoading={logsLoading}
            isProcessing={appLoading}
            processingMessage={caseActionMessage}
            isAdmin={!isLocatario}
            canAssign={isOwner || isSuperAdmin}
            canDelete={isOwner}
            onClose={() => {
              setSelectedIncidentId(null);
              setIncidentLogs([]);
            }}
            onStatusChange={updateIncidentStatus}
            onAssignedChange={updateIncidentAssignee}
            onDeleteIncident={deleteIncident}
            onLocalResponse={respondToPumayLocalCase}
          />
        )}
      </div>
    </main>
  );
}

function LocatarioView({
  userProfile,
  userLocation,
  incidentTitle,
  setIncidentTitle,
  incidentType,
  setIncidentType,
  incidentPriority,
  setIncidentPriority,
  incidentDescription,
  setIncidentDescription,
  incidentPhotos,
  setIncidentPhotos,
  appLoading,
  createIncident,
  createUrgentSecurityAlert,
  incidents,
  updateIncidentStatus,
  updateIncidentAssignee,
  handleViewDetail,
}: {
  userProfile: UserProfile;
  userLocation: Location | null;
  incidentTitle: string;
  setIncidentTitle: (value: string) => void;
  incidentType: string;
  setIncidentType: (value: string) => void;
  incidentPriority: string;
  setIncidentPriority: (value: string) => void;
  incidentDescription: string;
  setIncidentDescription: (value: string) => void;
  incidentPhotos: File[];
  setIncidentPhotos: (value: File[]) => void;
  appLoading: boolean;
  createIncident: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  createUrgentSecurityAlert: () => Promise<void>;
  incidents: Incident[];
  updateIncidentStatus: (
    incidentId: number,
    newStatus: string,
    resolutionComment?: string,
    closurePhotos?: File[],
  ) => Promise<void>;
  updateIncidentAssignee: (
    incidentId: number,
    assignedTo: string,
  ) => Promise<void>;
  handleViewDetail: (incidentId: number) => void;
}) {
  const [showLocalData, setShowLocalData] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [localCaseFilter, setLocalCaseFilter] = useState<
    "pendientes" | "respondidos" | "cerrados" | "todos"
  >("pendientes");

  const localPendingIncidents = incidents.filter((incident) => {
    const status = normalizeStatus(incident.status);
    const hasLocalResponse =
      Boolean(incident.local_responded_at) ||
      Boolean(incident.local_response_comment);

    return status !== "cerrado" && !hasLocalResponse;
  });

  const localRespondedIncidents = incidents.filter((incident) => {
    return (
      incident.report_direction === "pumay_to_local" &&
      (Boolean(incident.local_responded_at) ||
        Boolean(incident.local_response_comment))
    );
  });

  const localClosedIncidents = incidents.filter((incident) => {
    return normalizeStatus(incident.status) === "cerrado";
  });

  const localVisibleIncidents =
    localCaseFilter === "pendientes"
      ? localPendingIncidents
      : localCaseFilter === "respondidos"
        ? localRespondedIncidents
        : localCaseFilter === "cerrados"
          ? localClosedIncidents
          : incidents;

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="grid grid-cols-1 gap-5 lg:col-span-3 lg:grid-cols-2">
        <div className="h-full rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
          <div className="flex h-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-red-700">
                <Siren className="h-5 w-5" />
                Alerta urgente de seguridad
              </h2>
              <p className="mt-1 text-sm text-red-700">
                Usa este botón solo para reportar robos, hurtos o situaciones de
                seguridad que requieran atención inmediata.
              </p>
            </div>

            <button
              type="button"
              onClick={createUrgentSecurityAlert}
              disabled={appLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 md:w-auto"
            >
              <Siren className="h-5 w-5" />
              Reportar robo / seguridad urgente
            </button>
          </div>
        </div>

        <LocatarioCommercialNotificationCard
          userProfile={userProfile}
          userLocation={userLocation}
        />
      </div>

      <LocatarioWorkAuthorizationCard />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Building2 className="h-6 w-6 text-sky-700" />
              Datos del local
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {userLocation?.name || "Sin local asociado"}
              {userLocation?.local_code ? ` · ${userLocation.local_code}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLocalData((value) => !value)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-100 sm:w-auto"
          >
            <Building2 className="h-4 w-4" />
            {showLocalData ? "Ver menos" : "Ver datos"}
          </button>
        </div>

        {!showLocalData && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-bold text-slate-900">Usuario:</span>{" "}
              {userProfile.name}
            </p>
            <p className="mt-1">
              <span className="font-bold text-slate-900">Correo:</span>{" "}
              {userProfile.email}
            </p>
          </div>
        )}

        {showLocalData && (
          <div className="mt-5 space-y-4">
            <InfoBlock
              icon={<Building2 className="h-5 w-5 text-sky-700" />}
              label="Local"
              value={userLocation?.name || "Sin local asociado"}
            />
            <InfoBlock
              icon={<ClipboardList className="h-5 w-5 text-sky-700" />}
              label="Código local"
              value={userLocation?.local_code || "No informado"}
            />
            <InfoBlock
              icon={<ClipboardList className="h-5 w-5 text-sky-700" />}
              label="Piso"
              value={String(userLocation?.floor || "No informado")}
            />
            <InfoBlock
              icon={<User2 className="h-5 w-5 text-sky-700" />}
              label="Usuario"
              value={userProfile.name}
            />
            <InfoBlock
              icon={<Mail className="h-5 w-5 text-sky-700" />}
              label="Correo"
              value={userProfile.email}
            />
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Crear nueva alerta
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Reporta una solicitud a Pumay y adjunta evidencia si corresponde.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateAlert((value) => !value)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            <AlertTriangle className="h-4 w-4" />
            {showCreateAlert ? "Ocultar" : "Crear alerta"}
          </button>
        </div>

        {!showCreateAlert && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              Para crear un caso de mantención, seguridad, aseo, médico u otro,
              presiona <span className="font-bold">Crear alerta</span>. El
              formulario se abrirá solo cuando lo necesites.
            </p>
          </div>
        )}

        {showCreateAlert && (
          <>
            <p className="mt-4 text-sm text-slate-600">
              Todos los usuarios asociados a este local podrán ver el
              seguimiento de los casos creados.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              <QuickTypeCard
                title="Mantención"
                icon={<Wrench className="h-5 w-5" />}
                active={incidentType === "Mantención"}
                onClick={() => setIncidentType("Mantención")}
              />
              <QuickTypeCard
                title="Seguridad"
                icon={<ShieldAlert className="h-5 w-5" />}
                active={incidentType === "Seguridad"}
                onClick={() => setIncidentType("Seguridad")}
              />
              <QuickTypeCard
                title="Aseo"
                icon={<Sparkles className="h-5 w-5" />}
                active={incidentType === "Aseo"}
                onClick={() => setIncidentType("Aseo")}
              />
              <QuickTypeCard
                title="Médico"
                icon={<Siren className="h-5 w-5" />}
                active={incidentType === "Médico"}
                onClick={() => setIncidentType("Médico")}
              />
              <QuickTypeCard
                title="Otro"
                icon={<AlertTriangle className="h-5 w-5" />}
                active={incidentType === "Otro"}
                onClick={() => setIncidentType("Otro")}
              />
            </div>

            <form onSubmit={createIncident} className="mt-6 space-y-4">
              <TextInput
                label="Título del incidente"
                value={incidentTitle}
                onChange={setIncidentTitle}
                placeholder="Ej: Filtración en sector de cielo"
                required
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectInput
                  label="Tipo"
                  value={incidentType}
                  onChange={setIncidentType}
                >
                  <option>Mantención</option>
                  <option>Seguridad</option>
                  <option>Aseo</option>
                  <option>Médico</option>
                  <option>Emergencia</option>
                  <option>Otro</option>
                </SelectInput>

                <SelectInput
                  label="Prioridad"
                  value={incidentPriority}
                  onChange={setIncidentPriority}
                >
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                </SelectInput>
              </div>

              <TextAreaInput
                label="Descripción"
                value={incidentDescription}
                onChange={setIncidentDescription}
                placeholder="Describe qué ocurre, desde cuándo, ubicación exacta y cualquier antecedente relevante."
                required
              />

              <PhotoInput
                files={incidentPhotos}
                setFiles={setIncidentPhotos}
                requiredText={
                  incidentType === "Mantención" || incidentType === "Emergencia"
                    ? "(obligatoria)"
                    : "(opcional)"
                }
              />

              <button
                type="submit"
                disabled={appLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-white font-semibold transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
              >
                <AlertTriangle className="h-4 w-4" />
                Crear alerta
              </button>
            </form>
          </>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Casos del local
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Revisa los casos pendientes, las respuestas enviadas a Pumay y el
              historial de casos cerrados.
            </p>
          </div>

          <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
            {localVisibleIncidents.length} visible
            {localVisibleIncidents.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <button
            type="button"
            onClick={() => setLocalCaseFilter("pendientes")}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
              localCaseFilter === "pendientes"
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Pendientes
            <span className="mt-1 block text-xs font-semibold opacity-80">
              {localPendingIncidents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLocalCaseFilter("respondidos")}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
              localCaseFilter === "respondidos"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Respondidos
            <span className="mt-1 block text-xs font-semibold opacity-80">
              {localRespondedIncidents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLocalCaseFilter("cerrados")}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
              localCaseFilter === "cerrados"
                ? "border-slate-400 bg-slate-100 text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Cerrados
            <span className="mt-1 block text-xs font-semibold opacity-80">
              {localClosedIncidents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLocalCaseFilter("todos")}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
              localCaseFilter === "todos"
                ? "border-sky-300 bg-sky-50 text-sky-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Todos
            <span className="mt-1 block text-xs font-semibold opacity-80">
              {incidents.length}
            </span>
          </button>
        </div>

        <IncidentList
          incidents={localVisibleIncidents}
          isAdmin={false}
          canAssign={false}
          onStatusChange={updateIncidentStatus}
          onAssignedChange={updateIncidentAssignee}
          onViewDetail={handleViewDetail}
        />
      </div>
    </section>
  );
}

function LocatarioWorkAuthorizationCard() {
  const formUrl = "https://forms.cloud.microsoft/r/g84GFC05tU";
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-3">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
            Normas Pumay
          </p>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <ClipboardList className="h-6 w-6 text-amber-700" />
            Solicitud de trabajos, obras e ingreso de mercadería
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Revisa las condiciones principales antes de solicitar autorización
            para trabajos, obras, turnos nocturnos o ingreso especial de
            mercadería.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 lg:w-auto"
        >
          <ClipboardList className="h-4 w-4" />
          {showDetails ? "Ver menos" : "Ver más"}
        </button>
      </div>

      {!showDetails && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            <span className="font-bold">Resumen:</span> para obras, trabajos
            fuera de horario o ingresos de mercadería de gran volumen, el local
            debe solicitar autorización previa a Pumay.
          </p>
        </div>
      )}

      {showDetails && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Clock3 className="h-5 w-5 text-amber-700" />
                Trabajos y obras
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>
                  • Previa apertura mall: <strong>07:00 a 09:00 hrs.</strong>
                </li>
                <li>
                  • Post cierre mall: <strong>21:00 a 23:00 hrs.</strong>
                </li>
                <li>
                  • Turno noche: <strong>23:00 a 07:00 hrs.</strong> sin salida
                  del mall.
                </li>
                <li>
                  • Si genera ruidos u olores molestos, debe realizarse durante
                  la noche.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Building2 className="h-5 w-5 text-sky-700" />
                Ingreso de mercadería
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>• En horario mall se permite carga menor bien asegurada.</li>
                <li>
                  • Volumen máximo: <strong>0,45 m x 1,5 m.</strong>
                </li>
                <li>
                  • No se permite ingresar carga mal asegurada o de gran volumen
                  por pasillos sin autorización.
                </li>
                <li>
                  • Para gran volumen, usar carga y descarga de{" "}
                  <strong>07:30 a 09:00 hrs.</strong>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-rose-900">
                <AlertTriangle className="h-5 w-5 text-rose-700" />
                Información obligatoria
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-rose-900">
                <li>• Empresa que realizará el trabajo o carga.</li>
                <li>• Patente del vehículo, si corresponde.</li>
                <li>• Identificación de las personas que ingresarán.</li>
                <li>• Fecha, horario solicitado y motivo de la actividad.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-bold">Importante</p>
            <p className="mt-1">
              Pumay revisará la solicitud y podrá aprobar, rechazar o pedir
              antecedentes adicionales. No ejecutes trabajos, obras ni ingresos
              especiales de mercadería sin autorización previa cuando
              corresponda.
            </p>
          </div>

          <a
            href={formUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 sm:w-auto"
          >
            <ClipboardList className="h-4 w-4" />
            Solicitar autorización
          </a>
        </div>
      )}
    </div>
  );
}

function formatInvitationDate(date?: string | null) {
  if (!date) return "Sin envío";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function OperationalActionBoard({ userRole }: { userRole: string }) {
  const [showPanelControl, setShowPanelControl] = useState(false);
  const normalizedRole = normalizeRoleValue(userRole);

  const isOwner = normalizedRole === "owner";
  const isSuperAdmin = normalizedRole === "super_admin";
  const isSecurity = normalizedRole === "seguridad";
  const isCleaning = normalizedRole === "aseo";

  const canManageUsers = isOwner;
  const canManageLocales = isOwner || isSuperAdmin;
  const canSeeExecutiveReports = isOwner;
  const canAssignTasks = isOwner || isSuperAdmin;
  const canReportToLocal = canReportToLocalRole(normalizedRole);
  const canReportToTeam = canReportToTeamRole(normalizedRole);
  const canManageCommercialPublications = normalizedRole === "comercial";
  const operationCardCount = [
    canReportToLocal,
    canAssignTasks || canReportToTeam,
    canManageCommercialPublications,
  ].filter(Boolean).length;

  const operationGridClass =
    operationCardCount >= 3
      ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      : operationCardCount === 2
        ? "grid grid-cols-1 gap-4 md:grid-cols-2"
        : "grid grid-cols-1 gap-4";

  const adminCardCount = [canManageLocales, canManageUsers].filter(Boolean).length;

  const adminGridClass =
    adminCardCount >= 2
      ? "grid grid-cols-1 gap-4 md:grid-cols-2"
      : "grid grid-cols-1 gap-4";

  const isServiceReporter = isSecurity || isCleaning;
  const serviceLabel = isCleaning ? "Aseo" : "Seguridad";
  const serviceHref = "/reportes-servicio";
  const serviceTone = isSecurity
    ? {
        border: "border-rose-200",
        bg: "bg-rose-50",
        hoverBorder: "hover:border-rose-300",
        hoverBg: "hover:bg-rose-100",
        text: "text-rose-700",
        label: "SEGURIDAD → PUMAY",
        icon: ShieldAlert,
      }
    : {
        border: "border-emerald-200",
        bg: "bg-emerald-50",
        hoverBorder: "hover:border-emerald-300",
        hoverBg: "hover:bg-emerald-100",
        text: "text-emerald-700",
        label: "ASEO → PUMAY",
        icon: Sparkles,
      };

  const ServiceIcon = serviceTone.icon;

  if (isServiceReporter) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-700">
              Acceso de servicio
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Panel de {serviceLabel}
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Este perfil registra novedades propias del servicio y puede
              reportar casos al equipo Pumay. No tiene acceso a administración,
              informes ejecutivos ni gestión de locales.
            </p>
          </div>

          <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
            Vista servicio
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <a
            href={serviceHref}
            className={`rounded-3xl border ${serviceTone.border} ${serviceTone.bg} p-5 text-left transition hover:-translate-y-0.5 ${serviceTone.hoverBorder} ${serviceTone.hoverBg}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-2xl bg-white p-3 ${serviceTone.text} shadow-sm`}
              >
                <ServiceIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Reporte de {serviceLabel} a Pumay
                </p>
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${serviceTone.text}`}
                >
                  {serviceTone.label}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Registra novedades, rondas, hallazgos, tareas cumplidas o eventos
              ocurridos durante el servicio.
            </p>
          </a>

          <a
            href="/tarea-equipo"
            className="h-full min-h-[132px] rounded-3xl border border-indigo-200 bg-indigo-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-100"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-indigo-700 shadow-sm">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Reportar caso al equipo Pumay
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                  {serviceLabel} → Equipo Pumay
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Informa una solicitud, hallazgo o apoyo requerido para que el
              equipo interno lo gestione y quede trazado.
            </p>
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-700">
            Accesos rápidos
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Panel de control
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Accede a los flujos principales cuando necesites operar,
            administrar o revisar informes.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
            {isOwner
              ? "Vista owner"
              : isSuperAdmin
                ? "Vista operativa"
                : canReportToLocal || canReportToTeam
                  ? "Vista operacional"
                  : "Vista restringida"}
          </span>

          <button
            type="button"
            onClick={() => setShowPanelControl((value) => !value)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            <ClipboardList className="h-4 w-4" />
            {showPanelControl ? "Ver menos" : "Ver más"}
          </button>
        </div>
      </div>

      {!showPanelControl && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-bold text-slate-900">Resumen:</span>{" "}
            operación diaria, administración e informes ejecutivos quedan
            disponibles al desplegar el panel.
          </p>
        </div>
      )}

      {showPanelControl &&
        (canReportToLocal ||
          canReportToTeam ||
          canAssignTasks ||
          canManageCommercialPublications) && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
            <span className="h-2 w-2 rounded-full bg-sky-600" />
            Operación diaria
          </div>

          <div className={operationGridClass}>
            {canReportToLocal && (
              <a
                href="/reportar-local"
                className="h-full min-h-[132px] rounded-3xl border border-sky-200 bg-sky-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-sky-700 shadow-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      Reportar caso a local
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                      Pumay → Local
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Crea una observación, falla o incumplimiento que debe
                  gestionar el encargado del local.
                </p>
              </a>
            )}

            {(canAssignTasks || canReportToTeam) && (
              <a
                href="/tarea-equipo"
                className="h-full min-h-[132px] rounded-3xl border border-indigo-200 bg-indigo-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-100"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-indigo-700 shadow-sm">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {canAssignTasks
                        ? "Asignar tarea a equipo Pumay"
                        : "Reportar caso al equipo Pumay"}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                      Pumay → Equipo interno
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  {canAssignTasks
                    ? "Asigna tareas a Operaciones, Mantención, Seguridad, Aseo, Comercial o todos los responsables."
                    : "Informa una solicitud, hallazgo o apoyo requerido para que el equipo interno lo gestione."}
                </p>
              </a>
            )}

            {canManageCommercialPublications && (
              <a
                href="/comercial"
                className="h-full min-h-[132px] rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:bg-fuchsia-100"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-fuchsia-700 shadow-sm">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      Publicaciones comerciales
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-700">
                      Comercial → Locatarios
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Crea comunicados, campañas, avisos y documentos para
                  locatarios.
                </p>
              </a>
            )}
          </div>
        </div>
      )}

      {showPanelControl && (canManageLocales || canManageUsers) && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Administración
          </div>

          <div className={adminGridClass}>
            {canManageLocales && (
              <a
                href="/admin/locales"
                className="h-full min-h-[132px] rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      Administrar locales
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Crear / editar locales
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Crea locales, actualiza datos, edita contactos y mantiene la
                  base operativa.
                </p>
              </a>
            )}

            {canManageUsers && (
              <a
                href="/admin/usuarios"
                className="h-full min-h-[132px] rounded-3xl border border-slate-300 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-slate-800 shadow-sm">
                    <User2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      Usuarios Pumay
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      Control owner
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Crea usuarios internos, define roles y controla accesos
                  superiores.
                </p>
              </a>
            )}
          </div>
        </div>
      )}

      {showPanelControl && canSeeExecutiveReports && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            Informes ejecutivos
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <a
              href="/informes/gerencial"
              className="h-full min-h-[132px] rounded-3xl border border-slate-300 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-sm">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    Informe gerencial
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Vista owner
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Consolida incidentes, tareas, estados y gestión general del
                periodo.
              </p>
            </a>

            <a
              href="/informes/seguridad"
              className="h-full min-h-[132px] rounded-3xl border border-rose-200 bg-rose-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-rose-700 shadow-sm">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    Informe de Seguridad
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                    Seguridad → Pumay
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Revisa novedades, rondas, eventos e incidencias reportadas por
                Seguridad.
              </p>
            </a>

            <a
              href="/informes/aseo"
              className="h-full min-h-[132px] rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    Informe de Aseo
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Aseo → Pumay
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Revisa tareas cumplidas, sectores intervenidos, hallazgos y
                novedades de Aseo.
              </p>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

function AdminView({
  userProfile,
  userRole,
  isSuperAdmin,
  isOwner,
  isOperationalUser,
  onOpenManagerReport,
  pushStatus,
  activatePushNotifications,
  metrics,
  responsibleMetrics,
  incidents,
  filteredIncidents,
  loadIncidents,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  responsibleFilter,
  setResponsibleFilter,
  directionFilter,
  setDirectionFilter,
  localResponseFilter,
  setLocalResponseFilter,
  searchTerm,
  setSearchTerm,
  updateIncidentStatus,
  updateIncidentAssignee,
  handleViewDetail,
  deleteIncident,
  locations,
  localCaseLocationId,
  setLocalCaseLocationId,
  localCaseType,
  setLocalCaseType,
  localCasePriority,
  setLocalCasePriority,
  localCaseTitle,
  setLocalCaseTitle,
  localCaseDescription,
  setLocalCaseDescription,
  localCasePhotos,
  setLocalCasePhotos,
  notifyLocalContact,
  setNotifyLocalContact,
  createPumayToLocalIncident,
  internalTaskResponsible,
  setInternalTaskResponsible,
  internalTaskType,
  setInternalTaskType,
  internalTaskPriority,
  setInternalTaskPriority,
  internalTaskTitle,
  setInternalTaskTitle,
  internalTaskDescription,
  setInternalTaskDescription,
  internalTaskPhotos,
  setInternalTaskPhotos,
  createPumayInternalTask,
  appLoading,
}: {
  userProfile: UserProfile;
  userRole: string;
  isSuperAdmin: boolean;
  isOwner: boolean;
  isOperationalUser: boolean;
  onOpenManagerReport: () => void;
  pushStatus: string;
  activatePushNotifications: () => Promise<void>;
  metrics: {
    total: number;
    abiertos: number;
    revision: number;
    cerrados: number;
  };
  responsibleMetrics: ResponsibleMetric[];
  incidents: Incident[];
  filteredIncidents: Incident[];
  loadIncidents: () => Promise<void>;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  responsibleFilter: string;
  setResponsibleFilter: (value: string) => void;
  directionFilter: string;
  setDirectionFilter: (value: string) => void;
  localResponseFilter: string;
  setLocalResponseFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  updateIncidentStatus: (
    incidentId: number,
    newStatus: string,
    resolutionComment?: string,
    closurePhotos?: File[],
  ) => Promise<void>;
  updateIncidentAssignee: (
    incidentId: number,
    assignedTo: string,
  ) => Promise<void>;
  handleViewDetail: (incidentId: number) => void;
  deleteIncident: (incident: Incident) => Promise<void>;
  locations: Location[];
  localCaseLocationId: string;
  setLocalCaseLocationId: (value: string) => void;
  localCaseType: string;
  setLocalCaseType: (value: string) => void;
  localCasePriority: string;
  setLocalCasePriority: (value: string) => void;
  localCaseTitle: string;
  setLocalCaseTitle: (value: string) => void;
  localCaseDescription: string;
  setLocalCaseDescription: (value: string) => void;
  localCasePhotos: File[];
  setLocalCasePhotos: (value: File[]) => void;
  notifyLocalContact: boolean;
  setNotifyLocalContact: (value: boolean) => void;
  createPumayToLocalIncident: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  internalTaskResponsible: string;
  setInternalTaskResponsible: (value: string) => void;
  internalTaskType: string;
  setInternalTaskType: (value: string) => void;
  internalTaskPriority: string;
  setInternalTaskPriority: (value: string) => void;
  internalTaskTitle: string;
  setInternalTaskTitle: (value: string) => void;
  internalTaskDescription: string;
  setInternalTaskDescription: (value: string) => void;
  internalTaskPhotos: File[];
  setInternalTaskPhotos: (value: File[]) => void;
  createPumayInternalTask: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  appLoading: boolean;
}) {
  const pumayToLocalCases = incidents.filter(
    (incident) => incident.report_direction === "pumay_to_local",
  );

  const pumayToLocalPendingResponse = pumayToLocalCases.filter((incident) => {
    const hasLocalResponse =
      Boolean(incident.local_responded_at) ||
      Boolean(incident.local_response_comment);

    return normalizeStatus(incident.status) !== "cerrado" && !hasLocalResponse;
  });

  const pumayToLocalResponded = pumayToLocalCases.filter((incident) => {
    const hasLocalResponse =
      Boolean(incident.local_responded_at) ||
      Boolean(incident.local_response_comment);

    return normalizeStatus(incident.status) !== "cerrado" && hasLocalResponse;
  });

  const pumayToLocalClosed = pumayToLocalCases.filter((incident) => {
    return normalizeStatus(incident.status) === "cerrado";
  });

  return (
    <section className="space-y-5">
      {normalizeRoleValue(userProfile.role) !== "comercial" && (
        <PumayCommercialNotificationCard userProfile={userProfile} />
      )}

      <OperationalActionBoard userRole={userRole} />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
              Resumen operativo
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Estado general de casos
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Vista consolidada de los casos visibles según tu perfil.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadIncidents()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {metrics.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isOperationalUser ? "Tareas visibles" : "Registros visibles"}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
              Nuevos
            </p>
            <p className="mt-2 text-3xl font-black text-rose-800">
              {metrics.abiertos}
            </p>
            <p className="mt-1 text-xs text-rose-700/80">
              Pendientes de gestión
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              En proceso
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {metrics.revision}
            </p>
            <p className="mt-1 text-xs text-amber-700/80">
              Casos tomados
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Cerrados
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-800">
              {metrics.cerrados}
            </p>
            <p className="mt-1 text-xs text-emerald-700/80">
              Casos finalizados
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isOwner || isSuperAdmin ? "Panel de casos" : "Mis tareas"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {isOwner || isSuperAdmin
                ? "Aquí puedes revisar casos Local → Pumay, Pumay → Local y tareas internas."
                : "Aquí puedes revisar, tomar y cerrar las tareas que tienes asignadas."}
            </p>
          </div>

          <button
            onClick={() => loadIncidents()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <AdminFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          responsibleFilter={responsibleFilter}
          setResponsibleFilter={setResponsibleFilter}
          directionFilter={directionFilter}
          setDirectionFilter={setDirectionFilter}
          localResponseFilter={localResponseFilter}
          setLocalResponseFilter={setLocalResponseFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          total={incidents.length}
          filteredTotal={filteredIncidents.length}
        />

        <IncidentList
          incidents={filteredIncidents}
          isAdmin={true}
          canAssign={isOwner || isSuperAdmin}
          canDelete={isOwner}
          onStatusChange={updateIncidentStatus}
          onAssignedChange={updateIncidentAssignee}
          onViewDetail={handleViewDetail}
          onDeleteIncident={deleteIncident}
        />
      </div>
    </section>
  );
}

function PumayInternalTaskForm({
  internalTaskResponsible,
  setInternalTaskResponsible,
  internalTaskType,
  setInternalTaskType,
  internalTaskPriority,
  setInternalTaskPriority,
  internalTaskTitle,
  setInternalTaskTitle,
  internalTaskDescription,
  setInternalTaskDescription,
  internalTaskPhotos,
  setInternalTaskPhotos,
  createPumayInternalTask,
  appLoading,
}: {
  internalTaskResponsible: string;
  setInternalTaskResponsible: (value: string) => void;
  internalTaskType: string;
  setInternalTaskType: (value: string) => void;
  internalTaskPriority: string;
  setInternalTaskPriority: (value: string) => void;
  internalTaskTitle: string;
  setInternalTaskTitle: (value: string) => void;
  internalTaskDescription: string;
  setInternalTaskDescription: (value: string) => void;
  internalTaskPhotos: File[];
  setInternalTaskPhotos: (value: File[]) => void;
  createPumayInternalTask: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  appLoading: boolean;
}) {
  return (
    <div className="rounded-3xl border border-indigo-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Asignar tarea a equipo Pumay
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Usa este flujo para crear tareas internas para Aseo, Seguridad,
            Mantención, Operaciones, Comercial o todos los responsables Pumay.
          </p>
        </div>

        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
          Pumay → Equipo interno
        </span>
      </div>

      <form onSubmit={createPumayInternalTask} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectInput
            label="Equipo responsable"
            value={internalTaskResponsible}
            onChange={setInternalTaskResponsible}
          >
            {RESPONSIBLE_OPTIONS.map((responsible) => (
              <option key={responsible.name}>{responsible.name}</option>
            ))}
          </SelectInput>

          <SelectInput
            label="Tipo de tarea"
            value={internalTaskType}
            onChange={setInternalTaskType}
          >
            {PUMAY_INTERNAL_TASK_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </SelectInput>

          <SelectInput
            label="Prioridad"
            value={internalTaskPriority}
            onChange={setInternalTaskPriority}
          >
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
          </SelectInput>
        </div>

        <TextInput
          label="Título de la tarea"
          value={internalTaskTitle}
          onChange={setInternalTaskTitle}
          placeholder="Ej: Revisar baños del segundo piso"
          required
        />

        <TextAreaInput
          label="Descripción"
          value={internalTaskDescription}
          onChange={setInternalTaskDescription}
          placeholder="Describe la tarea, ubicación, plazo esperado o antecedente relevante."
          required
        />

        <PhotoInput
          files={internalTaskPhotos}
          setFiles={setInternalTaskPhotos}
          requiredText="(opcional)"
        />

        <button
          type="submit"
          disabled={appLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-5 py-3 text-white font-semibold transition hover:bg-indigo-800 disabled:opacity-60 sm:w-auto"
        >
          <ClipboardList className="h-4 w-4" />
          Asignar tarea interna
        </button>
      </form>
    </div>
  );
}

function PumayToLocalForm({
  locations,
  localCaseLocationId,
  setLocalCaseLocationId,
  localCaseType,
  setLocalCaseType,
  localCasePriority,
  setLocalCasePriority,
  localCaseTitle,
  setLocalCaseTitle,
  localCaseDescription,
  setLocalCaseDescription,
  localCasePhotos,
  setLocalCasePhotos,
  notifyLocalContact,
  setNotifyLocalContact,
  createPumayToLocalIncident,
  appLoading,
}: {
  locations: Location[];
  localCaseLocationId: string;
  setLocalCaseLocationId: (value: string) => void;
  localCaseType: string;
  setLocalCaseType: (value: string) => void;
  localCasePriority: string;
  setLocalCasePriority: (value: string) => void;
  localCaseTitle: string;
  setLocalCaseTitle: (value: string) => void;
  localCaseDescription: string;
  setLocalCaseDescription: (value: string) => void;
  localCasePhotos: File[];
  setLocalCasePhotos: (value: File[]) => void;
  notifyLocalContact: boolean;
  setNotifyLocalContact: (value: boolean) => void;
  createPumayToLocalIncident: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  appLoading: boolean;
}) {
  return (
    <div className="rounded-3xl border border-violet-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Reportar caso a local
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Usa este flujo cuando Pumay detecte una falla, desorden,
            incumplimiento o situación que deba gestionar el encargado del
            local.
          </p>
        </div>

        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
          Pumay → Local
        </span>
      </div>

      <form onSubmit={createPumayToLocalIncident} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectInput
            label="Local afectado"
            value={localCaseLocationId}
            onChange={setLocalCaseLocationId}
          >
            <option value="">Seleccionar local</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.local_code ? `${location.local_code} · ` : ""}
                {location.name}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Tipo de caso"
            value={localCaseType}
            onChange={setLocalCaseType}
          >
            {PUMAY_TO_LOCAL_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </SelectInput>

          <SelectInput
            label="Prioridad"
            value={localCasePriority}
            onChange={setLocalCasePriority}
          >
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
          </SelectInput>
        </div>

        <TextInput
          label="Título del caso"
          value={localCaseTitle}
          onChange={setLocalCaseTitle}
          placeholder="Ej: Cortina del local presenta falla al cierre"
          required
        />

        <TextAreaInput
          label="Descripción"
          value={localCaseDescription}
          onChange={setLocalCaseDescription}
          placeholder="Describe la observación, ubicación exacta, evidencia y acción esperada por parte del local."
          required
        />

        <PhotoInput
          files={localCasePhotos}
          setFiles={setLocalCasePhotos}
          requiredText="(opcional)"
        />

        <label className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <input
            type="checkbox"
            checked={notifyLocalContact}
            onChange={(e) => setNotifyLocalContact(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-bold">Notificar al encargado del local.</span>{" "}
            Se avisará a los usuarios del local que tengan permiso para recibir
            notificaciones y responder casos enviados por Pumay.
          </span>
        </label>

        <button
          type="submit"
          disabled={appLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-white font-semibold transition hover:bg-violet-800 disabled:opacity-60 sm:w-auto"
        >
          <Building2 className="h-4 w-4" />
          Enviar caso al local
        </button>
      </form>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function QuickTypeCard({
  title,
  icon,
  active,
  onClick,
}: {
  title: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-sky-500 bg-sky-50 text-sky-800 shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="mb-2">{icon}</div>
      <p className="font-semibold">{title}</p>
    </button>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  tone: "slate" | "red" | "amber" | "emerald";
}) {
  const tones = {
    slate: "from-slate-800 to-slate-900 text-white",
    red: "from-rose-500 to-red-600 text-white",
    amber: "from-amber-400 to-orange-500 text-white",
    emerald: "from-emerald-500 to-green-600 text-white",
  };

  return (
    <div
      className={`rounded-3xl bg-gradient-to-r ${tones[tone]} p-4 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/85">{title}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-sm text-white/85">{description}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3">{icon}</div>
      </div>
    </div>
  );
}

function ResponsibleMetrics({ metrics }: { metrics: ResponsibleMetric[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Métricas por equipo responsable
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Resumen de carga operativa por equipo, usuarios asociados, estado de
          casos y tiempo promedio de resolución.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {metric.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Total asignados:{" "}
                  <span className="font-bold text-slate-900">
                    {metric.total}
                  </span>
                </p>

                {metric.email && (
                  <p className="mt-1 text-xs text-slate-500">
                    Notificación líder:{" "}
                    <span className="font-semibold text-slate-700">
                      {metric.email}
                    </span>
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                {metric.total}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Usuarios asociados
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {metric.members.map((member) => (
                  <span
                    key={member}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">
                  {metric.nuevos}
                </p>
                <p className="text-xs text-red-700">Nuevos</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {metric.enProceso}
                </p>
                <p className="text-xs text-amber-700">En proceso</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {metric.cerrados}
                </p>
                <p className="text-xs text-emerald-700">Cerrados</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Promedio resolución
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {metric.promedioResolucion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminFilters({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  responsibleFilter,
  setResponsibleFilter,
  directionFilter,
  setDirectionFilter,
  localResponseFilter,
  setLocalResponseFilter,
  searchTerm,
  setSearchTerm,
  total,
  filteredTotal,
}: {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  responsibleFilter: string;
  setResponsibleFilter: (value: string) => void;
  directionFilter: string;
  setDirectionFilter: (value: string) => void;
  localResponseFilter: string;
  setLocalResponseFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  total: number;
  filteredTotal: number;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Filtros de gestión
          </h3>
          <p className="text-sm text-slate-600">
            Mostrando {filteredTotal} de {total} incidentes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("Todos");
            setTypeFilter("Todos");
            setPriorityFilter("Todos");
            setResponsibleFilter("Todos");
            setDirectionFilter("Todos");
            setLocalResponseFilter("Todos");
            setSearchTerm("");
          }}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
        <FilterInput label="Buscar">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Local, título, responsable..."
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          />
        </FilterInput>

        <FilterInput label="Flujo">
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          >
            <option>Todos</option>
            <option>Local → Pumay</option>
            <option>Pumay → Local</option>
            <option>Pumay → Equipo interno</option>
            <option>Interno → Pumay</option>
          </select>
        </FilterInput>

        <FilterInput label="Respuesta local">
          <select
            value={localResponseFilter}
            onChange={(e) => setLocalResponseFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          >
            <option>Todos</option>
            <option>Respondidos por local</option>
            <option>Pendientes respuesta local</option>
          </select>
        </FilterInput>

        <FilterInput label="Estado">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          >
            <option>Todos</option>
            <option>Nuevo</option>
            <option>En proceso</option>
            <option>Cerrado</option>
          </select>
        </FilterInput>

        <FilterInput label="Tipo">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          >
            <option>Todos</option>
            <option>Mantención</option>
            <option>Seguridad</option>
            <option>Aseo</option>
            <option>Médico</option>
            <option>Emergencia</option>
            <option>Otro</option>
            {PUMAY_TO_LOCAL_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </FilterInput>

        <FilterInput label="Prioridad">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          >
            <option>Todos</option>
            <option>Crítica</option>
            <option>Media</option>
            <option>Baja</option>
          </select>
        </FilterInput>

        <FilterInput label="Responsable">
          <select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          >
            <option>Todos</option>
            {RESPONSIBLE_OPTIONS.map((responsible) => (
              <option key={responsible.name}>{responsible.name}</option>
            ))}
          </select>
        </FilterInput>
      </div>
    </div>
  );
}

function FilterInput({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        className="min-h-36 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

function PhotoInput({
  files,
  setFiles,
  requiredText,
}: {
  files: File[];
  setFiles: (value: File[]) => void;
  requiredText: string;
}) {
  const maxImages = 5;
  const maxVideos = 1;

  function isImageFile(file: File) {
    const name = file.name.toLowerCase();
    return (
      file.type.startsWith("image/") ||
      name.endsWith(".heic") ||
      name.endsWith(".heif")
    );
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

  function addFiles(fileList: FileList | null) {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const allowedFiles = incoming.filter(
      (file) => isImageFile(file) || isVideoFile(file),
    );
    const currentImages = files.filter(isImageFile);
    const currentVideos = files.filter(isVideoFile);
    const nextFiles = [...files];

    for (const file of allowedFiles) {
      if (isImageFile(file)) {
        const imageCount = nextFiles.filter(isImageFile).length;
        if (imageCount < maxImages) nextFiles.push(file);
      } else if (isVideoFile(file)) {
        const videoCount = nextFiles.filter(isVideoFile).length;
        if (videoCount < maxVideos) nextFiles.push(file);
      }
    }

    setFiles(nextFiles);
  }

  function removeFile(indexToRemove: number) {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  }

  const imageCount = files.filter(isImageFile).length;
  const videoCount = files.filter(isVideoFile).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Camera className="h-4 w-4 text-sky-700" />
        Fotos y video del caso {requiredText}
      </label>

      <input
        type="file"
        accept="image/*,video/mp4,video/quicktime,video/webm,.heic,.heif,.mov,.m4v"
        multiple
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="mt-2 text-xs text-slate-500">
        Puedes adjuntar hasta 5 fotos y 1 video. Fotos: JPG, PNG, WEBP o HEIC.
        Video: MP4, MOV o WEBM.
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-600">
        Seleccionado: {imageCount}/5 fotos · {videoCount}/1 video.
      </p>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => {
            const isVideo = isVideoFile(file);

            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-700 border border-slate-200"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ImageIcon className="h-4 w-4 shrink-0 text-sky-700" />
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    {isVideo ? "Video" : "Foto"}
                  </span>
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-3 text-slate-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IncidentList({
  incidents,
  isAdmin,
  canAssign,
  canDelete = false,
  onStatusChange,
  onAssignedChange,
  onViewDetail,
  onDeleteIncident,
}: {
  incidents: Incident[];
  isAdmin: boolean;
  canAssign: boolean;
  canDelete?: boolean;
  onStatusChange: (
    incidentId: number,
    newStatus: string,
    resolutionComment?: string,
    closurePhotos?: File[],
  ) => Promise<void>;
  onAssignedChange: (incidentId: number, assignedTo: string) => Promise<void>;
  onViewDetail: (incidentId: number) => void;
  onDeleteIncident?: (incident: Incident) => Promise<void>;
}) {
  if (incidents.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
        Todavía no hay incidentes registrados.
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {incidents.map((incident) => {
        const normalizedStatus = normalizeStatus(incident.status);
        const resolutionTime = calculateDuration(
          incident.assigned_at || incident.created_at,
          incident.closed_at,
        );

        return (
          <div
            key={incident.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {formatDate(incident.created_at)}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDirectionStyle(
                      incident.report_direction,
                    )}`}
                  >
                    {prettyDirection(incident.report_direction)}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      incident.status,
                    )}`}
                  >
                    {prettyStatus(incident.status)}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                      incident.priority,
                    )}`}
                  >
                    {prettyPriority(incident.priority)}
                  </span>

                  {(incident.local_responded_at ||
                    incident.local_response_comment) && (
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      Respondido por local
                    </span>
                  )}
                </div>

                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {incident.title}
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  {incident.description}
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-4">
                  <p>
                    <span className="font-semibold text-slate-800">Local:</span>{" "}
                    {incident.location_name || "Sin local"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Tipo:</span>{" "}
                    {incident.type}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">
                      Reporta:
                    </span>{" "}
                    {incident.reporter_name || "No informado"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">
                      Equipo:
                    </span>{" "}
                    {incident.assigned_to || "Sin asignar"}
                  </p>
                </div>

                {incident.report_direction === "pumay_to_local" && (
                  <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
                    <span className="font-bold">Contacto local:</span>{" "}
                    {incident.target_local_contact_name ||
                      incident.target_local_contact_email ||
                      "No definido"}
                  </div>
                )}

                {incident.assigned_at && (
                  <div className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Asignado el:
                    </span>{" "}
                    {formatDate(incident.assigned_at)}
                    {incident.taken_at && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="font-semibold text-slate-800">
                          Tomado el:
                        </span>{" "}
                        {formatDate(incident.taken_at)}
                      </>
                    )}
                    {incident.closed_at && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="font-semibold text-slate-800">
                          Tiempo resolución:
                        </span>{" "}
                        {resolutionTime}
                      </>
                    )}
                  </div>
                )}

                {isAdmin &&
                  canAssign &&
                  incident.report_direction !== "pumay_to_local" &&
                  !(
                    incident.report_direction === "internal_to_pumay" &&
                    String(incident.assigned_to || "")
                      .toLowerCase()
                      .trim() === "super administración"
                  ) && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Equipo asignado
                      </label>
                      <select
                        value={incident.assigned_to || ""}
                        onChange={(e) =>
                          onAssignedChange(incident.id, e.target.value)
                        }
                        disabled={normalizedStatus === "cerrado"}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Sin asignar</option>
                        {RESPONSIBLE_OPTIONS.map((responsible) => (
                          <option
                            key={responsible.name}
                            value={responsible.name}
                          >
                            {responsible.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                {incident.report_direction === "internal_to_pumay" &&
                  String(incident.assigned_to || "")
                    .toLowerCase()
                    .trim() === "super administración" && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                      <p className="font-bold">
                        Reporte recibido por Super administración
                      </p>
                      <p className="mt-1">
                        Este registro fue enviado desde un servicio interno
                        hacia Pumay y no requiere reasignación desde esta
                        tarjeta.
                      </p>
                    </div>
                  )}

                {incident.resolution_comment && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="font-bold">Comentario de cierre</p>
                    <p className="mt-1">{incident.resolution_comment}</p>

                    {incident.closed_at && (
                      <p className="mt-2 text-xs text-emerald-700">
                        Cerrado el {formatDate(incident.closed_at)}
                      </p>
                    )}
                  </div>
                )}

                {incident.photo_url && (
                  <a
                    href={incident.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Ver adjunto
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row md:flex-col md:justify-end">
                <button
                  onClick={() => onViewDetail(incident.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                >
                  <Eye className="h-4 w-4" />
                  Ver detalle
                </button>

                {isAdmin ? (
                  <>
                    {incident.report_direction !== "pumay_to_local" &&
                      normalizedStatus !== "en revisión" &&
                      normalizedStatus !== "cerrado" && (
                        <button
                          onClick={() =>
                            onStatusChange(incident.id, "en proceso")
                          }
                          className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                        >
                          Tomar caso
                        </button>
                      )}

                    {normalizedStatus !== "cerrado" && (
                      <button
                        onClick={() => onStatusChange(incident.id, "cerrado")}
                        className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Cerrar
                      </button>
                    )}

                    {canDelete && onDeleteIncident && (
                      <button
                        onClick={() => onDeleteIncident(incident)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700">
                    Estado visible para seguimiento
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IncidentDetailModal({
  incident,
  logs,
  photos,
  logsLoading,
  isProcessing,
  processingMessage,
  isAdmin,
  canAssign,
  canDelete,
  onClose,
  onStatusChange,
  onAssignedChange,
  onDeleteIncident,
  onLocalResponse,
}: {
  incident: Incident;
  logs: IncidentLog[];
  photos: IncidentPhoto[];
  logsLoading: boolean;
  isProcessing: boolean;
  processingMessage: string;
  isAdmin: boolean;
  canAssign: boolean;
  canDelete: boolean;
  onClose: () => void;
  onStatusChange: (
    incidentId: number,
    newStatus: string,
    resolutionComment?: string,
    closurePhotos?: File[],
  ) => Promise<void>;
  onAssignedChange: (incidentId: number, assignedTo: string) => Promise<void>;
  onDeleteIncident: (incident: Incident) => Promise<void>;
  onLocalResponse: (
    incidentId: number,
    responseComment: string,
    responsePhotos?: File[],
  ) => Promise<void>;
}) {
  const normalizedStatus = normalizeStatus(incident.status);
  const resolutionTime = calculateDuration(
    incident.assigned_at || incident.created_at,
    incident.closed_at,
  );
  const [closurePhotos, setClosurePhotos] = useState<File[]>([]);
  const [localResponseComment, setLocalResponseComment] = useState("");
  const [localResponsePhotos, setLocalResponsePhotos] = useState<File[]>([]);

  const displayPhotos = useMemo(() => {
    const mapped = photos.map((photo) => ({
      id: String(photo.id),
      url: photo.photo_url,
      type: photo.photo_type,
      createdAt: photo.created_at,
      mediaType: photo.media_type || "image",
      fileName: photo.file_name || null,
    }));

    if (
      incident.photo_url &&
      !mapped.some((photo) => photo.url === incident.photo_url)
    ) {
      mapped.unshift({
        id: "legacy-photo",
        url: incident.photo_url,
        type: "creation",
        createdAt: incident.created_at,
        mediaType: "image",
        fileName: null,
      });
    }

    return mapped;
  }, [photos, incident.photo_url, incident.created_at]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-4 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDirectionStyle(
                  incident.report_direction,
                )}`}
              >
                {prettyDirection(incident.report_direction)}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                  incident.status,
                )}`}
              >
                {prettyStatus(incident.status)}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                  incident.priority,
                )}`}
              >
                {prettyPriority(incident.priority)}
              </span>

              <span className="text-sm text-slate-500">
                Creado el {formatDate(incident.created_at)}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-bold text-slate-900">
              {incident.title}
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Tipo: {incident.type} · Local:{" "}
              {incident.location_name || "Sin local"}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {isProcessing && (
            <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-800">
              {processingMessage || "Procesando caso..."}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DetailItem
              label="Local"
              value={incident.location_name || "Sin local"}
            />
            <DetailItem
              label="Código local"
              value={incident.local_code || "No informado"}
            />
            <DetailItem
              label="Flujo"
              value={prettyDirection(incident.report_direction)}
            />
            <DetailItem
              label="Reporta"
              value={incident.reporter_name || "No informado"}
            />
            <DetailItem
              label="Correo"
              value={incident.reporter_email || "No informado"}
            />
            <DetailItem
              label="Teléfono"
              value={incident.reporter_phone || "No informado"}
            />
            <DetailItem
              label="Equipo Pumay"
              value={incident.assigned_to || "Sin asignar"}
            />
            <DetailItem label="Estado" value={prettyStatus(incident.status)} />
            <DetailItem
              label="Contacto local"
              value={
                incident.target_local_contact_name ||
                incident.target_local_contact_email ||
                "No aplica"
              }
            />
            <DetailItem
              label="Fecha asignación"
              value={
                incident.assigned_at
                  ? formatDate(incident.assigned_at)
                  : "No asignado"
              }
            />
            <DetailItem
              label="Fecha toma"
              value={
                incident.taken_at ? formatDate(incident.taken_at) : "No tomado"
              }
            />
            <DetailItem
              label="Tiempo resolución"
              value={incident.closed_at ? resolutionTime : "Caso abierto"}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-900">Descripción</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">
              {incident.description}
            </p>
          </div>

          {incident.report_direction === "pumay_to_local" && (
            <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-violet-900">
              <p className="text-sm font-bold">Caso enviado al local</p>
              <p className="mt-2 text-sm">
                Este caso fue creado por Pumay para que el encargado del local
                tome conocimiento y gestione la observación correspondiente.
              </p>
              <p className="mt-2 text-sm">
                <span className="font-bold">Puede responder:</span>{" "}
                {incident.target_local_can_respond ? "Sí" : "No definido"}
              </p>
            </div>
          )}

          {incident.report_direction === "pumay_to_local" &&
            isAdmin &&
            (incident.local_responded_at || incident.local_response_comment) && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <p className="text-sm font-bold">Respuesta recibida del local</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {incident.local_response_comment || "Sin comentario registrado."}
                </p>
                <p className="mt-3 text-xs text-emerald-700">
                  Respondido por{" "}
                  {incident.local_responded_by ||
                    incident.local_responded_by_email ||
                    "locatario"}
                  {incident.local_responded_at
                    ? ` · ${formatDate(incident.local_responded_at)}`
                    : ""}
                </p>
                <p className="mt-3 text-xs font-semibold text-emerald-800">
                  Revisa los adjuntos marcados como respuesta y cierra el caso
                  cuando la gestión esté validada.
                </p>
              </div>
            )}

          {incident.report_direction === "pumay_to_local" &&
            !isAdmin &&
            incident.target_local_can_respond !== false && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <p className="text-sm font-bold">Respuesta del local</p>

                {incident.local_responded_at || incident.local_response_comment ? (
                  <div className="mt-3 rounded-2xl border border-emerald-300 bg-white p-4 text-sm">
                    <p className="font-bold text-emerald-900">
                      Respuesta enviada a Pumay
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-emerald-900">
                      {incident.local_response_comment || "Sin comentario registrado."}
                    </p>
                    <p className="mt-3 text-xs text-emerald-700">
                      Respondido por{" "}
                      {incident.local_responded_by ||
                        incident.local_responded_by_email ||
                        "locatario"}
                      {incident.local_responded_at
                        ? ` · ${formatDate(incident.local_responded_at)}`
                        : ""}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-emerald-900">
                      Escribe una respuesta para informar a Pumay que tomaste
                      conocimiento, gestionaste la observación o necesitas
                      entregar antecedentes adicionales.
                    </p>

                    <TextAreaInput
                      label="Comentario para Pumay"
                      value={localResponseComment}
                      onChange={setLocalResponseComment}
                      placeholder="Ej: Tomamos conocimiento del caso. Ya corregimos la observación y adjuntamos respaldo."
                      required
                    />

                    <PhotoInput
                      files={localResponsePhotos}
                      setFiles={setLocalResponsePhotos}
                      requiredText="(opcional como evidencia)"
                    />

                    <button
                      type="button"
                      disabled={
                        isProcessing || localResponseComment.trim().length < 5
                      }
                      onClick={async () => {
                        await onLocalResponse(
                          incident.id,
                          localResponseComment,
                          localResponsePhotos,
                        );
                        setLocalResponseComment("");
                        setLocalResponsePhotos([]);
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isProcessing ? "Enviando..." : "Enviar respuesta a Pumay"}
                    </button>
                  </div>
                )}
              </div>
            )}

          {isAdmin &&
            canAssign &&
            incident.report_direction !== "pumay_to_local" && (
              <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <label className="mb-2 block text-sm font-bold text-sky-900">
                  Asignación de tarea
                </label>

                <select
                  value={incident.assigned_to || ""}
                  onChange={(e) =>
                    onAssignedChange(incident.id, e.target.value)
                  }
                  disabled={normalizedStatus === "cerrado"}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Sin asignar</option>
                  {RESPONSIBLE_OPTIONS.map((responsible) => (
                    <option key={responsible.name} value={responsible.name}>
                      {responsible.name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-sky-800">
                  Solo owner o súper administrador pueden modificar esta
                  asignación.
                </p>
              </div>
            )}

          {displayPhotos.length > 0 && (
            <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <p className="text-sm font-bold text-sky-900">
                Adjuntos del caso
              </p>
              <p className="mt-1 text-xs text-sky-800">
                Incluye fotos y video de creación, respuesta o cierre según
                corresponda.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {displayPhotos.map((photo, index) => {
                  const label =
                    photo.type === "closure"
                      ? "Cierre"
                      : photo.type === "response"
                        ? "Respuesta"
                        : "Creación";
                  const isVideo = photo.mediaType === "video";

                  return (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm transition hover:border-sky-400"
                    >
                      {isVideo ? (
                        <video
                          src={photo.url}
                          controls
                          preload="metadata"
                          className="h-40 w-full bg-slate-950 object-contain"
                        />
                      ) : (
                        <img
                          src={photo.url}
                          alt={`Foto ${index + 1} del caso`}
                          className="h-40 w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      )}
                      <div className="p-3 text-xs font-semibold text-sky-800">
                        {isVideo ? "Video" : "Foto"} {index + 1} · {label}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {incident.resolution_comment && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <p className="text-sm font-bold">
                {incident.report_direction === "pumay_to_local" &&
                (incident.local_responded_at || incident.local_response_comment)
                  ? "Validación de cierre Pumay"
                  : "Comentario de cierre"}
              </p>
              {incident.report_direction === "pumay_to_local" &&
                (incident.local_responded_at ||
                  incident.local_response_comment) && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Caso cerrado luego de revisar la respuesta enviada por el
                    local.
                  </p>
                )}
              <p className="mt-2 whitespace-pre-wrap">
                {incident.resolution_comment}
              </p>

              {incident.closed_at && (
                <p className="mt-3 text-xs text-emerald-700">
                  Cerrado el {formatDate(incident.closed_at)}
                </p>
              )}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-2xl bg-slate-900 p-2 text-white">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Historial del caso
                </h3>
                <p className="text-sm text-slate-500">
                  Trazabilidad de acciones realizadas sobre este incidente.
                </p>
              </div>
            </div>

            {logsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Cargando historial...
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Este caso todavía no tiene historial registrado.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {prettyAction(log.action)}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {log.description || "Sin descripción."}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Por: {log.performed_by || "No informado"}
                          {log.performed_by_email
                            ? ` · ${log.performed_by_email}`
                            : ""}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 md:text-right">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:flex-wrap">
              {incident.report_direction !== "pumay_to_local" &&
                normalizedStatus !== "en revisión" &&
                normalizedStatus !== "cerrado" && (
                  <button
                    onClick={() => onStatusChange(incident.id, "en proceso")}
                    disabled={isProcessing}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessing ? "Procesando..." : "Tomar caso"}
                  </button>
                )}

              {normalizedStatus !== "cerrado" && (
                <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <PhotoInput
                    files={closurePhotos}
                    setFiles={setClosurePhotos}
                    requiredText="(opcional para cierre)"
                  />
                </div>
              )}

              {normalizedStatus !== "cerrado" && (
                <button
                  onClick={async () => {
                    await onStatusChange(
                      incident.id,
                      "cerrado",
                      undefined,
                      closurePhotos,
                    );
                    setClosurePhotos([]);
                  }}
                  disabled={isProcessing}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing
                    ? "Cerrando y subiendo..."
                    : "Cerrar con comentario"}
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => onDeleteIncident(incident)}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar caso
                </button>
              )}

              <button
                onClick={onClose}
                disabled={isProcessing}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Volver al panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
