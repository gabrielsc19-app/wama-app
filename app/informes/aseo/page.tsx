"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  XCircle,
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

type Template = {
  id: number;
  title: string;
  frequency: "diario" | "semanal" | "quincenal" | "mensual";
  sector: string | null;
};

type ResponseRow = {
  id: number;
  organization_id: number;
  template_id: number;
  service_date: string;
  month: number;
  year: number;
  status: "si" | "no" | "pendiente";
  observation: string | null;
  photo_url: string | null;
  completed_by_name: string | null;
  completed_by_email: string | null;
  period_type: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  auto_closed: boolean | null;
  auto_closed_reason: string | null;
};

const frequencyLabels: Record<string, string> = {
  diario: "Diario",
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function statusLabel(status: string) {
  if (status === "si") return "Sí";
  if (status === "no") return "No";
  return "Pendiente";
}

function statusClass(status: string) {
  if (status === "si") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "no") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

export default function AseoInformeDashboard() {
  const current = new Date();

  const [month, setMonth] = useState(current.getMonth() + 1);
  const [year, setYear] = useState(current.getFullYear());
  const [templates, setTemplates] = useState<Template[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/cleaning-checklist?organizationId=1&month=${month}&year=${year}`
      );
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || "No se pudo cargar el informe de aseo.");
        setLoading(false);
        return;
      }

      setTemplates(result.templates || []);
      setResponses(result.responses || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo cargar el informe de aseo.");
    } finally {
      setLoading(false);
    }
  }

  const templateById = useMemo(() => {
    const map = new Map<number, Template>();
    templates.forEach((template) => map.set(template.id, template));
    return map;
  }, [templates]);

  const globalMetrics = useMemo(() => {
    const total = responses.length;
    const si = responses.filter((item) => item.status === "si").length;
    const no = responses.filter((item) => item.status === "no").length;
    const pendiente = responses.filter((item) => item.status === "pendiente").length;
    const fotos = responses.filter((item) => item.photo_url).length;
    const observaciones = responses.filter((item) => safeText(item.observation)).length;
    const autoClosed = responses.filter((item) => item.auto_closed).length;
    const noDeclarado = responses.filter((item) => item.status === "no" && !item.auto_closed).length;
    const cumplimiento = percentage(si, total);

    return {
      total,
      si,
      no,
      pendiente,
      fotos,
      observaciones,
      autoClosed,
      noDeclarado,
      cumplimiento,
    };
  }, [responses]);

  const statusPieData = useMemo(
    () => [
      { name: "Sí", value: globalMetrics.si },
      { name: "No declarado", value: globalMetrics.noDeclarado },
      { name: "No respondida", value: globalMetrics.autoClosed },
      { name: "Pendiente", value: globalMetrics.pendiente },
    ],
    [globalMetrics]
  );

  const byFrequency = useMemo(() => {
    const base: Record<string, { frequency: string; total: number; si: number; no: number; pendiente: number; autoClosed: number; cumplimiento: number }> = {
      diario: { frequency: "Diario", total: 0, si: 0, no: 0, pendiente: 0, autoClosed: 0, cumplimiento: 0 },
      semanal: { frequency: "Semanal", total: 0, si: 0, no: 0, pendiente: 0, autoClosed: 0, cumplimiento: 0 },
      quincenal: { frequency: "Quincenal", total: 0, si: 0, no: 0, pendiente: 0, autoClosed: 0, cumplimiento: 0 },
      mensual: { frequency: "Mensual", total: 0, si: 0, no: 0, pendiente: 0, autoClosed: 0, cumplimiento: 0 },
    };

    responses.forEach((response) => {
      const template = templateById.get(response.template_id);
      const frequency = template?.frequency || response.period_type || "diario";

      if (!base[frequency]) {
        base[frequency] = {
          frequency: frequencyLabels[frequency] || frequency,
          total: 0,
          si: 0,
          no: 0,
          pendiente: 0,
          autoClosed: 0,
          cumplimiento: 0,
        };
      }

      base[frequency].total += 1;
      if (response.status === "si") base[frequency].si += 1;
      if (response.status === "no") base[frequency].no += 1;
      if (response.status === "pendiente") base[frequency].pendiente += 1;
      if (response.auto_closed) base[frequency].autoClosed += 1;
    });

    Object.keys(base).forEach((frequency) => {
      base[frequency].cumplimiento = percentage(base[frequency].si, base[frequency].total);
    });

    return Object.values(base);
  }, [responses, templateById]);

  const dailyMetrics = useMemo(() => {
    const grouped = new Map<string, { date: string; total: number; si: number; no: number; pendiente: number; autoClosed: number; cumplimiento: number }>();

    responses.forEach((response) => {
      const date = response.service_date;

      if (!grouped.has(date)) {
        grouped.set(date, {
          date,
          total: 0,
          si: 0,
          no: 0,
          pendiente: 0,
          autoClosed: 0,
          cumplimiento: 0,
        });
      }

      const row = grouped.get(date)!;
      row.total += 1;
      if (response.status === "si") row.si += 1;
      if (response.status === "no") row.no += 1;
      if (response.status === "pendiente") row.pendiente += 1;
      if (response.auto_closed) row.autoClosed += 1;
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({
        ...row,
        cumplimiento: percentage(row.si, row.total),
      }));
  }, [responses]);

  const riskTasks = useMemo(() => {
    const map = new Map<number, { templateId: number; title: string; frequency: string; total: number; si: number; no: number; pendiente: number; autoClosed: number; cumplimiento: number }>();

    responses.forEach((response) => {
      const template = templateById.get(response.template_id);
      const templateId = response.template_id;

      if (!map.has(templateId)) {
        map.set(templateId, {
          templateId,
          title: template?.title || `Tarea ${templateId}`,
          frequency: frequencyLabels[template?.frequency || response.period_type || ""] || "-",
          total: 0,
          si: 0,
          no: 0,
          pendiente: 0,
          autoClosed: 0,
          cumplimiento: 0,
        });
      }

      const item = map.get(templateId)!;
      item.total += 1;
      if (response.status === "si") item.si += 1;
      if (response.status === "no") item.no += 1;
      if (response.status === "pendiente") item.pendiente += 1;
      if (response.auto_closed) item.autoClosed += 1;
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        cumplimiento: percentage(item.si, item.total),
      }))
      .filter((item) => item.no > 0 || item.pendiente > 0 || item.autoClosed > 0)
      .sort((a, b) => {
        const riskA = a.no + a.pendiente + a.autoClosed;
        const riskB = b.no + b.pendiente + b.autoClosed;
        if (riskB !== riskA) return riskB - riskA;
        return a.cumplimiento - b.cumplimiento;
      })
      .slice(0, 10);
  }, [responses, templateById]);

  const recentObservations = useMemo(() => {
    return responses
      .filter((response) => safeText(response.observation) || response.photo_url || response.auto_closed)
      .sort((a, b) => b.service_date.localeCompare(a.service_date))
      .slice(0, 12);
  }, [responses]);

  function exportCsv() {
    const rows = [
      [
        "Fecha",
        "Frecuencia",
        "Periodo inicio",
        "Periodo termino",
        "Vence",
        "Tarea",
        "Estado",
        "Cierre automatico",
        "Motivo cierre automatico",
        "Observacion",
        "Foto",
        "Reportado por",
        "Correo",
      ],
      ...responses.map((response) => {
        const template = templateById.get(response.template_id);

        return [
          response.service_date,
          frequencyLabels[template?.frequency || response.period_type || ""] || "",
          response.period_start || "",
          response.period_end || "",
          response.due_date || "",
          template?.title || `Tarea ${response.template_id}`,
          statusLabel(response.status),
          response.auto_closed ? "Sí" : "No",
          response.auto_closed_reason || "",
          response.observation || "",
          response.photo_url || "",
          response.completed_by_name || "",
          response.completed_by_email || "",
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `informe-contractual-aseo-${year}-${String(month).padStart(2, "0")}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-sm md:p-8">
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
            Dashboard contractual de Aseo
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-white md:text-base">
            Control mensual para verificar cumplimiento del contrato de aseo, con cierre automático de tareas no respondidas.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
            <div>
              <label className="text-sm font-bold text-slate-700">Mes</label>
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                {monthNames.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Año</label>
              <input
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                type="number"
              />
            </div>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            <p className="mt-3 text-sm text-slate-600">Cargando dashboard...</p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-6">
              <MetricCard title="Cumplimiento contractual" value={`${globalMetrics.cumplimiento}%`} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
              <MetricCard title="Tareas exigibles" value={globalMetrics.total} icon={<FileText className="h-5 w-5" />} tone="slate" />
              <MetricCard title="Cumplidas" value={globalMetrics.si} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
              <MetricCard title="No cumplidas" value={globalMetrics.no} icon={<XCircle className="h-5 w-5" />} tone="rose" />
              <MetricCard title="No respondidas" value={globalMetrics.autoClosed} icon={<TriangleAlert className="h-5 w-5" />} tone="amber" />
              <MetricCard title="Fotos" value={globalMetrics.fotos} icon={<Camera className="h-5 w-5" />} tone="sky" />
            </section>

            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-2xl font-black text-emerald-950">Resumen contractual del mes</h2>
              <p className="mt-2 text-sm text-emerald-900">
                El contrato de aseo presenta un cumplimiento operacional de{" "}
                <strong>{globalMetrics.cumplimiento}%</strong> para el período seleccionado.
                Se registran <strong>{globalMetrics.noDeclarado}</strong> tareas marcadas como No por el equipo,
                <strong> {globalMetrics.autoClosed}</strong> tareas no respondidas dentro del plazo y{" "}
                <strong>{globalMetrics.pendiente}</strong> tareas pendientes vigentes.
              </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <ChartCard title="Cumplimiento por frecuencia" subtitle="Porcentaje de tareas cumplidas sobre tareas exigibles.">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="frequency" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="cumplimiento" name="Cumplimiento %" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Distribución contractual" subtitle="Cumplidas, no cumplidas, no respondidas y pendientes.">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {statusPieData.map((entry) => (
                        <Cell key={entry.name} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-emerald-700" />
                <div>
                  <h2 className="text-2xl font-black">Tendencia diaria de cumplimiento</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Evolución del cumplimiento contractual por fecha registrada.
                  </p>
                </div>
              </div>

              <div className="mt-5 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip labelFormatter={(value) => formatDate(String(value))} />
                    <Line type="monotone" dataKey="cumplimiento" name="Cumplimiento %" strokeWidth={3} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <TriangleAlert className="h-6 w-6 text-amber-600" />
                  <div>
                    <h2 className="text-2xl font-black">Tareas críticas del mes</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Ranking por No, Pendiente o cierre automático.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {riskTasks.map((task) => (
                    <div key={task.templateId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-black text-slate-950">{task.title}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                            {task.frequency}
                          </p>
                        </div>

                        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                          Riesgo: {task.no + task.pendiente + task.autoClosed}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs font-bold">
                        <MiniStat label="Sí" value={task.si} />
                        <MiniStat label="No" value={task.no} />
                        <MiniStat label="Auto" value={task.autoClosed} />
                        <MiniStat label="Pend." value={task.pendiente} />
                        <MiniStat label="%" value={`${task.cumplimiento}%`} />
                      </div>
                    </div>
                  ))}

                  {riskTasks.length === 0 && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                      No hay tareas críticas registradas en este período.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-emerald-700" />
                  <div>
                    <h2 className="text-2xl font-black">Observaciones, fotos y cierres</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Últimos registros con evidencia, comentario o incumplimiento automático.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {recentObservations.map((response) => {
                    const template = templateById.get(response.template_id);

                    return (
                      <div key={response.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              {formatDate(response.service_date)} · {frequencyLabels[template?.frequency || response.period_type || ""] || "-"}
                            </p>
                            <p className="mt-1 font-black text-slate-950">
                              {template?.title || `Tarea ${response.template_id}`}
                            </p>
                          </div>

                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(response.status)}`}>
                            {response.auto_closed ? "No respondida" : statusLabel(response.status)}
                          </span>
                        </div>

                        {(response.observation || response.auto_closed_reason) && (
                          <p className="mt-3 text-sm text-slate-700">
                            {response.observation || response.auto_closed_reason}
                          </p>
                        )}

                        {response.photo_url && (
                          <a
                            href={response.photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"
                          >
                            <Camera className="h-4 w-4" />
                            Ver foto
                          </a>
                        )}
                      </div>
                    );
                  })}

                  {recentObservations.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                      No hay observaciones, fotos ni cierres automáticos en este período.
                    </div>
                  )}
                </div>
              </section>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">Detalle contractual mensual</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Tabla completa con período, vencimiento, estado y cierre automático.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                  {responses.length} registros
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Fecha</th>
                      <th className="px-3 py-3">Frecuencia</th>
                      <th className="px-3 py-3">Período</th>
                      <th className="px-3 py-3">Vence</th>
                      <th className="px-3 py-3">Tarea</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3">Observación</th>
                      <th className="px-3 py-3">Foto</th>
                      <th className="px-3 py-3">Reportado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => {
                      const template = templateById.get(response.template_id);

                      return (
                        <tr key={response.id} className="border-b border-slate-100 align-top">
                          <td className="px-3 py-3 font-semibold">{formatDate(response.service_date)}</td>
                          <td className="px-3 py-3">
                            {frequencyLabels[template?.frequency || response.period_type || ""] || "-"}
                          </td>
                          <td className="px-3 py-3">
                            {response.period_start && response.period_end
                              ? `${formatDate(response.period_start)} - ${formatDate(response.period_end)}`
                              : "-"}
                          </td>
                          <td className="px-3 py-3">
                            {response.due_date ? formatDate(response.due_date) : "-"}
                          </td>
                          <td className="px-3 py-3 font-semibold">
                            {template?.title || `Tarea ${response.template_id}`}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(response.status)}`}>
                              {response.auto_closed ? "No respondida" : statusLabel(response.status)}
                            </span>
                          </td>
                          <td className="max-w-[320px] px-3 py-3 text-slate-600">
                            {response.observation || response.auto_closed_reason || "Sin observación"}
                          </td>
                          <td className="px-3 py-3">
                            {response.photo_url ? (
                              <a
                                href={response.photo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"
                              >
                                <Camera className="h-4 w-4" />
                                Ver foto
                              </a>
                            ) : (
                              <span className="text-slate-400">Sin foto</span>
                            )}
                          </td>
                          <td className="px-3 py-3">{response.completed_by_name || "-"}</td>
                        </tr>
                      );
                    })}

                    {responses.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                          No hay respuestas de checklist para este período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone: "emerald" | "slate" | "rose" | "amber" | "sky";
}) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-slate-200 bg-white text-slate-900",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide opacity-70">{title}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
