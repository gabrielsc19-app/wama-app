"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../../app/lib/supabase";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function token() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sesión caducada.");
  return data.session.access_token;
}

export default function OperationsPushButton() {
  const [configured, setConfigured] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const access = await token();
        const response = await fetch("/api/operations/push-subscription", {
          headers: { Authorization: `Bearer ${access}` },
        });
        const data = await response.json();

        if (response.ok) {
          setConfigured(Boolean(data.configured));
          setSubscribed(Boolean(data.subscribed));
          setPublicKey(data.publicKey || "");
        }
      } catch {
        // No bloquea Operations.
      }
    })();
  }, []);

  async function activate() {
    setBusy(true);
    setMessage("");

    try {
      if (!configured || !publicKey) {
        throw new Error("Las notificaciones push todavía no están configuradas.");
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Este navegador no admite notificaciones push.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Debes permitir las notificaciones para recibir avisos.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const access = await token();
      const response = await fetch("/api/operations/push-subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo activar el dispositivo.");
      }

      setSubscribed(true);
      setMessage("Este dispositivo recibirá avisos de WAMA.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron activar las notificaciones.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!configured) return null;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => void activate()}
        disabled={busy || subscribed}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${
          subscribed
            ? "bg-emerald-50 text-emerald-700"
            : "bg-[#DFFFFA] text-[#007E76]"
        } disabled:opacity-80`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : subscribed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}
        {subscribed ? "Notificaciones activadas" : "Activar notificaciones"}
      </button>

      {message && (
        <span className="max-w-xs text-xs text-[#69717D]">{message}</span>
      )}
    </div>
  );
}
