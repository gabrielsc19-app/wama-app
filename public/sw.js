/* WAMA service worker
   Mantiene la instalación PWA actualizada y gestiona notificaciones y badges.
*/

const WAMA_SW_VERSION = "wama-pwa-v1";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return !key.startsWith(WAMA_SW_VERSION);
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      }),
    ]),
  );
});

async function updateAppBadge(count) {
  try {
    const numericCount = Math.max(0, Number(count || 0));

    if (numericCount > 0 && "setAppBadge" in self.navigator) {
      await self.navigator.setAppBadge(numericCount);
      return;
    }

    if ("clearAppBadge" in self.navigator) {
      await self.navigator.clearAppBadge();
    }
  } catch (error) {
    console.warn("No se pudo actualizar el badge de WAMA:", error);
  }
}

self.addEventListener("message", function (event) {
  const data = event.data || {};

  if (data.type === "WAMA_SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type !== "WAMA_SYNC_BADGE" && data.type !== "FIXLOOP_SYNC_BADGE") {
    return;
  }

  event.waitUntil(updateAppBadge(Number(data.count || 0)));
});

self.addEventListener("push", function (event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "WAMA",
      body: event.data ? event.data.text() : "Nueva notificación",
    };
  }

  const pendingCountRaw =
    data.pendingCount ??
    data.pending_count ??
    data.badgeCount ??
    data.badge_count ??
    data.count ??
    data.data?.pendingCount ??
    data.data?.pending_count ??
    data.data?.badgeCount ??
    data.data?.badge_count ??
    data.data?.count ??
    0;

  const pendingCount = Math.max(0, Number(pendingCountRaw || 0));

  const options = {
    body: data.body || "Nueva notificación",
    icon: data.icon || "/wama-icon-192.png?v=1",
    badge: data.badge || "/wama-icon-192.png?v=1",
    tag: data.tag || "wama-notification",
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || data.data?.url || "/acceso",
      pendingCount,
      ...(data.data || {}),
    },
  };

  event.waitUntil(
    Promise.allSettled([
      updateAppBadge(pendingCount),
      self.registration.showNotification(data.title || "WAMA", options),
    ]),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/acceso";

  event.waitUntil(
    Promise.allSettled([
      updateAppBadge(0),
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then(function (clientList) {
          for (const client of clientList) {
            if ("focus" in client) {
              client.focus();

              if ("navigate" in client) {
                return client.navigate(urlToOpen);
              }

              return;
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        }),
    ]),
  );
});
