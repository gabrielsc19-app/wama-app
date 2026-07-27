const WAMA_SW_VERSION = "wama-pwa-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
    ]),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "WAMA", body: event.data ? event.data.text() : "Nueva notificación" };
  }

  const options = {
    body: data.body || "Nueva notificación",
    icon: data.icon || "/wama-icon-192.png",
    badge: data.badge || "/wama-icon-192.png",
    tag: data.tag || WAMA_SW_VERSION,
    data: { url: data.url || data.data?.url || "/app", ...(data.data || {}) },
  };

  event.waitUntil(self.registration.showNotification(data.title || "WAMA", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) return client.navigate(url);
          return;
        }
      }
      return clients.openWindow ? clients.openWindow(url) : undefined;
    }),
  );
});
