import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WAMA | Servicios digitales por módulos",
  description:
    "WAMA permite activar módulos digitales para alertas, tareas, comunicaciones, comercial, contabilidad y reportes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
