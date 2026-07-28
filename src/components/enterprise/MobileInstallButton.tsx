"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function MobileInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setInstalled(standalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === "accepted") setPromptEvent(null);
  };

  if (installed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-black text-white">
        <Smartphone className="h-4 w-4 text-[#00E5D6]" /> App instalada
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={install}
      disabled={!promptEvent}
      title={!promptEvent ? "En iPhone usa Compartir > Agregar a pantalla de inicio" : "Instalar WAMA"}
      className="inline-flex items-center gap-2 rounded-full bg-[#00E5D6] px-4 py-2 text-xs font-black text-[#0B0C0E] transition hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-80"
    >
      <Download className="h-4 w-4" /> Instalar app
    </button>
  );
}
