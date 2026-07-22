import type { ReactNode } from "react";

type AccesoLayoutProps = {
  children: ReactNode;
};

export default function AccesoLayout({
  children,
}: AccesoLayoutProps) {
  return children;
}