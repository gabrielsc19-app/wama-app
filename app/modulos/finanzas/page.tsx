import Link from "next/link";
import WamaLogo from "../../components/WamaLogo";

export default function FinanzasModuleDetailPage() {
  return (
    <main className="module-detail-page">
      <section className="detail-hero dark">
        <WamaLogo variant="light" size="md" />
        <p className="eyebrow cyan">Módulo financiero</p>
        <h1>Finanzas para controlar documentos, pagos y conciliación.</h1>
        <p>Permite cargar facturas, cartolas y pagos para identificar pagados, pendientes, diferencias y prioridades.</p>
        <div className="hero-actions"><Link href="/finanzas" className="btn-primary">Ver módulo finanzas</Link><Link href="/demo-builder" className="btn-outline-light">Solicitar demo</Link></div>
      </section>
      <section className="detail-grid"><article className="panel"><h2>Ideal para</h2><p>Cuentas por pagar, control de proveedores, conciliación bancaria y seguimiento de caja.</p></article><article className="panel"><h2>Datos que necesita</h2><p>Proveedores, documentos, fechas, montos, pagos, cartola y estado de conciliación.</p></article></section>
    </main>
  );
}
