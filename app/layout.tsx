import PwaRegister from "./components/PwaRegister";
import "./globals.css";

export const metadata = {
  manifest: "/manifest.json",
  title: "WAMA | Plataforma modular",
  description: "Gestiona tu empresa módulo por módulo.",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: ["/icon.svg"],
    apple: [
      {
        url: "/apple-icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body><PwaRegister />{children}</body>
    </html>
  );
}