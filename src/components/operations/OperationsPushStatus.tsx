"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellOff,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  ensurePushIfAlreadyGranted,
  getPushConfiguration,
} from "./operationsPushClient";

type Status =
  | "checking"
  | "active"
  | "pending"
  | "blocked"
  | "not_configured"
  | "unsupported";

type PushInfo = {
  configured: boolean;
  subscribed: boolean;
  subscriptions?: Array<{
    id: string;
    endpoint: string;
    user_agent?: string | null;
    last_seen_at?: string | null;
    created_at?: string | null;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function OperationsPushStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [info, setInfo] = useState<PushInfo | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);

    try {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setStatus("unsupported");
        return;
      }

      const config = await getPushConfiguration();
      setInfo(config);

      if (!config?.configured) {
        setStatus("not_configured");
        return;
      }

      const permission = Notification.permission;

      if (permission === "denied") {
        setStatus("blocked");
        return;
      }

      if (permission === "default") {
        setStatus("pending");
        return;
      }

      // Si el permiso ya está granted, WAMA intenta sincronizar silenciosamente
      // este dispositivo antes de decidir el estado final.
      await ensurePushIfAlreadyGranted();

      const refreshed = await getPushConfiguration();
      setInfo(refreshed);

      const registration = await navigator.serviceWorker.ready.catch(() => null);
      const browserSubscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      setStatus(
        refreshed?.subscribed && Boolean(browserSubscription)
          ? "active"
          : "pending",
      );
    } catch {
      setStatus("pending");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void check();
  }, []);

  const latest = useMemo(
    () => info?.subscriptions?.[0] || null,
    [info],
  );

  const view = {
    checking: {
      label: "Verificando notificaciones",
      detail: "Comprobando este dispositivo…",
      className: "border-[#DCE1E6] bg-white text-[#59616B]",
      Icon: Loader2,
    },
    active: {
      label: "Notificaciones activas",
      detail: latest?.last_seen_at
        ? `Este dispositivo recibirá avisos · sincronizado ${formatDate(latest.last_seen_at)}`
        : "Este dispositivo recibirá avisos de WAMA.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: CheckCircle2,
    },
    pending: {
      label: "Notificaciones pendientes",
      detail:
        "Este dispositivo todavía no confirmó una suscripción push. El permiso se solicita durante la activación de la cuenta.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: BellRing,
    },
    blocked: {
      label: "Notificaciones bloqueadas",
      detail:
        "El navegador o sistema operativo tiene las notificaciones bloqueadas para WAMA.",
      className: "border-red-200 bg-red-50 text-red-700",
      Icon: BellOff,
    },
    not_configured: {
      label: "Push no configurado",
      detail:
        "Falta completar la configuración VAPID del entorno de WAMA.",
      className: "border-red-200 bg-red-50 text-red-700",
      Icon: CircleAlert,
    },
    unsupported: {
      label: "Push no disponible",
      detail:
        "Este navegador o dispositivo no soporta las notificaciones web requeridas.",
      className: "border-[#DCE1E6] bg-[#F5F6F7] text-[#59616B]",
      Icon: BellOff,
    },
  }[status];

  const Icon = view.Icon;

  return (
    <div
      className={`flex min-w-[310px] items-start justify-between gap-4 rounded-2xl border px-4 py-3 ${view.className}`}
    >
      <div className="flex gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            status === "checking" ? "animate-spin" : ""
          }`}
        />
        <div>
          <p className="text-sm font-black">{view.label}</p>
          <p className="mt-1 max-w-sm text-xs leading-5 opacity-80">
            {view.detail}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void check()}
        disabled={busy}
        title="Comprobar nuevamente"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-current/20 transition hover:bg-black/5 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
