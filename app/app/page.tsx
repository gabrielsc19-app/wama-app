import Link from "next/link";
import WamaLogo from "../components/WamaLogo";

const modules = [
  {
    label: "Operación",
    title: "Operación WAMA",
    subtitle: "Gestión diaria de alertas, casos y tareas",
    description:
      "Administra alertas, solicitudes, responsables, evidencias, estados y seguimiento operacional.",
    href: "/operacion",
    accent: "#00E5D6",
  },
  {
    label: "Finanzas",
    title: "Cuentas por pagar",
    subtitle: "Conciliación y control financiero",
    description:
      "Carga documentos, cruza pagos, controla pendientes y genera reportes de gestión financiera.",
    href: "/finanzas",
    accent: "#F2A900",
  },
  {
    label: "Sales Hub",
    title: "Sales Hub",
    subtitle: "CRM comercial y pipeline de negocios",
    description:
      "Gestiona target accounts, contactos, deals, propuestas, actividades y cierre de oportunidades.",
    href: "/sales-hub",
    accent: "#FF684F",
  },
];

export default function AppPortalPage() {
  return (
    <main className="module-portal">
      <section className="module-hero">
        <div>
          <div className="module-hero-logo">
            <WamaLogo type="horizontal" variant="dark" size="md" />
          </div>

          <p className="eyebrow">Portal de módulos</p>

          <h1>Selecciona tu módulo de trabajo</h1>

          <p className="hero-copy">
            WAMA opera como software modular: cada empresa activa los módulos que necesita y mantiene
            separada la información operativa, comercial y financiera.
          </p>
        </div>

        <aside className="session-card">
          <span>Sesión activa</span>
          <strong>Empresa demo</strong>
          <p>Rol: owner</p>
          <Link href="/" className="btn-dark">
            Volver al sitio
          </Link>
        </aside>
      </section>

      <section className="module-stage">
        {modules.map((module, index) => (
          <article key={module.title} className={`module-card module-card-${index + 1}`}>
            <div className="module-card-top">
              <div className="module-icon" style={{ background: module.accent }}>
                {index + 1}
              </div>

              <span className="module-pill">{module.label}</span>
            </div>

            <div className="module-line" style={{ background: module.accent }} />

            <h2>{module.title}</h2>
            <h3>{module.subtitle}</h3>
            <p>{module.description}</p>

            <Link href={module.href} className="btn-dark">
              Abrir módulo →
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}