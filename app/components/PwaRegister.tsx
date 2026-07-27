"use client";

import { useEffect } from "react";

const SERVICE_WORKER_VERSION = "wama-pwa-v1";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    async function registerWamaServiceWorker() {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          const scriptURL =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            "";

          if (scriptURL && !scriptURL.includes("/sw.js")) {
            await registration.unregister();
          }
        }

        const registration = await navigator.serviceWorker.register(
          `/sw.js?v=${SERVICE_WORKER_VERSION}`,
          {
            scope: "/",
            updateViaCache: "none",
          },
        );

        await registration.update();
      } catch (error) {
        console.warn("No se pudo registrar la aplicación WAMA:", error);
      }
    }

    void registerWamaServiceWorker();
  }, []);

  return null;
}
