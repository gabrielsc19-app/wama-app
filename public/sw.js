const WAMA_SW_VERSION = "wama-pwa-v5";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== WAMA_SW_VERSION)
            .map((key) => caches.delete(key)),
        ),
      ),
    ]),
  );
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "WAMA",
      body: event.data ? event.data.text() : "Tienes un nuevo aviso",
    };
  }

  const options = {
    body: data.body || "Tienes un nuevo aviso en WAMA",
    icon: data.icon || "/wama-icon-192.png",
    badge: data.badge || "/wama-icon-192.png",
    tag: data.tag || `wama-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || data.data?.url || "/operations-hub",
      caseId: data.data?.caseId || null,
      ...(data.data || {}),
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "WAMA", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/operations-hub";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          try {
            const clientUrl = new URL(client.url);
            const target = new URL(targetUrl, self.location.origin);

            if (clientUrl.origin === target.origin && "focus" in client) {
              await client.focus();
              if ("navigate" in client) await client.navigate(target.href);
              return;
            }
          } catch {}
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
