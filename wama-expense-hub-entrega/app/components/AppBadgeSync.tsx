"use client";

import { useCallback, useEffect } from "react";

type UserProfile = {
  email?: string | null;
  role?: string | null;
  organization_id?: number | null;
  location_id?: number | null;
};

type Location = {
  id?: number | null;
  name?: string | null;
  local_code?: string | null;
};

export default function AppBadgeSync({
  userProfile,
  userLocation,
}: {
  userProfile: UserProfile | null;
  userLocation?: Location | null;
}) {
  const getLocationId = useCallback(() => {
    return userProfile?.location_id || userLocation?.id || null;
  }, [userProfile?.location_id, userLocation?.id]);

  const sendBadgeToServiceWorker = useCallback(async (count: number) => {
    try {
      if (!("serviceWorker" in navigator)) return;

      const registration = await navigator.serviceWorker.ready;

      await registration.update();

      const message = {
        type: "FIXLOOP_SYNC_BADGE",
        count,
      };

      if (registration.active) {
        registration.active.postMessage(message);
      }

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
      }
    } catch (error) {
      console.warn("No se pudo enviar badge al service worker:", error);
    }
  }, []);

  const clearBadgeEverywhere = useCallback(async () => {
    try {
      if ("clearAppBadge" in navigator) {
        await navigator.clearAppBadge();
      }

      if ("setAppBadge" in navigator) {
        await navigator.setAppBadge(0);
      }

      await sendBadgeToServiceWorker(0);
    } catch (error) {
      console.warn("No se pudo limpiar badge FixLoop:", error);
    }
  }, [sendBadgeToServiceWorker]);

  const setBadgeEverywhere = useCallback(
    async (count: number) => {
      const safeCount = Math.max(0, Number(count || 0));

      if (safeCount <= 0) {
        await clearBadgeEverywhere();
        return;
      }

      try {
        if ("setAppBadge" in navigator) {
          await navigator.setAppBadge(safeCount);
        }

        await sendBadgeToServiceWorker(safeCount);
      } catch (error) {
        console.warn("No se pudo actualizar badge FixLoop:", error);
      }
    },
    [clearBadgeEverywhere, sendBadgeToServiceWorker],
  );

  const syncBadge = useCallback(async () => {
    try {
      if (!userProfile?.email || !userProfile?.organization_id) {
        await clearBadgeEverywhere();
        return;
      }

      const response = await fetch("/api/notifications/pending-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        cache: "no-store",
        body: JSON.stringify({
          organizationId: userProfile.organization_id,
          userEmail: userProfile.email,
          role: userProfile.role,
          locationId: getLocationId(),
        }),
      });

      const result = await response.json().catch(() => null);
      const count = Math.max(0, Number(result?.count || 0));

      if (count > 0) {
        await setBadgeEverywhere(count);
      } else {
        await clearBadgeEverywhere();
      }
    } catch (error) {
      console.warn("No se pudo sincronizar badge FixLoop:", error);
      await clearBadgeEverywhere();
    }
  }, [
    userProfile?.email,
    userProfile?.role,
    userProfile?.organization_id,
    getLocationId,
    clearBadgeEverywhere,
    setBadgeEverywhere,
  ]);

  useEffect(() => {
    clearBadgeEverywhere();
    syncBadge();

    const handleFocus = () => {
      syncBadge();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncBadge();
      }
    };

    const handlePageShow = () => {
      syncBadge();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(syncBadge, 8_000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, [syncBadge, clearBadgeEverywhere]);

  return null;
}
