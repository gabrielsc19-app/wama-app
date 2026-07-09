import Link from "next/link";
import WamaLogo from "../../components/WamaLogo";

const cards = [
  {
    title: "Qué problema resuelve",
    text:
      "Evita que prospectos, contactos, próximos pasos y propuestas queden dispersos en WhatsApp, Excel o memoria del equipo.",
  },
  {
    title: "Qué datos necesita",
    text:
      "Empresas, contactos, deals, monto UF, etapa, probabilidad, responsable y próxima actividad.",
  },
  {
    title: "Qué panel genera",
    text:
      "Pipeline por etapa, pipeline total UF, pipeline ponderado, actividades pendientes y dashboard ejecutivo.",
  },
  {
    title: "Cómo parte el cliente",
    text:
      "Completa un formulario simple o descarga la plantilla Excel WAMA para ordenar cuentas, contactos y deals.",
  },
];

const steps = [
  "Crear target accounts",
  "Registrar contactos comerciales",
  "Cargar oportunidades y monto UF",
  "Mover etapas del pipeline",
  "Medir avance comercial",
  "Generar dashboard ejecutivo",
];

export default function SalesHubModulePage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.logoBlock}>
            <WamaLogo type="horizontal" variant="dark" size="md" />
          </div>

          <p style={styles.kicker}>MÓDULO COMERCIAL</p>

          <h1 style={styles.title}>
            Sales Hub para ordenar oportunidades y convertir seguimiento en ventas.
          </h1>

          <p style={styles.copy}>
            Diseñado para empresas que necesitan controlar pipeline, empresas objetivo,
            contactos, propuestas, actividades y valor comercial estimado sin perder
            trazabilidad.
          </p>

          <div style={styles.actions}>
            <Link href="/onboarding/sales-hub" style={styles.primaryBtn}>
              Crear mi modelo comercial
            </Link>

            <Link href="/sales-hub" style={styles.secondaryBtn}>
              Abrir Sales Hub
            </Link>

            <Link href="/modulos" style={styles.ghostBtn}>
              ← Volver a módulos
            </Link>
          </div>
        </div>

        <aside style={styles.previewCard}>
          <div style={styles.previewTop}>
            <span>Vista esperada</span>
            <strong>Sales Hub activo</strong>
          </div>

          <div style={styles.previewMetrics}>
            <div style={styles.previewMetric}>
              <small>Pipeline total</small>
              <strong>1.240 UF</strong>
            </div>
            <div style={styles.previewMetric}>
              <small>Deals abiertos</small>
              <strong>18</strong>
            </div>
            <div style={styles.previewMetric}>
              <small>Win rate</small>
              <strong>34%</strong>
            </div>
            <div style={styles.previewMetric}>
              <small>Actividades</small>
              <strong>7</strong>
            </div>
          </div>

          <div style={styles.previewRows}>
            <div style={styles.previewRow}>
              <span />
              <div>
                <strong>Target account</strong>
                <p>Empresa en evaluación comercial.</p>
              </div>
            </div>
            <div style={styles.previewRow}>
              <span />
              <div>
                <strong>Proposal sent</strong>
                <p>Propuesta enviada con monto UF.</p>
              </div>
            </div>
            <div style={styles.previewRow}>
              <span />
              <div>
                <strong>Closing</strong>
                <p>Oportunidad lista para cierre.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section style={styles.content}>
        <div style={styles.cardsGrid}>
          {cards.map((card) => (
            <article key={card.title} style={styles.infoCard}>
              <h2 style={styles.cardTitle}>{card.title}</h2>
              <p style={styles.cardText}>{card.text}</p>
            </article>
          ))}
        </div>

        <section style={styles.workflow}>
          <div>
            <p style={styles.lightKicker}>CÓMO SE VENDE</p>
            <h2 style={styles.sectionTitle}>
              Primero se entiende la necesidad, después se activa el módulo.
            </h2>
            <p style={styles.sectionText}>
              La venta no parte mostrando una pantalla vacía. Parte mostrando qué problema
              resuelve Sales Hub, qué datos debe cargar el cliente y qué panel obtiene para
              gestionar su equipo comercial.
            </p>
          </div>

          <div style={styles.stepsGrid}>
            {steps.map((step, index) => (
              <div key={step} style={styles.stepCard}>
                <span style={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.cta}>
          <div>
            <p style={styles.lightKicker}>ACTIVACIÓN</p>
            <h2 style={styles.ctaTitle}>El cliente puede partir con formulario o archivo.</h2>
            <p style={styles.sectionText}>
              Para pocos datos, se usa el formulario. Para carga masiva, se descarga una
              plantilla compatible con Excel/CSV y luego WAMA genera cuentas, contactos y deals.
            </p>
          </div>

          <div style={styles.ctaActions}>
            <Link href="/onboarding/sales-hub" style={styles.primaryBtn}>
              Crear modelo Sales Hub
            </Link>
            <Link href="/sales-hub" style={styles.darkBtn}>
              Ver módulo funcionando
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F2F5F8",
    color: "#0B0C0E",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    minHeight: 560,
    background:
      "radial-gradient(circle at 10% 20%, rgba(0,229,214,0.18), transparent 28%), linear-gradient(135deg, #07111F 0%, #0B0C0E 48%, #053F43 100%)",
    color: "#F5F6F7",
    padding: "96px clamp(28px, 7vw, 128px)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(360px, 0.75fr)",
    gap: 72,
    alignItems: "center",
  },
  heroInner: {
    maxWidth: 980,
  },
  logoBlock: {
    marginBottom: 64,
  },
  kicker: {
    margin: "0 0 28px",
    color: "#00E5D6",
    fontSize: 14,
    letterSpacing: "0.45em",
    fontWeight: 900,
  },
  title: {
    margin: 0,
    maxWidth: 980,
    color: "#F5F6F7",
    fontSize: "clamp(54px, 6.5vw, 104px)",
    lineHeight: 0.92,
    letterSpacing: "-0.07em",
    fontWeight: 900,
  },
  copy: {
    margin: "32px 0 0",
    maxWidth: 780,
    color: "rgba(245,246,247,0.72)",
    fontSize: 18,
    lineHeight: 1.7,
    fontWeight: 600,
  },
  actions: {
    marginTop: 42,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "center",
  },
  primaryBtn: {
    background: "#00E5D6",
    color: "#0B0C0E",
    borderRadius: 999,
    padding: "17px 26px",
    fontWeight: 900,
    textDecoration: "none",
    boxShadow: "0 24px 60px rgba(0,229,214,0.28)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    background: "rgba(245,246,247,0.08)",
    color: "#F5F6F7",
    border: "1px solid rgba(245,246,247,0.25)",
    borderRadius: 999,
    padding: "16px 25px",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtn: {
    color: "rgba(245,246,247,0.72)",
    textDecoration: "none",
    fontWeight: 800,
  },
  previewCard: {
    background: "rgba(245,246,247,0.08)",
    border: "1px solid rgba(245,246,247,0.16)",
    borderRadius: 36,
    padding: 28,
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  previewTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    paddingBottom: 18,
    borderBottom: "1px solid rgba(245,246,247,0.12)",
    color: "#C4C7CC",
    fontWeight: 800,
  },
  previewMetrics: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginTop: 22,
  },
  previewMetric: {
    background: "rgba(11,12,14,0.55)",
    border: "1px solid rgba(245,246,247,0.12)",
    borderRadius: 22,
    padding: 20,
  },
  previewRows: {
    marginTop: 22,
    display: "grid",
    gap: 12,
  },
  previewRow: {
    background: "rgba(245,246,247,0.10)",
    borderRadius: 18,
    padding: 16,
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  content: {
    padding: "56px clamp(24px, 6vw, 96px) 80px",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 22,
    marginTop: -110,
    position: "relative",
    zIndex: 2,
  },
  infoCard: {
    background: "#FFFFFF",
    border: "1px solid #D9E3EE",
    borderRadius: 28,
    padding: 30,
    minHeight: 190,
    boxShadow: "0 24px 60px rgba(15,23,42,0.10)",
  },
  cardTitle: {
    margin: 0,
    fontSize: 26,
    letterSpacing: "-0.04em",
    color: "#0B0C0E",
  },
  cardText: {
    margin: "18px 0 0",
    color: "#475569",
    lineHeight: 1.65,
    fontWeight: 600,
  },
  workflow: {
    marginTop: 48,
    background: "#FFFFFF",
    border: "1px solid #D9E3EE",
    borderRadius: 34,
    padding: 34,
    display: "grid",
    gridTemplateColumns: "0.9fr 1.1fr",
    gap: 34,
    boxShadow: "0 20px 55px rgba(15,23,42,0.08)",
  },
  lightKicker: {
    margin: "0 0 14px",
    color: "#00AFA7",
    letterSpacing: "0.35em",
    fontSize: 12,
    fontWeight: 900,
  },
  sectionTitle: {
    margin: 0,
    fontSize: "clamp(32px, 4vw, 56px)",
    lineHeight: 1,
    letterSpacing: "-0.06em",
  },
  sectionText: {
    margin: "18px 0 0",
    color: "#64748B",
    lineHeight: 1.7,
    fontWeight: 600,
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  stepCard: {
    background: "#F5F6F7",
    border: "1px solid #D9E3EE",
    borderRadius: 20,
    padding: 20,
    display: "grid",
    gap: 12,
  },
  stepNumber: {
    color: "#00AFA7",
    fontSize: 12,
    letterSpacing: "0.22em",
    fontWeight: 900,
  },
  cta: {
    marginTop: 28,
    background: "#0B0C0E",
    color: "#F5F6F7",
    borderRadius: 34,
    padding: 38,
    display: "flex",
    justifyContent: "space-between",
    gap: 28,
    alignItems: "center",
  },
  ctaTitle: {
    margin: 0,
    fontSize: "clamp(32px, 4vw, 54px)",
    lineHeight: 1,
    letterSpacing: "-0.06em",
  },
  ctaActions: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    flexShrink: 0,
  },
  darkBtn: {
    background: "#F5F6F7",
    color: "#0B0C0E",
    borderRadius: 999,
    padding: "17px 26px",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
