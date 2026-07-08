import Link from "next/link";
import WamaLogo from "./components/WamaLogo";
import ModuleConfigurator from "./components/ModuleConfigurator";

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <WamaLogo variant="light" size="sm" />
          <nav className="site-nav">
            <a href="#modules">Módulos</a>
            <a href="#how">Cómo funciona</a>
            <Link href="/app">Demo</Link>
            <Link href="/asistente">Asistente</Link>
            <Link href="/demo-builder" className="btn btn--primary">Crear mi modelo</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <WamaLogo variant="light" size="lg" />
            <span className="eyebrow" style={{ marginTop: 38 }}>
              Plataforma de servicios digitales por módulos
            </span>
            <h1>Gestiona tu empresa módulo por módulo.</h1>
            <p>
              Activa alertas, tareas, comunicaciones, reportes, seguimiento comercial y conciliación según lo que cada área necesita. <strong>USD 10 cada 10 usuarios</strong> por módulo al mes.
            </p>
            <div className="hero-actions">
              <a href="#modules" className="btn btn--primary">Explorar módulos →</a>
              <Link href="/demo-builder" className="btn btn--outline">Crear mi modelo WAMA</Link>
              <Link href="/asistente" className="btn btn--outline">Hablar con asistente</Link>
            </div>
            <div className="hero-kpis">
              <div><strong>3</strong><span>Áreas iniciales</span></div>
              <div><strong>6</strong><span>Módulos demo</span></div>
              <div><strong>USD 1</strong><span>Por usuario</span></div>
            </div>
          </div>

          <div className="product-preview" aria-label="Vista demo WAMA">
            <div className="product-preview__top">
              <span>Centro operativo WAMA</span>
              <span className="live-dot">Demo activa</span>
            </div>
            <div className="product-preview__body">
              <div className="preview-metrics">
                <div className="preview-card"><span>Alertas abiertas</span><strong>18</strong><small>3 críticas</small></div>
                <div className="preview-card"><span>Tareas hoy</span><strong>42</strong><small>12 pendientes</small></div>
                <div className="preview-card"><span>SLA operativo</span><strong>91%</strong><small>+7% semanal</small></div>
                <div className="preview-card"><span>Módulos activos</span><strong>4</strong><small>USD 40 / mes</small></div>
              </div>
              <div className="preview-list">
                <div className="preview-row"><i className="preview-row__dot" /><div><strong>Aseo</strong><br />Baño nivel -1 requiere revisión.</div><span>En proceso</span></div>
                <div className="preview-row"><i className="preview-row__dot" /><div><strong>Comercial</strong><br />Cliente candidato avanzó a propuesta.</div><span>Nuevo</span></div>
                <div className="preview-row"><i className="preview-row__dot" /><div><strong>Contabilidad</strong><br />22 documentos pendientes de conciliación.</div><span>Revisar</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="section section--light">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Cómo funciona</span>
            <h2>De una necesidad operativa a un modelo digital activo.</h2>
            <p>WAMA permite partir simple, activar módulos y crecer sin pagar por funciones que no se usan.</p>
          </div>
          <div className="steps-grid">
            <article className="step-card"><span>01</span><h3>Selecciona</h3><p>Elige los módulos que resuelven los problemas actuales de tu operación.</p></article>
            <article className="step-card"><span>02</span><h3>Ajusta usuarios</h3><p>Define usuarios por módulo en bloques de 10 personas.</p></article>
            <article className="step-card"><span>03</span><h3>Activa</h3><p>Tu equipo comienza a reportar, asignar, ejecutar y cerrar con evidencia.</p></article>
            <article className="step-card"><span>04</span><h3>Mide</h3><p>Gerencia ve alertas, tareas, SLA, costos y avance en dashboards.</p></article>
          </div>
        </div>
      </section>

      <ModuleConfigurator />

      <section className="cta-band">
        <div className="container">
          <h2>¿No sabes qué módulos necesitas?</h2>
          <p>Usa el Asistente WAMA o crea un modelo recomendado para tu empresa con rubro, usuarios, sedes y problemas a resolver.</p>
          <div className="cta-band__actions">
            <Link href="/asistente" className="btn btn--primary">Abrir asistente</Link>
            <Link href="/demo-builder" className="btn btn--outline">Crear modelo personalizado</Link>
            <Link href="/app" className="btn btn--outline">Ver app demo</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer__inner">
          <WamaLogo variant="light" size="sm" />
          <span>© 2026 WAMA. Servicios digitales por módulos.</span>
        </div>
      </footer>
    </main>
  );
}
