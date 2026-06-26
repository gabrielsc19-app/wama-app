"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  RefreshCcw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/app/lib/supabase";

type Incident = {
  id: number;
  created_at: string;
  title: string | null;
  type: string | null;
  status: string | null;
  description: string | null;
  location_id?: number | null;
  local_code?: string | null;
  location_name: string | null;
  report_direction?: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone?: string | null;
  priority: string | null;
  assigned_to: string | null;
  assigned_to_email?: string | null;
  assigned_at?: string | null;
  taken_at?: string | null;
  resolution_comment?: string | null;
  closed_at: string | null;
  organization_id: number;
  photo_url?: string | null;
  created_by_email?: string | null;
  is_test?: boolean | null;
  archived?: boolean | null;
  applies_to_metrics?: boolean | null;
  source_module?: string | null;
  service_type?: string | null;
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  organization_id: number;
  active: boolean;
};

type ChartItem = {
  name: string;
  value: number;
};

const APP_NAME = "FixLoop | Pumay";

const FLOW_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "local_to_pumay", label: "Local → Pumay" },
  { value: "pumay_to_local", label: "Pumay → Local" },
  { value: "pumay_internal", label: "Pumay → Equipo interno" },
  { value: "internal_to_pumay", label: "Interno → Pumay" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "nuevo", label: "Nuevo" },
  { value: "en proceso", label: "En proceso" },
  { value: "cerrado", label: "Cerrado" },
];

const MONTH_OPTIONS = [
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

const RESPONSIBLE_GROUPS = [
  {
    label: "Equipo Operaciones",
    emails: ["jpino@pumay.cl", "aleon@pumay.cl", "pwerth@pumay.cl"],
    aliases: [
      "equipo operaciones",
      "operaciones",
      "jose pino",
      "alvaro leon",
      "percy werth",
    ],
  },
  {
    label: "Equipo Mantención",
    emails: ["aserrano@pumay.cl"],
    aliases: ["equipo mantencion", "mantencion", "aldo serrano"],
  },
  {
    label: "Equipo Seguridad",
    emails: ["pumay@zintex.cl"],
    aliases: ["equipo seguridad", "seguridad", "jorge pino"],
  },
  {
    label: "Equipo Aseo",
    emails: ["lizama-yasna@aramark.cl"],
    aliases: ["equipo aseo", "aseo", "yasna lizama"],
  },
  {
    label: "Equipo Comercial",
    emails: ["pwerth@pumay.cl"],
    aliases: ["equipo comercial", "comercial", "percy werth"],
  },
  {
    label: "Todos responsables Pumay",
    emails: [],
    aliases: ["todos responsables pumay", "todos"],
  },
];

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeStatus(status?: string | null) {
  const value = normalizeText(status);

  if (["cerrado", "cerrada", "resuelto", "resuelta", "finalizado", "finalizada"].includes(value)) {
    return "cerrado";
  }

  if (["en revision", "en proceso", "tomado", "tomada", "asignado", "asignada"].includes(value)) {
    return "en proceso";
  }

  return "nuevo";
}

function normalizePriority(priority?: string | null) {
  const value = normalizeText(priority);

  if (["critica", "alta", "urgente"].includes(value)) return "crítica";
  if (value === "baja") return "baja";
  return "media";
}

function prettyStatus(status?: string | null) {
  const value = normalizeStatus(status);
  if (value === "cerrado") return "Cerrado";
  if (value === "en proceso") return "En proceso";
  return "Nuevo";
}

function prettyPriority(priority?: string | null) {
  const value = normalizePriority(priority);
  if (value === "crítica") return "Crítica";
  if (value === "baja") return "Baja";
  return "Media";
}

function prettyDirection(direction?: string | null) {
  const value = normalizeText(direction);

  if (value === "local_to_pumay") return "Local → Pumay";
  if (value === "pumay_to_local") return "Pumay → Local";
  if (value === "pumay_internal") return "Pumay → Equipo interno";
  if (value === "internal_to_pumay") return "Interno → Pumay";

  return "Sin flujo";
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function shortDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "numeric",
  }).format(date);
}

function getAgeInDays(value?: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;

  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function isInternalTask(incident: Incident) {
  return normalizeText(incident.report_direction) === "pumay_internal";
}

function isLocalIncident(incident: Incident) {
  if (isInternalTask(incident)) return false;
  if (!incident.location_id) return false;

  const locationName = normalizeText(incident.location_name);
  return Boolean(locationName) && locationName !== "tarea interna pumay" && locationName !== "sin local";
}

function localLabel(incident: Incident) {
  if (isInternalTask(incident)) return "Tarea interna Pumay";
  return incident.location_name || "Sin local";
}

function getResponsibleGroup(incident: Incident) {
  const assignedTo = normalizeText(incident.assigned_to);
  const assignedEmail = normalizeText(incident.assigned_to_email);

  for (const group of RESPONSIBLE_GROUPS) {
    if (group.emails.some((email) => normalizeText(email) === assignedEmail)) {
      return group.label;
    }

    if (group.aliases.some((alias) => assignedTo.includes(normalizeText(alias)))) {
      return group.label;
    }
  }

  return "Sin asignar";
}

function groupByCount<T>(items: T[], getKey: (item: T) => string, limit = 8): ChartItem[] {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item) || "Sin dato";
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function averageResolutionHours(incidents: Incident[]) {
  const closed = incidents.filter((incident) => incident.closed_at && incident.created_at);
  if (closed.length === 0) return 0;

  const totalHours = closed.reduce((acc, incident) => {
    const start = new Date(incident.created_at).getTime();
    const end = new Date(incident.closed_at || "").getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return acc;
    return acc + (end - start) / (1000 * 60 * 60);
  }, 0);

  return totalHours / closed.length;
}

function getPeriodRange(period: string, selectedMonth: number, selectedYear: number) {
  const now = new Date();
  const start = new Date(now);
  let end: Date | null = null;

  if (period === "7") {
    start.setDate(now.getDate() - 7);
  } else if (period === "30") {
    start.setDate(now.getDate() - 30);
  } else if (period === "current_month") {
    start.setFullYear(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "previous_month") {
    start.setFullYear(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "custom_month") {
    start.setFullYear(selectedYear, selectedMonth, 1);
    end = new Date(selectedYear, selectedMonth + 1, 1);
  } else {
    return { start: null, end: null };
  }

  start.setHours(0, 0, 0, 0);
  if (end) end.setHours(0, 0, 0, 0);

  return { start, end };
}

function getPeriodLabel(period: string, selectedMonth: number, selectedYear: number) {
  const now = new Date();

  if (period === "7") return "Últimos 7 días";
  if (period === "30") return "Últimos 30 días";
  if (period === "current_month") {
    return `${MONTH_OPTIONS[now.getMonth()].label} ${now.getFullYear()}`;
  }
  if (period === "previous_month") {
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${MONTH_OPTIONS[previous.getMonth()].label} ${previous.getFullYear()}`;
  }
  if (period === "custom_month") {
    return `${MONTH_OPTIONS[selectedMonth].label} ${selectedYear}`;
  }
  return "Todo el histórico";
}

function isWithinPeriod(incident: Incident, period: string, selectedMonth: number, selectedYear: number) {
  const { start, end } = getPeriodRange(period, selectedMonth, selectedYear);

  if (!start) return true;

  const created = new Date(incident.created_at);
  if (Number.isNaN(created.getTime())) return false;

  if (end) return created >= start && created < end;
  return created >= start;
}

function isJunkOrTestIncident(incident: Incident) {
  const title = normalizeText(incident.title);
  const description = normalizeText(incident.description);
  const type = normalizeText(incident.type);
  const sourceModule = normalizeText(incident.source_module);
  const reporterEmail = normalizeText(incident.reporter_email);
  const reporterName = normalizeText(incident.reporter_name);
  const serviceType = normalizeText(incident.service_type);

  if (incident.is_test === true) return true;
  if (incident.archived === true) return true;
  if (incident.applies_to_metrics === false) return true;

  if (["1", "test", "prueba", "pruebas", "sin titulo", "sin título"].includes(title)) {
    return true;
  }

  if (
    title.includes("prueba") ||
    title.includes("test") ||
    description.includes("prueba") ||
    description.includes("test")
  ) {
    return true;
  }

  if (
    title.includes("checklist") ||
    description.includes("checklist") ||
    type.includes("checklist") ||
    sourceModule.includes("checklist")
  ) {
    return true;
  }

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

  if (isServiceReport) return true;

  return false;
}

function isExecutiveOperationalCase(incident: Incident) {
  return !isJunkOrTestIncident(incident);
}

function buildEvolutionData(incidents: Incident[]) {
  const map = new Map<string, { label: string; sort: number; value: number }>();

  for (const incident of incidents) {
    const date = new Date(incident.created_at);
    if (Number.isNaN(date.getTime())) continue;

    const key = date.toISOString().slice(0, 10);
    const label = shortDate(incident.created_at);
    const current = map.get(key) || { label, sort: date.getTime(), value: 0 };
    current.value += 1;
    map.set(key, current);
  }

  return Array.from(map.values())
    .sort((a, b) => a.sort - b.sort)
    .map(({ label, value }) => ({ name: label, value }));
}

export default function ManagerReportPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState("all");
  const [localFilter, setLocalFilter] = useState("all");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  async function loadData() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const authEmail = authData.user?.email || null;

    let organizationId = 1;

    if (authEmail) {
      const { data: profile } = await supabase
        .from("users_pumay")
        .select("id, name, email, role, organization_id, active")
        .eq("email", authEmail)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile as UserProfile);
        organizationId = Number(profile.organization_id || 1);
      }
    }

    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (!error) {
      setIncidents((data || []) as Incident[]);
    }

    setLastUpdatedAt(new Date());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const periodLabel = useMemo(
    () => getPeriodLabel(period, selectedMonth, selectedYear),
    [period, selectedMonth, selectedYear]
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, index) => currentYear - 4 + index);
  }, []);

  const cleanIncidents = useMemo(() => {
    return incidents.filter(isExecutiveOperationalCase);
  }, [incidents]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    cleanIncidents.forEach((incident) => {
      if (incident.type) set.add(incident.type);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [cleanIncidents]);

  const localOptions = useMemo(() => {
    const set = new Set<string>();
    cleanIncidents.forEach((incident) => {
      if (isLocalIncident(incident) && incident.location_name) set.add(incident.location_name);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [cleanIncidents]);

  const filteredIncidents = useMemo(() => {
    return cleanIncidents.filter((incident) => {
      if (!isWithinPeriod(incident, period, selectedMonth, selectedYear)) return false;
      if (categoryFilter !== "all" && incident.type !== categoryFilter) return false;
      if (statusFilter !== "all" && normalizeStatus(incident.status) !== statusFilter) return false;
      if (flowFilter !== "all" && normalizeText(incident.report_direction) !== flowFilter) return false;
      if (localFilter !== "all" && incident.location_name !== localFilter) return false;
      return true;
    });
  }, [cleanIncidents, period, selectedMonth, selectedYear, categoryFilter, statusFilter, flowFilter, localFilter]);

  const metrics = useMemo(() => {
    const total = filteredIncidents.length;
    const urgent = filteredIncidents.filter((incident) => normalizePriority(incident.priority) === "crítica").length;
    const closed = filteredIncidents.filter((incident) => normalizeStatus(incident.status) === "cerrado").length;
    const pending = filteredIncidents.filter((incident) => normalizeStatus(incident.status) !== "cerrado").length;
    const avgHours = averageResolutionHours(filteredIncidents);
    const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, urgent, closed, pending, avgHours, closureRate };
  }, [filteredIncidents]);

  const localIncidents = useMemo(() => filteredIncidents.filter(isLocalIncident), [filteredIncidents]);
  const internalTasks = useMemo(() => filteredIncidents.filter(isInternalTask), [filteredIncidents]);

  const byLocal = useMemo(
    () => groupByCount(localIncidents, (incident) => incident.location_name || "Sin local", 8),
    [localIncidents]
  );

  const byCategory = useMemo(
    () => groupByCount(filteredIncidents, (incident) => incident.type || "Sin categoría", 8),
    [filteredIncidents]
  );

  const byStatus = useMemo(
    () => groupByCount(filteredIncidents, (incident) => prettyStatus(incident.status), 5),
    [filteredIncidents]
  );

  const byFlow = useMemo(
    () => groupByCount(filteredIncidents, (incident) => prettyDirection(incident.report_direction), 5),
    [filteredIncidents]
  );

  const byResponsible = useMemo(
    () => groupByCount(filteredIncidents, getResponsibleGroup, 8),
    [filteredIncidents]
  );

  const internalByTeam = useMemo(
    () => groupByCount(internalTasks, getResponsibleGroup, 8),
    [internalTasks]
  );

  const evolution = useMemo(() => buildEvolutionData(filteredIncidents), [filteredIncidents]);

  const mostReportedLocal = byLocal[0]?.name || "Sin datos";
  const mostCommonCategory = byCategory[0]?.name || "Sin datos";

  const criticalOpenCases = useMemo(() => {
    return filteredIncidents
      .filter((incident) => normalizePriority(incident.priority) === "crítica" && normalizeStatus(incident.status) !== "cerrado")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 10);
  }, [filteredIncidents]);

  const pendingInternalTasks = useMemo(() => {
    return internalTasks
      .filter((incident) => normalizeStatus(incident.status) !== "cerrado")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 10);
  }, [internalTasks]);

  function handlePrint() {
    window.print();
  }

  const currentRole = normalizeText(userProfile?.role);
  const canAccessReport = currentRole === "owner";

  if (!loading && !canAccessReport) {
    return (
      <main className="min-h-screen bg-[#F3F7FA] px-4 py-6 text-[#0F172A] sm:px-8">
        <div className="mx-auto max-w-[1100px] space-y-6">
          <section className="rounded-3xl border border-[#DDE7F0] bg-white p-6 shadow-sm sm:p-8">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-bold text-[#0F172A] transition hover:bg-[#F8FAFC]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al panel
            </button>

            <h1 className="mt-8 text-3xl font-bold tracking-tight text-[#0F172A]">
              Informe Gerencial de Casos
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[#475569]">
              Este informe está disponible solo para usuarios owner.
            </p>

            {userProfile && (
              <p className="mt-2 text-sm text-[#64748B]">
                Sesión: <span className="font-semibold text-[#334155]">{userProfile.name}</span> · Rol: {userProfile.role}
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-700">
              Tu perfil no está autorizado para revisar este informe ejecutivo.
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F7FA] px-4 py-6 text-[#0F172A] sm:px-8 print:bg-white print:px-0">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          main {
            background: white !important;
          }
          section, .print-card {
            break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="print-card rounded-3xl border border-[#DDE7F0] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-[#64748B]">{APP_NAME}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
                Informe Gerencial de Casos
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#475569]">
                Resumen ejecutivo de casos operacionales, reportes de locales, tareas internas y desempeño de equipos responsables.
              </p>
              {userProfile && (
                <p className="mt-2 text-sm text-[#64748B]">
                  Sesión: <span className="font-semibold text-[#334155]">{userProfile.name}</span> · Rol: {userProfile.role}
                </p>
              )}
              {lastUpdatedAt && (
                <p className="mt-1 text-xs text-[#64748B]">
                  Última actualización: {lastUpdatedAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>

            <div className="no-print flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-bold text-[#0F172A] transition hover:bg-[#F8FAFC]"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al panel
              </button>
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-bold text-[#0F172A] transition hover:bg-[#F8FAFC]"
              >
                <RefreshCcw className="h-4 w-4" />
                Actualizar datos
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0B1B33] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#13294B]"
              >
                <Download className="h-4 w-4" />
                Exportar / Imprimir PDF
              </button>
            </div>
          </div>
        </section>

        <section className="no-print rounded-3xl border border-[#DDE7F0] bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SelectField label="Periodo" value={period} onChange={setPeriod}>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="current_month">Mes actual</option>
              <option value="previous_month">Mes anterior</option>
              <option value="custom_month">Seleccionar mes</option>
              <option value="all">Todo el histórico</option>
            </SelectField>

            {period === "custom_month" && (
              <>
                <SelectField
                  label="Mes"
                  value={String(selectedMonth)}
                  onChange={(value) => setSelectedMonth(Number(value))}
                >
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  label="Año"
                  value={String(selectedYear)}
                  onChange={(value) => setSelectedYear(Number(value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </SelectField>
              </>
            )}

            <SelectField label="Categoría" value={categoryFilter} onChange={setCategoryFilter}>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "Todas" : category}
                </option>
              ))}
            </SelectField>

            <SelectField label="Estado" value={statusFilter} onChange={setStatusFilter}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </SelectField>

            <SelectField label="Flujo" value={flowFilter} onChange={setFlowFilter}>
              {FLOW_OPTIONS.map((flow) => (
                <option key={flow.value} value={flow.value}>
                  {flow.label}
                </option>
              ))}
            </SelectField>

            <SelectField label="Local" value={localFilter} onChange={setLocalFilter}>
              {localOptions.map((local) => (
                <option key={local} value={local}>
                  {local === "all" ? "Todos" : local}
                </option>
              ))}
            </SelectField>
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-[#DDE7F0] bg-white p-8 text-center text-[#475569] shadow-sm">
            Cargando informe gerencial...
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <KpiCard title="Total de casos" value={metrics.total} icon={<BarChart3 className="h-5 w-5" />} />
              <KpiCard title="Críticos / urgentes" value={metrics.urgent} icon={<ShieldAlert className="h-5 w-5" />} tone="red" />
              <KpiCard title="Pendientes" value={metrics.pending} icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
              <KpiCard title="Cerrados" value={metrics.closed} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
              <KpiCard title="Promedio resolución" value={`${metrics.avgHours.toFixed(1)} hrs`} icon={<Clock className="h-5 w-5" />} />
              <KpiCard title="Tasa de cierre" value={`${metrics.closureRate}%`} icon={<TrendingUp className="h-5 w-5" />} tone="indigo" />
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <ExecutiveSummary
                  periodLabel={periodLabel}
                  total={metrics.total}
                  urgent={metrics.urgent}
                  pending={metrics.pending}
                  closed={metrics.closed}
                  closureRate={metrics.closureRate}
                  mostReportedLocal={mostReportedLocal}
                  mostCommonCategory={mostCommonCategory}
                  internalTaskCount={internalTasks.length}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <SmallInsight label="Periodo seleccionado" value={periodLabel} />
                <SmallInsight label="Local con más reportes" value={mostReportedLocal} />
                <SmallInsight label="Mayor categoría del periodo" value={mostCommonCategory} />
                <SmallInsight label="Tareas internas Pumay" value={String(internalTasks.length)} />
                <SmallInsight label="Registros excluidos" value={String(incidents.length - cleanIncidents.length)} />
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Evolución de casos" subtitle={`Casos creados en el periodo ${periodLabel}.`}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={evolution} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#005C89" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Casos por flujo" subtitle="Separación entre locales, tareas internas y flujos administrativos.">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byFlow} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0B4566" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Casos por local" subtitle="Solo locales reales. Las tareas internas Pumay no se mezclan en este gráfico.">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={byLocal} layout="vertical" margin={{ top: 20, right: 20, left: 40, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0B4566" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Carga por equipo responsable" subtitle="Agrupación por equipos Pumay, no por nombres de locatarios.">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={byResponsible} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0B4566" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Casos por categoría" subtitle="Principales tipos de reportes del periodo.">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={110} label>
                      {byCategory.map((entry, index) => (
                        <Cell key={entry.name} fill={["#0B4566", "#38BDF8", "#10B981", "#F59E0B", "#E11D48", "#6366F1", "#94A3B8", "#005C89"][index % 8]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Estados de casos" subtitle="Distribución del backlog operativo.">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={byStatus} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0B4566" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Tareas internas Pumay" subtitle="Carga interna asignada por el super administrador a equipos Pumay.">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={internalByTeam} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <section className="print-card rounded-3xl border border-[#DDE7F0] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#0F172A]">Lectura ejecutiva</h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-[#334155]">
                  <p>
                    El periodo <strong>{periodLabel}</strong> registra <strong>{metrics.total}</strong> casos válidos, con <strong>{metrics.pending}</strong> pendientes y una tasa de cierre de <strong>{metrics.closureRate}%</strong>.
                  </p>
                  <p>
                    El foco operativo se concentra en <strong>{mostCommonCategory}</strong>, mientras que el local con mayor volumen de reportes es <strong>{mostReportedLocal}</strong>.
                  </p>
                  <p>
                    Las tareas internas Pumay se reportan por separado para no distorsionar la lectura de desempeño por local.
                  </p>
                </div>
              </section>
            </section>

            <CasesTable title="Casos críticos abiertos" subtitle="Casos urgentes que siguen abiertos, pendientes o en proceso." incidents={criticalOpenCases} />
            <CasesTable title="Tareas internas pendientes" subtitle="Tareas Pumay asignadas a equipos internos que siguen abiertas." incidents={pendingInternalTasks} />
          </>
        )}
      </div>
    </main>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#005C89] focus:ring-4 focus:ring-[#E6F4FA]"
      >
        {children}
      </select>
    </label>
  );
}

function KpiCard({
  title,
  value,
  icon,
  tone = "slate",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "slate" | "red" | "amber" | "emerald" | "indigo";
}) {
  const toneClasses = {
    slate: "border-[#CBD5E1] bg-white text-[#0F172A]",
    red: "border-[#FDA4AF] bg-[#FFF1F2] text-[#BE123C]",
    amber: "border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]",
    emerald: "border-[#86EFAC] bg-[#ECFDF5] text-[#047857]",
    indigo: "border-[#A5B4FC] bg-[#EEF2FF] text-[#4338CA]",
  };

  return (
    <section className={`print-card rounded-3xl border p-5 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">{title}</p>
          <p className="mt-5 text-4xl font-black tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 shadow-sm">{icon}</div>
      </div>
    </section>
  );
}

function SmallInsight({ label, value }: { label: string; value: string }) {
  return (
    <section className="print-card rounded-3xl border border-[#DDE7F0] bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-3 text-2xl font-black text-[#0F172A]">{value}</p>
    </section>
  );
}

function ExecutiveSummary({
  periodLabel,
  total,
  urgent,
  pending,
  closed,
  closureRate,
  mostReportedLocal,
  mostCommonCategory,
  internalTaskCount,
}: {
  periodLabel: string;
  total: number;
  urgent: number;
  pending: number;
  closed: number;
  closureRate: number;
  mostReportedLocal: string;
  mostCommonCategory: string;
  internalTaskCount: number;
}) {
  return (
    <section className="print-card h-full rounded-3xl border border-[#DDE7F0] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#0F172A]">Resumen ejecutivo</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[#334155]">
        <p>
          Durante el periodo <strong>{periodLabel}</strong> se registraron <strong>{total}</strong> casos válidos, de los cuales <strong>{urgent}</strong> fueron clasificados como críticos o urgentes.
        </p>
        <p>
          Actualmente existen <strong>{pending}</strong> casos pendientes o en proceso y <strong>{closed}</strong> casos cerrados, con una tasa de cierre de <strong>{closureRate}%</strong>.
        </p>
        <p>
          El local con mayor número de reportes es <strong>{mostReportedLocal}</strong>, mientras que la categoría más frecuente corresponde a <strong>{mostCommonCategory}</strong>.
        </p>
        <p>
          Se identifican <strong>{internalTaskCount}</strong> tareas internas Pumay, separadas del análisis por local para mantener una lectura gerencial limpia.
        </p>
      </div>
    </section>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="print-card rounded-3xl border border-[#DDE7F0] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-[#475569]">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CasesTable({ title, subtitle, incidents }: { title: string; subtitle: string; incidents: Incident[] }) {
  return (
    <section className="print-card rounded-3xl border border-[#DDE7F0] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-1 h-5 w-5 text-[#64748B]" />
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
          <p className="mt-1 text-sm text-[#475569]">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-[#64748B]">
              <th className="py-3 pr-4">Fecha</th>
              <th className="py-3 pr-4">Título</th>
              <th className="py-3 pr-4">Local / Flujo</th>
              <th className="py-3 pr-4">Tipo</th>
              <th className="py-3 pr-4">Estado</th>
              <th className="py-3 pr-4">Prioridad</th>
              <th className="py-3 pr-4">Equipo</th>
              <th className="py-3 pr-4">Días abierto</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-[#64748B]">
                  Sin registros para mostrar.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4 text-[#475569]">{formatDate(incident.created_at)}</td>
                  <td className="py-3 pr-4 font-semibold text-[#0F172A]">{incident.title || "Sin título"}</td>
                  <td className="py-3 pr-4 text-[#475569]">
                    <div>{localLabel(incident)}</div>
                    <div className="text-xs text-[#64748B]">{prettyDirection(incident.report_direction)}</div>
                  </td>
                  <td className="py-3 pr-4 text-[#475569]">{incident.type || "Sin tipo"}</td>
                  <td className="py-3 pr-4 text-[#475569]">{prettyStatus(incident.status)}</td>
                  <td className="py-3 pr-4 text-[#475569]">{prettyPriority(incident.priority)}</td>
                  <td className="py-3 pr-4 text-[#475569]">{getResponsibleGroup(incident)}</td>
                  <td className="py-3 pr-4 text-[#475569]">{getAgeInDays(incident.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
