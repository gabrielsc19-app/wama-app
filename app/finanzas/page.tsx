import Link from "next/link";

export default function FinanzasPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 40, background: "#f5f6f7", color: "#071323" }}>
      <section style={{ maxWidth: 980, margin: "0 auto", background: "white", borderRadius: 28, padding: 34, boxShadow: "0 18px 44px rgba(15,23,42,.08)" }}>
        <p style={{ color: "#00a89f", textTransform: "uppercase", letterSpacing: ".35em", fontWeight: 900 }}>Módulo financiero</p>
        <h1 style={{ fontSize: 52, margin: "10px 0" }}>Cuentas por pagar</h1>
        <p style={{ fontSize: 18, color: "#475569" }}>Módulo reservado para conciliación, documentos, cartola bancaria y control de pagos. Lo conectaremos después de Sales Hub.</p>
        <Link href="/app" style={{ display: "inline-flex", marginTop: 24, background: "#071323", color: "white", borderRadius: 16, padding: "14px 18px", textDecoration: "none", fontWeight: 900 }}>← Volver a módulos</Link>
      </section>
    </main>
  );
}
