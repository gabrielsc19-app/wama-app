import type { ReactNode } from "react";
import Link from "next/link";
import WamaLogo from "./WamaLogo";

type WamaAppShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

const navItems = [
  { label: "Inicio", href: "/app" },
  { label: "Módulos", href: "/modulos" },
  { label: "Operación", href: "/operacion" },
  { label: "Sales Hub", href: "/sales-hub" },
  { label: "Clientes", href: "/clientes" },
  { label: "Usuarios", href: "/usuarios" },
  { label: "Reportes", href: "/reportes" },
  { label: "Configurar cliente", href: "/onboarding/sales-hub" },
];

export default function WamaAppShell({
  children,
  title,
  subtitle,
}: WamaAppShellProps) {
  return (
    <main className="wama-app-layout">
      <aside className="wama-sidebar">
        <div className="wama-sidebar-logo">
          <WamaLogo type="horizontal" variant="dark" size="sm" />
        </div>

        <nav className="wama-sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="wama-sidebar-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="wama-sidebar-box">
          <span className="sidebar-box-label">Demo comercial</span>
          <strong>WAMA operativo</strong>
          <p>Datos genéricos para venta y demostración.</p>
        </div>
      </aside>

      <section className="wama-content">
        <header className="wama-content-header">
          <div>
            <p className="eyebrow">Centro de control</p>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <div className="wama-header-actions">
            <Link href="/onboarding/sales-hub" className="btn-secondary">
              Configurar cliente
            </Link>
            <Link href="/operacion" className="btn-primary">
              Nuevo caso
            </Link>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}