"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";

type PasswordContext = {
  email: string;
  name?: string;
  companyName?: string;
  module?: string;
  redirectTo?: string;
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [context, setContext] = useState<PasswordContext | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("wamaPasswordContext");
    if (!stored) {
      router.push("/app");
      return;
    }

    try {
      setContext(JSON.parse(stored) as PasswordContext);
    } catch {
      router.push("/app");
    }
  }, [router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!context) return;

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setError("La nueva clave debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las claves no coinciden.");
      return;
    }

    window.localStorage.setItem(`wamaPasswordChanged:${context.email}`, new Date().toISOString());
    window.localStorage.setItem(`wamaUserPassword:${context.email}`, newPassword);
    window.localStorage.setItem("wamaLastHub", context.module === "sales" ? "sales" : "expense");
    window.localStorage.removeItem("wamaPasswordContext");
    router.push(context.redirectTo || "/app");
  }

  return (
    <main className="wama-app-entry">
      <section className="wama-app-entry-shell">
        <header className="wama-app-entry-header">
          <div className="wama-app-brand">
            <div className="wama-app-brand-mark">W</div>
            <div><strong>WAMA</strong><span>WARN AND MANAGE</span></div>
          </div>
          <span className="wama-app-mode-badge"><KeyRound className="h-4 w-4" />Primer ingreso</span>
        </header>

        <div className="wama-app-entry-grid">
          <section className="wama-app-entry-intro">
            <div className="wama-app-entry-kicker"><KeyRound className="h-4 w-4" />SEGURIDAD WAMA</div>
            <h1>Crea tu nueva contraseña.</h1>
            <p>La clave que recibiste es provisoria. Debes reemplazarla antes de entrar al software de tu empresa.</p>
            <div className="wama-app-feature-list">
              {["Mínimo 8 caracteres", "Una mayúscula y una minúscula", "Al menos un número"].map((item, index) => (
                <div key={item}><span>0{index + 1}</span><p>{item}</p></div>
              ))}
            </div>
          </section>

          <form onSubmit={handleSubmit} className="wama-app-login-card">
            <div className="wama-app-login-heading">
              <div className="wama-app-login-icon"><CheckCircle2 className="h-6 w-6" /></div>
              <div>
                <p>{context?.companyName || "Portal WAMA"}</p>
                <h2>Nueva contraseña</h2>
              </div>
            </div>

            <p className="wama-app-login-description">{context?.email || "Cargando usuario..."}</p>

            <div className="wama-app-login-form">
              <label>
                <span>Nueva contraseña</span>
                <div className="wama-app-password-field">
                  <input
                    type={show ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Crea una contraseña segura"
                  />
                  <button type="button" onClick={() => setShow((value) => !value)}>
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              <label>
                <span>Confirmar contraseña</span>
                <input
                  type={show ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repite la contraseña"
                />
              </label>

              {error ? <div className="wama-app-login-error">{error}</div> : null}

              <button type="submit" className="wama-app-login-submit">
                Guardar contraseña y entrar
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
