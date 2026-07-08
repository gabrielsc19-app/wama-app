'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import WamaLogo from './WamaLogo';

const navItems = [
  { href: '/app', label: 'Módulos' },
  { href: '/app/operacion', label: 'Operación' },
  { href: '/app/clientes', label: 'Clientes / sedes' },
  { href: '/app/usuarios', label: 'Usuarios' },
  { href: '/app/reportes', label: 'Reportes' },
  { href: '/onboarding', label: 'Configurar cliente' },
];

export default function WamaAppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname();

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <Link href="/app" className="sidebar-logo-link">
          <WamaLogo variant="dark" size="sm" />
        </Link>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={active ? 'nav-item active' : 'nav-item'}>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-box">
          <span className="sidebar-box-label">Demo comercial</span>
          <strong>Empresa Cliente</strong>
          <p>Datos genéricos, listos para presentar.</p>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div>
            <p className="section-kicker">Centro de control WAMA</p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="app-header-actions">
            <Link href="/onboarding" className="btn-secondary">Configurar cliente</Link>
            <Link href="/app/operacion" className="btn-primary">Nueva alerta</Link>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
