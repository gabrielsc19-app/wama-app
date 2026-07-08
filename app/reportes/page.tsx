import WamaAppShell from "../components/WamaAppShell";

const metrics = [
  { label: "Casos abiertos", value: "18", note: "3 críticos" },
  { label: "Tareas del día", value: "42", note: "12 pendientes" },
  { label: "SLA operativo", value: "91%", note: "+7% vs semana" },
  { label: "Costo mensual", value: "USD 30", note: "3 módulos activos" },
];

const rows = [
  ["Mantención", "9", "6", "2h 14m"],
  ["Seguridad", "5", "4", "1h 42m"],
  ["Aseo", "12", "10", "48m"],
  ["Comercial", "7", "3", "1 día"],
];

export default function ReportesPage() {
  return (
    <WamaAppShell title="Reportes ejecutivos" subtitle="Indicadores de operación, cumplimiento y módulos activos para toma de decisiones.">
      <section className="metric-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.note}</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Resumen por área</h2>
        <div className="table-like">
          <div className="table-head"><span>Área</span><span>Abiertos</span><span>Cerrados</span><span>Promedio</span></div>
          {rows.map((row) => (
            <div key={row[0]} className="table-row"><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span></div>
          ))}
        </div>
      </section>

      <section className="panel dark-panel">
        <p className="eyebrow">Conclusión ejecutiva</p>
        <h2>La operación mantiene buen nivel de respuesta.</h2>
        <p>La mayor carga se concentra en Aseo y Mantención. Se recomienda activar reportes automáticos para jefaturas y mantener seguimiento de SLA por ubicación.</p>
      </section>
    </WamaAppShell>
  );
}
