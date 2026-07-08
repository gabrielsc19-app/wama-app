import Link from "next/link";
import WamaLogo from "../components/WamaLogo";

const metrics = [
  ["Alertas abiertas", "18", "3 críticas"],
  ["Tareas del día", "42", "12 pendientes"],
  ["SLA operativo", "91%", "+7% vs semana"],
  ["Costo mensual", "USD 40", "4 módulos activos"],
];

const work = [
  ["Aseo", "Baño nivel -1 requiere revisión", "En proceso"],
  ["Mantención", "Falla luminaria pasillo central", "Nuevo"],
  ["Comercial", "Cliente candidato pasó a propuesta", "Propuesta"],
  ["Contabilidad", "22 documentos pendientes de conciliación", "Revisión"],
];

export default function WamaAppDemo() {
  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <WamaLogo variant="light" size="sm" />
        <nav className="app-nav">
          <Link href="/app" className="active">Dashboard <span>●</span></Link>
          <a>Alertas</a>
          <a>Tareas</a>
          <a>Comunicaciones</a>
          <a>Clientes / sedes</a>
          <a>Reportes</a>
          <a>Módulos</a>
          <Link href="/">Volver al sitio</Link>
        </nav>
      </aside>

      <section className="app-main">
        <div className="app-hero">
          <div>
            <span className="eyebrow">Dashboard WAMA</span>
            <h1>Centro operativo</h1>
            <p>Vista demo para operación, tareas, comunicaciones, seguimiento comercial, contabilidad y reportes.</p>
          </div>
          <div className="app-toolbar">
            <input className="search-input" placeholder="Buscar alerta, tarea o sede..." />
            <button className="btn btn--primary">Nuevo registro →</button>
          </div>
        </div>

        <div className="metrics-grid">
          {metrics.map(([label, value, sub]) => (
            <div key={label} className="metric-card">
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{sub}</small>
            </div>
          ))}
        </div>

        <div className="app-grid">
          <section className="app-card">
            <h2>Actividad operativa</h2>
            <div className="work-list">
              {work.map(([area, title, status]) => (
                <article key={title} className="work-item">
                  <div><strong>{area}</strong><p>{title}</p></div>
                  <span className="status-pill">{status}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="app-card">
            <h2>Timeline</h2>
            <div className="timeline">
              <div className="timeline-item"><strong>Alerta tomada</strong><span>Equipo Aseo · hace 12 min</span></div>
              <div className="timeline-item"><strong>Tarea creada</strong><span>Supervisor Operaciones · hace 28 min</span></div>
              <div className="timeline-item"><strong>Conciliación actualizada</strong><span>Contabilidad · hace 1 h</span></div>
              <div className="timeline-item"><strong>Propuesta enviada</strong><span>Comercial · ayer</span></div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
