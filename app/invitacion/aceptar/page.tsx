"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
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

    router.replace("/empresa");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0B0C0E] p-5 text-white">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[.05] p-8 shadow-2xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#00E5D6] text-2xl font-black text-black">W</span>
        <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">Invitación WAMA</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Activa tu acceso</h1>
        <p className="mt-3 text-sm leading-6 text-[#B8C0C8]">
          Define tu clave para ingresar al Portal WAMA y a los módulos que tu empresa te asignó.
        </p>

        {checking ? (
          <p className="mt-7 rounded-xl bg-white/5 p-4 text-sm text-[#B8C0C8]">Validando tu invitación…</p>
        ) : !ready ? (
          <div className="mt-7 rounded-xl bg-amber-500/15 p-4 text-sm leading-6 text-amber-100">
            <strong className="block">La invitación no está activa en este navegador.</strong>
            Abre nuevamente el enlace original recibido por correo. Si ya expiró, pide al administrador que use
            <strong> Reenviar invitación</strong> desde Usuarios.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 grid gap-4">
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
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {error && <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{error}</p>}

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
