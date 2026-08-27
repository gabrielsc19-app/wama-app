"use client";

import { supabase } from "../../../app/lib/supabase";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function getPushConfiguration() {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const response = await fetch("/api/operations/push-subscription", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;

  return response.json() as Promise<{
    configured: boolean;
    publicKey: string;
    subscribed: boolean;
    subscriptions?: Array<{
      id: string;
      endpoint: string;
      user_agent?: string | null;
      last_seen_at?: string | null;
      created_at?: string | null;
    }>;
  }>;
}

export function isIOSDevice() {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type PushActivationResult =
  | { ok: true; reason: "subscribed" }
  | {
      ok: false;
      reason:
        | "unsupported"
        | "ios_not_installed"
        | "denied"
        | "default"
        | "not_configured"
        | "no_session"
        | "save_failed"
        | "service_worker_failed"
        | "subscribe_failed";
      detail?: string;
    };

export async function subscribeCurrentDevice({
  requestPermission,
}: {
  requestPermission: boolean;
}): Promise<PushActivationResult> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { ok: false, reason: "unsupported" };
  }

  if (isIOSDevice() && !isStandaloneApp()) {
    return { ok: false, reason: "ios_not_installed" };
  }

  let permission = Notification.permission;

  // CLAVE PARA iPhone/iPad:
  // si el permiso está en "default", esta llamada debe ocurrir directamente
  // como consecuencia del toque del usuario, antes de hacer fetch/await externo.
  if (permission === "default" && requestPermission) {
    permission = await Notification.requestPermission();
  }

  if (permission === "denied") {
    return { ok: false, reason: "denied" };
  }

  if (permission !== "granted") {
    return { ok: false, reason: "default" };
  }

  const config = await getPushConfiguration();

  if (!config?.configured || !config.publicKey) {
    return { ok: false, reason: "not_configured" };
  }

  let registration: ServiceWorkerRegistration;

  try {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
  } catch (error) {
    return {
      ok: false,
      reason: "service_worker_failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });
    } catch (error) {
      return {
        ok: false,
        reason: "subscribe_failed",
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const accessToken = await getAccessToken();

  if (!accessToken) {
    return { ok: false, reason: "no_session" };
  }

  const response = await fetch("/api/operations/push-subscription", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    return {
      ok: false,
      reason: "save_failed",
      detail: payload?.error || `HTTP ${response.status}`,
    };
  }

  return { ok: true, reason: "subscribed" };
}

export async function ensurePushIfAlreadyGranted() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  await subscribeCurrentDevice({ requestPermission: false });
}
