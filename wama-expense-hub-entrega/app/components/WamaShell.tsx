import Link from "next/link";
import type { ReactNode } from "react";
import WamaLogo from "./WamaLogo";

type WamaShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

const navItems = [
  { href: "/app", label: "Dashboard" },
  { href: "/modulos", label: "Módulos" },
  { href: "/operacion", label: "Operación" },
  { href: "/sales-hub", label: "Sales Hub" },
  { href: "/clientes", label: "Clientes / sedes" },
  { href: "/usuarios", label: "Usuarios" },
  { href: "/reportes", label: "Reportes" },
];

export default function WamaShell({ children, title, subtitle }: WamaShellProps) {
  return (
    <div className="wama-app-shell">
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

        <div className="wama-sidebar-footer">
          <span className="sidebar-box-label">Demo comercial</span>
          <strong>Empresa Cliente</strong>
          <p>Datos genéricos, listos para presentar.</p>
        </div>
      </aside>

      <main className="wama-app-main">
        <section className="wama-app-hero">
          <div>
            <p className="eyebrow">Centro de control WAMA</p>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <div className="wama-hero-logo">
            <WamaLogo type="isotipo" variant="light" size="md" />
          </div>
        </section>

        {children}
      </main>
    </div>
  );
}