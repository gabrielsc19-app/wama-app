"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, FileText, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  organization_id: number;
};

type Incident = {
  id: number;
  created_at: string;
  title: string | null;
  description: string | null;
  type: string | null;
  priority: string | null;
  status: string | null;
  location_name: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  assigned_to: string | null;
  report_direction: string | null;
  photo_url: string | null;
};

const SERVICE_NAME = "Seguridad";
const REPORTER_EMAIL = "pumay@zintex.cl";
const ACCENT = "rose";

const MONTHS = [
  { value: "0", label: "Enero" },
  { value: "1", label: "Febrero" },
  { value: "2", label: "Marzo" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Mayo" },
  { value: "5", label: "Junio" },
  { value: "6", label: "Julio" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Septiembre" },
  { value: "9", label: "Octubre" },
  { value: "10", label: "Noviembre" },
  { value: "11", label: "Diciembre" },
];

function getMonthRange(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getReportDateRange(period: string, selectedYear: number, selectedMonth: string) {
  const now = new Date();

  if (period === "all") return null;

  if (period === "current_month") {
    return getMonthRange(now.getFullYear(), now.getMonth());
  }

  if (period === "previous_month") {
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return getMonthRange(previousMonth.getFullYear(), previousMonth.getMonth());
  }

  if (period === "selected_month") {
    return getMonthRange(selectedYear, Number(selectedMonth));
  }

  const days = Number(period);
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return { start, end: now };
}

function periodLabel(period: string, selectedYear: number, selectedMonth: string) {
  if (period === "7") return "últimos 7 días";
  if (period === "30") return "últimos 30 días";
  if (period === "current_month") return "mes actual";
  if (period === "previous_month") return "mes anterior";
  if (period === "selected_month") {
    const monthLabel = MONTHS.find((item) => item.value === selectedMonth)?.label || "Mes";
    return `${monthLabel} ${selectedYear}`;
  }
  if (period === "all") return "todo el histórico";
  return "periodo seleccionado";
}

function normalize(value?: string | null) {
  return String(value || "").toLowerCase().trim();
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function extractReportType(title?: string | null) {
  const value = String(title || "");
  const prefix = `${SERVICE_NAME} - `;
  if (!value.startsWith(prefix)) return "Novedad";
  const rest = value.slice(prefix.length);
  return rest.split(":")[0]?.trim() || "Novedad";
}

function cleanTitle(title?: string | null) {
  const value = String(title || "Sin título");
  const prefix = `${SERVICE_NAME} - `;
  if (!value.startsWith(prefix)) return value;
  const rest = value.slice(prefix.length);
  const parts = rest.split(":");
  return parts.slice(1).join(":").trim() || rest;
}

export default function ServiceReportDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<Incident[]>([]);
  const [period, setPeriod] = useState("30");
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setRefreshing(true);
    setErrorMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const userEmail = sessionData.session?.user?.email;

    if (!userEmail) {
      setErrorMessage("Debes iniciar sesión para ver este informe.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users_pumay")
      .select("id,name,email,role,active,organization_id")
      .eq("email", userEmail)
      .eq("active", true)
      .maybeSingle();

    if (profileError || !userProfile) {
      setErrorMessage("No se encontró un perfil activo para este usuario.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const normalizedRole = normalize(userProfile.role);
    const canAccessReport = ["owner", "super_admin"].includes(normalizedRole);

    if (!canAccessReport) {
      setErrorMessage("Este informe está disponible solo para usuarios owner y super administradores.");
      setProfile(userProfile as UserProfile);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setProfile(userProfile as UserProfile);

    const { data: incidentData, error: incidentError } = await supabase
      .from("incidents")
      .select("id,created_at,title,description,type,priority,status,location_name,reporter_name,reporter_email,assigned_to,report_direction,photo_url")
      .eq("organization_id", userProfile.organization_id)
      .order("created_at", { ascending: false });

    if (incidentError) {
      setErrorMessage("No se pudieron cargar los reportes del servicio.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const filtered = (incidentData || []).filter((item: Incident) => {
      const direction = normalize(item.report_direction);
      const type = normalize(item.type);
      const email = normalize(item.reporter_email);
      const title = normalize(item.title);
      const isInternalReport = direction === "pumay_internal" || direction === "internal_to_pumay";
      const matchesService =
        type === normalize(SERVICE_NAME) ||
        email === normalize(REPORTER_EMAIL) ||
        title.includes(normalize(SERVICE_NAME));

      return isInternalReport && matchesService;
    });

    setReports(filtered as Incident[]);
    setLoading(false);
    setRefreshing(false);
  }

  const filteredReports = useMemo(() => {
    const range = getReportDateRange(period, selectedYear, selectedMonth);

    const byPeriod = reports.filter((report) => {
      if (!range) return true;

      const created = new Date(report.created_at);
      return created.getTime() >= range.start.getTime() && created.getTime() <= range.end.getTime();
    });

    if (typeFilter === "Todos") return byPeriod;
    return byPeriod.filter((report) => extractReportType(report.title) === typeFilter);
  }, [reports, period, selectedYear, selectedMonth, typeFilter]);

  const reportTypes = useMemo(() => {
    const unique = new Set(reports.map((report) => extractReportType(report.title)));
    return ["Todos", ...Array.from(unique).sort()];
  }, [reports]);

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);

    reports.forEach((report) => {
      const year = new Date(report.created_at).getFullYear();
      if (!Number.isNaN(year)) years.add(year);
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  const selectedPeriodLabel = periodLabel(period, selectedYear, selectedMonth);

  const total = filteredReports.length;
  const withPhoto = filteredReports.filter((report) => !!report.photo_url).length;
  const lastReport = filteredReports[0];
  const typeCount = filteredReports.reduce<Record<string, number>>((acc, report) => {
    const type = extractReportType(report.title);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sin datos";

  const accentClasses = {
    header: "to-rose-900",
    pill: "border-rose-200 bg-rose-50 text-rose-800",
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-700" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Cargando informe...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 print:bg-white">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className={`rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 ${accentClasses.header} p-6 text-white shadow-sm sm:p-8 print:bg-white print:text-slate-950`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950 print:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al panel
              </button>
              <p className="text-sm text-slate-200 print:text-slate-600">FixLoop | Pumay</p>
              <h1 className="mt-1 text-3xl font-bold">Informe de {SERVICE_NAME}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-200 print:text-slate-700">
                Control separado de reportes diarios, novedades, hallazgos, fotos y trazabilidad del servicio.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 print:hidden">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-4 py-2 text-sm font-bold text-white"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Actualizar datos
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950"
              >
                <FileText className="h-4 w-4" />
                Exportar / imprimir PDF
              </button>
            </div>
          </div>
        </section>

        {errorMessage && (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {errorMessage}
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 print:hidden">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Periodo</label>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="current_month">Mes actual</option>
                <option value="previous_month">Mes anterior</option>
                <option value="selected_month">Seleccionar mes</option>
                <option value="all">Todo el histórico</option>
              </select>
            </div>

            {period === "selected_month" && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Mes</label>
                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none"
                  >
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Año</label>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className={period === "selected_month" ? "md:col-span-1" : "md:col-span-3"}>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Tipo de reporte</label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none"
              >
                {reportTypes.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <KpiCard title="Total reportes" value={String(total)} />
          <KpiCard title="Con foto adjunta" value={String(withPhoto)} />
          <KpiCard title="Tipo más frecuente" value={topType} />
          <KpiCard title="Último reporte" value={lastReport ? formatDate(lastReport.created_at) : "Sin datos"} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-bold text-slate-950">Resumen ejecutivo</h2>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Durante el periodo <strong>{selectedPeriodLabel}</strong> se registraron <strong>{total}</strong> reportes de {SERVICE_NAME}. {" "}
            El tipo más frecuente corresponde a <strong>{topType}</strong>. {" "}
            {withPhoto > 0 ? <>Existen <strong>{withPhoto}</strong> reportes con respaldo fotográfico.</> : <>No hay reportes con fotografía en el periodo filtrado.</>}
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Detalle de novedades</h2>
              <p className="mt-1 text-sm text-slate-600">
                Reportes separados del dashboard principal de casos y tareas internas.
              </p>
            </div>
            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${accentClasses.pill}`}>
              {SERVICE_NAME} → Pumay
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Título</th>
                  <th className="px-3 py-3">Sector</th>
                  <th className="px-3 py-3">Reporta</th>
                  <th className="px-3 py-3">Foto</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      Sin reportes para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-4 text-slate-700">{formatDate(report.created_at)}</td>
                      <td className="px-3 py-4 font-semibold text-slate-900">{extractReportType(report.title)}</td>
                      <td className="px-3 py-4">
                        <p className="font-bold text-slate-950">{cleanTitle(report.title)}</p>
                        <p className="mt-1 max-w-xl text-slate-600">{report.description || "Sin descripción"}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-700">{report.location_name || "Sin sector"}</td>
                      <td className="px-3 py-4 text-slate-700">{report.reporter_name || "Sin informante"}</td>
                      <td className="px-3 py-4">
                        {report.photo_url ? (
                          <a
                            href={report.photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 print:hidden"
                          >
                            <Camera className="h-4 w-4" />
                            Ver foto
                          </a>
                        ) : (
                          <span className="text-slate-400">Sin foto</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
