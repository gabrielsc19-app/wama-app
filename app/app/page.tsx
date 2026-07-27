"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const SALES_EMAIL = "demo@vertexfacilities.com";
const SALES_PASSWORD = "WamaTrial2026!";
const EXPENSE_EMAIL = "demo@wamaapp.com";
const EXPENSE_PASSWORD = "WamaExpense2026!";

type Hub = "sales" | "expense";

type StoredClient = {
  id: string;
  companyName: string;
  email: string;
  password: string;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function WamaAppEntryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hub, setHub] = useState<Hub>("expense");
  const [email, setEmail] = useState(EXPENSE_EMAIL);
  const [password, setPassword] = useState(EXPENSE_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const appMode = isStandalone();
    setStandalone(appMode);

    const lastHub = window.localStorage.getItem("wamaLastHub") as Hub | null;
    const expenseSession = window.localStorage.getItem("wamaExpenseSession");
    const salesSession = window.localStorage.getItem("wamaActiveClient");

    if (lastHub === "expense" && expenseSession) {
      router.replace("/expense-hub");
      return;
    }

    if (lastHub === "sales" && salesSession) {
      router.replace("/sales-hub/crm");
      return;
    }

    if (expenseSession && !salesSession) {
      router.replace("/expense-hub");
      return;
    }

    if (salesSession && !expenseSession) {
      router.replace("/sales-hub/crm");
      return;
    }

    setReady(true);
  }, [router]);

  const copy = useMemo(
    () =>
      hub === "expense"
        ? {
            eyebrow: "Expense Hub",
            title: "Rinde, aprueba y controla gastos.",
            description: "Captura documentos desde el celular y sigue cada rendición hasta su aprobación.",
            icon: ReceiptText,
          }
        : {
            eyebrow: "Sales Hub",
            title: "Gestiona clientes y oportunidades.",
            description: "Trabaja tu pipeline, actividades, propuestas y cierres desde un solo lugar.",
            icon: BriefcaseBusiness,
          },
    [hub],
  );

  function selectHub(nextHub: Hub) {
    setHub(nextHub);
    setError("");
    if (nextHub === "expense") {
      setEmail(EXPENSE_EMAIL);
      setPassword(EXPENSE_PASSWORD);
    } else {
      setEmail(SALES_EMAIL);
      setPassword(SALES_PASSWORD);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalized = email.trim().toLowerCase();

    if (hub === "expense") {
      if (normalized !== EXPENSE_EMAIL || password !== EXPENSE_PASSWORD) {
        setError("Revisa el correo y la clave provisoria de Expense Hub.");
        return;
      }

      window.localStorage.setItem(
        "wamaExpenseSession",
        JSON.stringify({
          email: normalized,
          companyName: "Empresa Demo SpA",
          role: "Administrador",
        }),
      );
      window.localStorage.setItem("wamaLastHub", "expense");

      const changed = window.localStorage.getItem(`wamaPasswordChanged:${normalized}`);
      if (!changed) {
        window.localStorage.setItem(
          "wamaPasswordContext",
          JSON.stringify({
            email: normalized,
            name: "Usuario Expense",
            companyName: "Empresa Demo SpA",
            module: "expense",
            redirectTo: "/expense-hub",
          }),
        );
        router.push("/cambiar-clave");
        return;
      }

      router.push("/expense-hub");
      return;
    }

    if (normalized !== SALES_EMAIL || password !== SALES_PASSWORD) {
      setError("Revisa el correo y la clave provisoria de Sales Hub.");
      return;
    }

    const client: StoredClient = {
      id: "vertex-facilities-demo",
      companyName: "Vertex Facilities",
      email: normalized,
      password: SALES_PASSWORD,
    };

    window.localStorage.setItem("wamaActiveClient", JSON.stringify(client));
    window.localStorage.setItem("wamaLastHub", "sales");

    const changed = window.localStorage.getItem(`wamaPasswordChanged:${normalized}`);
    if (!changed) {
      window.localStorage.setItem(
        "wamaPasswordContext",
        JSON.stringify({
          email: normalized,
          name: "Usuario Sales",
          companyName: "Vertex Facilities",
          module: "sales",
          redirectTo: "/sales-hub/crm",
        }),
      );
      router.push("/cambiar-clave");
      return;
    }

    router.push("/sales-hub/crm");
  }

  if (!ready) {
    return (
      <main className="wama-app-entry wama-app-entry-loading">
        <div className="wama-app-splash-mark">W</div>
        <p>WARN AND MANAGE</p>
      </main>
    );
  }

  const Icon = copy.icon;

  return (
    <main className="wama-app-entry">
      <section className="wama-app-entry-shell">
        <header className="wama-app-entry-header">
          <div className="wama-app-brand">
            <div className="wama-app-brand-mark">W</div>
            <div>
              <strong>WAMA</strong>
              <span>WARN AND MANAGE</span>
            </div>
          </div>

          <span className="wama-app-mode-badge">
            <ShieldCheck className="h-4 w-4" />
            {standalone ? "Aplicación instalada" : "Acceso al software"}
          </span>
        </header>

        <div className="wama-app-entry-grid">
          <section className="wama-app-entry-intro">
            <div className="wama-app-entry-kicker">
              <Sparkles className="h-4 w-4" />
              TU ESPACIO DE TRABAJO
            </div>
            <h1>Entra directamente a WAMA.</h1>
            <p>
              La aplicación instalada abre el software, recuerda tu último Hub y elimina la navegación comercial.
            </p>

            <div className="wama-app-feature-list">
              <div><span>01</span><p>Acceso con correo y clave provisoria.</p></div>
              <div><span>02</span><p>Cambio obligatorio de contraseña.</p></div>
              <div><span>03</span><p>Entrada directa al último Hub utilizado.</p></div>
            </div>
          </section>

          <section className="wama-app-login-card">
            <div className="wama-app-hub-tabs" role="tablist" aria-label="Selecciona un Hub">
              <button
                type="button"
                onClick={() => selectHub("expense")}
                className={hub === "expense" ? "is-active" : ""}
              >
                <ReceiptText className="h-5 w-5" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => selectHub("sales")}
                className={hub === "sales" ? "is-active" : ""}
              >
                <BriefcaseBusiness className="h-5 w-5" />
                Sales
              </button>
            </div>

            <div className="wama-app-login-heading">
              <div className="wama-app-login-icon"><Icon className="h-6 w-6" /></div>
              <div>
                <p>{copy.eyebrow}</p>
                <h2>{copy.title}</h2>
              </div>
            </div>

            <p className="wama-app-login-description">{copy.description}</p>

            <form onSubmit={submit} className="wama-app-login-form">
              <label>
                <span>Correo</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  inputMode="email"
                  autoComplete="username"
                />
              </label>

              <label>
                <span>Clave</span>
                <div className="wama-app-password-field">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Mostrar u ocultar clave">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              {error ? <div className="wama-app-login-error">{error}</div> : null}

              <button type="submit" className="wama-app-login-submit">
                <LockKeyhole className="h-4 w-4" />
                Entrar a {copy.eyebrow}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="wama-app-provisional-note">
              <strong>Primer ingreso</strong>
              <span>WAMA solicitará reemplazar la clave provisoria antes de abrir el Hub.</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
