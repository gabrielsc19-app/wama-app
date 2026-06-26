/* FixLoop | Pumay service worker
   Permite recibir notificaciones aunque la app no esté abierta.
   También actualiza o limpia el badge del ícono de la PWA cuando el navegador lo permite.
*/

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

async function updateAppBadge(count) {
  try {
    const numericCount = Math.max(0, Number(count || 0));

    if (numericCount > 0) {
      if ("setAppBadge" in self.navigator) {
        await self.navigator.setAppBadge(numericCount);
      }

      return;
    }

    if ("clearAppBadge" in self.navigator) {
      await self.navigator.clearAppBadge();
    }

    if ("setAppBadge" in self.navigator) {
      await self.navigator.setAppBadge(0);
    }
  } catch (error) {
    console.warn("No se pudo actualizar el badge de FixLoop:", error);
  }
}

self.addEventListener("message", function (event) {
  const data = event.data || {};

  if (data.type !== "FIXLOOP_SYNC_BADGE") return;

  const count = Number(data.count || 0);

  event.waitUntil(updateAppBadge(count));
});

self.addEventListener("push", function (event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      title: "FixLoop | Pumay",
      body: event.data ? event.data.text() : "Nueva notificación",
    };
  }

  const title = data.title || "FixLoop | Pumay";

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
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "fixloop-pumay",
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || data.data?.url || "/",
      pendingCount,
      ...(data.data || {}),
    },
  };

  event.waitUntil(
    Promise.allSettled([
      updateAppBadge(pendingCount),
      self.registration.showNotification(title, options),
    ]),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    Promise.allSettled([
      updateAppBadge(0),
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
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