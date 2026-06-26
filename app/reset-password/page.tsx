"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { CheckCircle2, ClipboardList, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const APP_NAME = "FixLoop | Pumay";
const APP_TAGLINE = "Report. Assign. Resolve.";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isFirstLoginMode, setIsFirstLoginMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsFirstLoginMode(params.get("mode") === "first-login");
    }

    async function checkRecoverySession() {
      setLoadingSession(true);
      setErrorMessage("");

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Error revisando sesión de recuperación:", error);
      }

      if (data.session) {
        setSessionReady(true);
      } else {
        setSessionReady(false);
        setErrorMessage(
          "No hay una sesión activa para cambiar contraseña. Ingresa con la contraseña temporal o solicita un nuevo enlace desde el inicio de sesión."
        );
      }

      setLoadingSession(false);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setSessionReady(true);
        setErrorMessage("");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!sessionReady) {
      setErrorMessage(
        "No hay una sesión activa para cambiar contraseña. Ingresa con la contraseña temporal o solicita un nuevo enlace desde el inicio de sesión."
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const activeEmail = String(session?.user?.email || "")
      .toLowerCase()
      .trim();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Error actualizando contraseña:", error);
      setErrorMessage(
        "No se pudo actualizar la contraseña. Solicita un nuevo enlace e intenta nuevamente."
      );
      setSaving(false);
      return;
    }

    if (activeEmail) {
      await supabase
        .from("users_pumay")
        .update({ must_change_password: false })
        .eq("email", activeEmail);
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("fixloop_pumay_session");
    }

    setSuccessMessage("Contraseña creada correctamente. Ya puedes iniciar sesión con tu nueva clave.");
    setPassword("");
    setPasswordConfirmation("");
    setSaving(false);

    await supabase.auth.signOut();

    window.setTimeout(() => {
      router.push("/");
    }, 1800);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{APP_NAME}</h1>
              <p className="mt-1 text-sm text-slate-200">{APP_TAGLINE}</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isFirstLoginMode ? "Crea tu propia contraseña" : "Crear nueva contraseña"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {isFirstLoginMode
                  ? "Por seguridad, antes de entrar debes reemplazar la contraseña temporal por una contraseña propia."
                  : "Define una nueva contraseña para volver a ingresar a FixLoop."}
              </p>
            </div>
          </div>

          {loadingSession && (
            <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
              Validando enlace de recuperación...
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nueva contraseña
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!sessionReady || saving}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showPasswordConfirmation ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder="Repite la nueva contraseña"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={8}
                  disabled={!sessionReady || saving}
                />

                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label={showPasswordConfirmation ? "Ocultar confirmación" : "Mostrar confirmación"}
                  disabled={!sessionReady || saving}
                >
                  {showPasswordConfirmation ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!sessionReady || saving}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white font-semibold transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Actualizar contraseña"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Volver al inicio de sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
