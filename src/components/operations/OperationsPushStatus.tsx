"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellOff,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import {
  ensurePushIfAlreadyGranted,
  getPushConfiguration,
  isIOSDevice,
  isStandaloneApp,
  subscribeCurrentDevice,
} from "./operationsPushClient";

type Status =
  | "checking"
  | "active"
  | "pending"
  | "blocked"
  | "not_configured"
  | "unsupported"
  | "ios_install_required"
  | "error";

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
  const [detailError, setDetailError] = useState("");

  async function check() {
    setBusy(true);
    setDetailError("");

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

      if (isIOSDevice() && !isStandaloneApp()) {
        setStatus("ios_install_required");
        return;
      }

      const config = await getPushConfiguration();
      setInfo(config);

      if (!config?.configured) {
        setStatus("not_configured");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("blocked");
        return;
      }

      if (Notification.permission === "default") {
        setStatus("pending");
        return;
      }

      await ensurePushIfAlreadyGranted();

      const refreshed = await getPushConfiguration();
      setInfo(refreshed);

      const registration = await navigator.serviceWorker
        .getRegistration("/")
        .catch(() => null);

      const browserSubscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      setStatus(
        refreshed?.subscribed && Boolean(browserSubscription)
          ? "active"
          : "pending",
      );
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : String(error));
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  async function activate() {
    // IMPORTANTE: esta función nace directamente del click/tap del usuario.
    // No hacemos fetch previo; primero iOS/Android/Chrome reciben la solicitud
    // nativa de permiso.
    setBusy(true);
    setDetailError("");

    const result = await subscribeCurrentDevice({
      requestPermission: true,
    });

    if (result.ok) {
      window.dispatchEvent(new Event("wama:push-updated"));
      await check();
      setBusy(false);
      return;
    }

    if (result.reason === "ios_not_installed") {
      setStatus("ios_install_required");
    } else if (result.reason === "denied") {
      setStatus("blocked");
    } else if (result.reason === "not_configured") {
      setStatus("not_configured");
    } else if (result.reason === "unsupported") {
      setStatus("unsupported");
    } else {
      setStatus("error");
      setDetailError(result.detail || "No fue posible registrar este dispositivo.");
    }

    setBusy(false);
  }

  useEffect(() => {
    void check();

    const refresh = () => void check();
    window.addEventListener("wama:push-updated", refresh);

    return () => {
      window.removeEventListener("wama:push-updated", refresh);
    };
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
      label: "Activa las notificaciones",
      detail:
        "Autoriza este dispositivo una sola vez para recibir nuevos casos, alertas y avisos de WAMA.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: BellRing,
    },
    blocked: {
      label: "Notificaciones bloqueadas",
      detail:
        "El permiso fue rechazado en este dispositivo. Debes habilitar WAMA desde la configuración del navegador o del sistema.",
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
    ios_install_required: {
      label: "Instala WAMA en tu iPhone",
      detail:
        "En iPhone, abre WAMA desde el icono agregado a Pantalla de inicio. iOS solo habilita Web Push para la PWA instalada.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: Smartphone,
    },
    error: {
      label: "No se pudo activar el push",
      detail:
        detailError || "Vuelve a intentarlo. Si persiste, revisaremos el registro del dispositivo.",
      className: "border-red-200 bg-red-50 text-red-700",
      Icon: CircleAlert,
    },
  }[status];

  const Icon = view.Icon;

  return (
    <div
      className={`flex w-full flex-col gap-3 rounded-2xl border px-3 py-3 lg:min-w-[310px] lg:w-auto lg:px-4 ${view.className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <Icon
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              status === "checking" ? "animate-spin" : ""
            }`}
          />
          <div>
            <p className="text-sm font-black">{view.label}</p>
            <p
              className={`mt-1 max-w-sm text-[11px] leading-4 opacity-80 lg:text-xs lg:leading-5 ${
                status === "active" ? "hidden sm:block" : ""
              }`}
            >
              {view.detail}
            </p>
          </div>
        </div>

        {status !== "pending" && (
          <button
            type="button"
            onClick={() => void check()}
            disabled={busy}
            title="Comprobar nuevamente"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-current/20 transition hover:bg-black/5 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {status === "pending" && (
        <button
          type="button"
          onClick={() => void activate()}
          disabled={busy}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00E5D6] px-4 text-sm font-black text-[#0B0C0E] disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BellRing className="h-4 w-4" />
          )}
          {busy ? "Activando…" : "Activar notificaciones"}
        </button>
      )}

      {status === "ios_install_required" && (
        <p className="text-[11px] font-bold leading-4">
          Safari → Compartir → Agregar a pantalla de inicio → abre WAMA desde su icono.
        </p>
      )}
    </div>
  );
}
