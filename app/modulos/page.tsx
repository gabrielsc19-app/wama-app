import Link from "next/link";
import WamaLogo from "../components/WamaLogo";

const modules = [
  {
    area: "Operaciones",
    price: "USD 10 / cada 10 usuarios",
    title: "Operación",
    problem: "Alertas, tareas y requerimientos se pierden entre WhatsApp, llamadas y correos.",
    result: "Un centro operativo con responsables, estados, evidencia, timeline y reportes.",
    items: ["Generar casos", "Asignar responsables", "Tomar y cerrar", "Evidencia", "SLA y reportes"],
    href: "/modulos/operacion",
    cta: "Ver cómo funciona",
    secondary: "Solicitar demo",
  },
  {
    area: "Comercial",
    price: "USD 10 / cada 10 usuarios",
    title: "Sales Hub",
    problem: "Los prospectos, oportunidades y seguimientos comerciales quedan dispersos.",
    result: "Pipeline por etapas, cuentas objetivo, contactos, deals, actividades y dashboard UF.",
    items: ["Target accounts", "Contactos", "Deals", "Pipeline", "Dashboard comercial"],
    href: "/modulos/sales-hub",
    cta: "Ver cómo funciona",
    secondary: "Activar modelo",
  },
  {
    area: "Contabilidad",
    price: "USD 10 / cada 10 usuarios",
    title: "Finanzas / Cuentas por pagar",
    problem: "Facturas, pagos y cartolas se revisan manualmente, con alto riesgo de pendientes.",
    result: "Control de documentos, conciliación, pendientes, pagos y panel financiero.",
    items: ["Carga documentos", "Cartola", "Conciliación", "Pendientes", "Dashboard financiero"],
    href: "/modulos/finanzas",
    cta: "Ver cómo funciona",
    secondary: "Solicitar demo",
  },
];

export default function ModulosPage() {
  return (
    <main className="wama-marketing-page">
      <section className="marketing-hero">
        <div className="marketing-container">
          <WamaLogo type="horizontal" variant="dark" size="sm" />

          <p className="eyebrow">Catálogo modular</p>
          <h1>Elige los módulos que resuelven el problema real de tu empresa.</h1>
          <p className="marketing-copy">
            WAMA guía la venta mostrando qué hace cada módulo, qué datos necesita y qué panel genera.
            Después de activar un módulo, el cliente carga su negocio por formulario o plantilla.
          </p>

          <div className="hero-actions">
            <Link href="/onboarding/sales-hub" className="btn-primary">
              Crear modelo Sales Hub
            </Link>
            <Link href="/app" className="btn-outline-dark">
              Ver portal de trabajo
            </Link>
          </div>
        </div>
      </section>

      <section className="modules-section">
        <div className="modules-grid">
          {modules.map((module) => (
            <article className="module-sales-card" key={module.title}>
              <div className="module-card-header">
                <span>{module.area}</span>
                <strong>{module.price}</strong>
              </div>

              <h2>{module.title}</h2>

              <div className="module-info-box">
                <h3>Problema que resuelve</h3>
                <p>{module.problem}</p>
              </div>

              <div className="module-info-box cyan">
                <h3>Resultado esperado</h3>
                <p>{module.result}</p>
              </div>

              <ul className="module-bullets">
                {module.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="module-card-actions">
                <Link href={module.href} className="btn-dark">
                  {module.cta}
                </Link>
                <Link href="/onboarding/sales-hub" className="btn-light">
                  {module.secondary}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
