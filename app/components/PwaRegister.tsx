"use client";

import { useEffect } from "react";

const SERVICE_WORKER_VERSION = "wama-pwa-v2";

export default function PwaRegister() {
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    document.documentElement.dataset.wamaMode = standalone ? "app" : "web";
    document.body.classList.toggle("wama-standalone", standalone);

    if (!('serviceWorker' in navigator)) return;

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register(
          `/sw.js?v=${SERVICE_WORKER_VERSION}`,
          { scope: "/", updateViaCache: "none" },
        );
        await registration.update();
      } catch (error) {
        console.warn("No se pudo registrar WAMA:", error);
      }
    }

    void register();
  }, []);

  return null;
}
