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
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function subscribeCurrentDevice({
  requestPermission,
}: {
  requestPermission: boolean;
}) {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { ok: false, reason: "unsupported" as const };
  }

  if (isIOSDevice() && !isStandaloneApp()) {
    return { ok: false, reason: "ios_not_installed" as const };
  }

  let permission = Notification.permission;

  // iOS/Safari exige que el permiso se solicite directamente desde el gesto
  // del usuario. No debe existir ningún fetch/await antes de esta llamada.
  if (permission === "default" && requestPermission) {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return { ok: false, reason: permission as "default" | "denied" };
  }

  const config = await getPushConfiguration();
  if (!config?.configured || !config.publicKey) {
    return { ok: false, reason: "not_configured" as const };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return { ok: false, reason: "no_session" as const };

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

  if (!response.ok) return { ok: false, reason: "save_failed" as const };
  return { ok: true as const };
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
