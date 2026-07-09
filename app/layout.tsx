import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WAMA | Plataforma operativa modular',
  description: 'WAMA permite gestionar alertas, tareas, comunicaciones, clientes, reportes y módulos de negocio en una sola plataforma.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
