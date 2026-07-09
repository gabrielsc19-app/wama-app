import "./globals.css";

export const metadata = {
  title: "WAMA | Plataforma modular",
  description: "Gestiona tu empresa módulo por módulo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}