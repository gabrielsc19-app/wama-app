import type { Metadata, Viewport } from "next";
import PwaRegister from "./components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wamaapp.com"),
  applicationName: "WAMA",
  manifest: "/manifest.json",
  title: {
    default: "WAMA | Plataforma modular",
    template: "%s | WAMA",
  },
  description: "Gestiona tu empresa módulo por módulo.",
  icons: {
    icon: [
      { url: "/wama-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/wama-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/wama-icon-192.png", type: "image/png" }],
    apple: [
      {
        url: "/apple-touch-icon-wama.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "WAMA",
    statusBarStyle: "black-translucent",
    startupImage: [],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: "WAMA | Warn and Manage",
    description: "Gestiona tu empresa módulo por módulo.",
    url: "https://www.wamaapp.com",
    siteName: "WAMA",
    locale: "es_CL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0C0E",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
