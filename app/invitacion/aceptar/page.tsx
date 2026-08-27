"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { subscribeCurrentDevice } from "../../../src/components/operations/operationsPushClient";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash") || "";

  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validating, setValidating] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setReady(Boolean(data.session));
      setChecking(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setReady(Boolean(session));
      setChecking(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function validateInvitation() {
    if (!tokenHash) {
      setError("Este enlace no contiene una invitación válida.");
      return;
    }

    setValidating(true);
    setError("");

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "invite",
    });

    if (verifyError || !data.session) {
      setError(
        "El enlace de invitación expiró, ya fue utilizado o no es válido. Solicita al administrador que use Reenviar invitación.",
      );
      setValidating(false);
      return;
    }

    setReady(true);
    setChecking(false);
    setValidating(false);

    // El token es de un solo uso. Lo quitamos de la barra del navegador.
    window.history.replaceState({}, "", "/invitacion/aceptar");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La clave debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las claves no coinciden.");
      return;
    }

    setLoading(true);

    // La activación de cuenta es la única acción dentro de WAMA.
    // Desde ese mismo click solicitamos el permiso nativo del navegador/SO.
    let pushPermissionPromise: Promise<unknown> | null = null;

    if (typeof window !== "undefined" && "Notification" in window) {
      pushPermissionPromise = subscribeCurrentDevice({
        requestPermission: true,
      }).catch(() => null);
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setError("La sesión de invitación expiró. Solicita que reenvíen la invitación.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo terminar de activar tu acceso.");
      setLoading(false);
      return;
    }

    // Si el usuario aceptó el permiso del sistema, el dispositivo queda
    // registrado. Si lo negó, la cuenta igualmente termina de activarse.
    if (pushPermissionPromise) {
      await pushPermissionPromise;
    }

    router.replace("/empresa");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0B0C0E] p-5 text-white">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[.05] p-8 shadow-2xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#00E5D6] text-2xl font-black text-black">
          W
        </span>

        <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">
          Invitación WAMA
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">
          Activa tu acceso
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#B8C0C8]">
          Valida tu invitación y define tu clave para ingresar al Portal WAMA y
          a los espacios que tu empresa te asignó.
        </p>

        {checking ? (
          <p className="mt-7 rounded-xl bg-white/5 p-4 text-sm text-[#B8C0C8]">
            Validando tu navegador…
          </p>
        ) : !ready && tokenHash ? (
          <div className="mt-7 grid gap-4">
            <div className="rounded-2xl border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-4 text-sm leading-6 text-[#D9FFFC]">
              <strong className="block">Tu invitación está lista para validar.</strong>
              Presiona el botón para activar este enlace en el navegador que estás usando.
              Esto evita problemas cuando el correo se abre desde Outlook, Gmail u otro dispositivo.
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-100">
                {error}
              </p>
            )}

            <button
              onClick={() => void validateInvitation()}
              disabled={validating}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-6 py-4 font-black text-black disabled:opacity-60"
            >
              {validating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
              {validating ? "Validando…" : "Validar mi invitación"}
            </button>
          </div>
        ) : !ready ? (
          <div className="mt-7 rounded-xl bg-amber-500/15 p-4 text-sm leading-6 text-amber-100">
            <strong className="block">Este enlace de invitación no está disponible.</strong>
            Usa el enlace más reciente recibido por correo. Si ya expiró o fue utilizado,
            pide al administrador que use <strong>Reenviar invitación</strong> desde Usuarios.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 grid gap-4">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              Invitación validada. Ahora crea tu clave personal.
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nueva clave"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-[#15181C] px-4 py-4 pr-14 outline-none focus:border-[#00E5D6]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar nueva clave" : "Mostrar nueva clave"}
                className="absolute inset-y-0 right-0 grid w-14 place-items-center text-[#B8C0C8] transition hover:text-[#00E5D6]"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repetir clave"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-[#15181C] px-4 py-4 pr-14 outline-none focus:border-[#00E5D6]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                aria-label={showConfirm ? "Ocultar clave repetida" : "Mostrar clave repetida"}
                className="absolute inset-y-0 right-0 grid w-14 place-items-center text-[#B8C0C8] transition hover:text-[#00E5D6]"
              >
                {showConfirm ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-100">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="rounded-full bg-[#00E5D6] px-6 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Activando…" : "Activar mi cuenta"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function InviteLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0B0C0E] p-5 text-white">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[.05] p-8 shadow-2xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#00E5D6] text-2xl font-black text-black">
          W
        </span>
        <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">
          Invitación WAMA
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">
          Preparando tu acceso
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8C0C8]">
          Estamos validando el enlace de invitación.
        </p>
      </section>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<InviteLoading />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
