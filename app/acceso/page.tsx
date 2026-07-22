"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WamaShell from "../../src/components/brand/WamaShell";
import {
  findTrialClient,
  trialClients,
} from "../../src/lib/wamaTrialClients";

export default function AccesoPage() {
  const router = useRouter();
  const demoClient = trialClients[0];

  const [email, setEmail] = useState(demoClient.email);
  const [password, setPassword] = useState(demoClient.password);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [leadName, setLeadName] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadNeed, setLeadNeed] = useState("");
  const [leadSent, setLeadSent] = useState(false);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const client = findTrialClient(email.trim(), password);

    if (!client) {
      setError(
        "No pudimos validar el acceso. Revisa el correo y la clave asignada.",
      );
      return;
    }

    window.localStorage.setItem(
      "wamaActiveClient",
      JSON.stringify(client),
    );

    router.push("/portal");
  }

  function fillDemoAccess() {
    setEmail(demoClient.email);
    setPassword(demoClient.password);
    setError("");
  }

  function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lead = {
      name: leadName.trim(),
      company: leadCompany.trim(),
      contact: leadContact.trim(),
      need: leadNeed.trim(),
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      "wamaLastLead",
      JSON.stringify(lead),
    );

    setLeadSent(true);
  }

  function scrollToLogin() {
    document
      .getElementById("acceso-demo")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <WamaShell>
      <main className="overflow-hidden bg-white text-[#0B0C0E]">
        <HeroSection onOpenDemo={scrollToLogin} />

        <VideoSection />

        <AccessSection
          demoClient={demoClient}
          email={email}
          password={password}
          error={error}
          showPassword={showPassword}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword((current) => !current)}
          onFillDemo={fillDemoAccess}
          onLogin={handleLogin}
        />

        <LeadSection
          leadName={leadName}
          leadCompany={leadCompany}
          leadContact={leadContact}
          leadNeed={leadNeed}
          leadSent={leadSent}
          onLeadNameChange={setLeadName}
          onLeadCompanyChange={setLeadCompany}
          onLeadContactChange={setLeadContact}
          onLeadNeedChange={setLeadNeed}
          onSubmit={handleLeadSubmit}
        />

        <AccessFooter />
      </main>
    </WamaShell>
  );
}

type HeroSectionProps = {
  onOpenDemo: () => void;
};

function HeroSection({ onOpenDemo }: HeroSectionProps) {
  return (
    <section className="relative border-b border-white/10 bg-[#0B0C0E] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-[#00E5D6]/10 blur-[130px]" />
        <div className="absolute right-[-8rem] top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[#00E5D6]/10 blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 lg:pb-32 lg:pt-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-black text-[#C4C7CC] transition hover:text-[#00E5D6]"
        >
          <span aria-hidden="true">←</span>
          Volver al inicio
        </Link>

        <div className="mt-14 grid gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">
              Demostración WAMA Sales Hub
            </p>

            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              Explora WAMA antes de implementarlo.
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#BFC5CD]">
              Conoce un flujo comercial real, revisa el pipeline, gestiona
              oportunidades y descubre cómo WAMA puede ordenar el trabajo de tu
              equipo.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex items-center justify-center rounded-full bg-[#00E5D6] px-8 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(0,229,214,0.22)]"
              >
                Entrar a la demo
              </button>

              <a
                href="#video-demo"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white transition hover:border-[#00E5D6]/60 hover:text-[#00E5D6]"
              >
                Ver demostración
              </a>
            </div>
          </div>

          <div className="border-l border-white/15 pl-0 lg:pl-9">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00E5D6]">
              Lo esencial
            </p>

            <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
              <HeroDetail
                number="01"
                text="Pipeline comercial visual y ordenado"
              />
              <HeroDetail
                number="02"
                text="Seguimiento centralizado por oportunidad"
              />
              <HeroDetail
                number="03"
                text="Dashboard ejecutivo para tomar decisiones"
              />
            </div>

            <p className="mt-6 text-sm leading-7 text-[#9FA7B2]">
              La demostración utiliza información ficticia y no contiene datos
              reales de clientes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroDetail({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[3rem_1fr] gap-4 py-5">
      <span className="text-xs font-black text-[#00E5D6]">{number}</span>
      <p className="text-sm font-black text-white">{text}</p>
    </div>
  );
}

function VideoSection() {
  return (
    <section
      id="video-demo"
      className="scroll-mt-28 border-b border-[#E3E6EA] bg-[#F5F6F7]"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
              Conoce el producto
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-[-0.055em] text-[#0B0C0E] md:text-5xl">
              Mira WAMA funcionando.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#626A76]">
              Recorre el acceso, el pipeline comercial y las principales vistas
              de Sales Hub antes de entrar a la demostración.
            </p>
          </div>

          <div>
            <div className="overflow-hidden rounded-[1.75rem] border border-[#D5D9DE] bg-[#0B0C0E] shadow-[0_30px_90px_rgba(11,12,14,0.18)]">
              <video
                controls
                preload="metadata"
                playsInline
                className="aspect-video w-full bg-black object-contain"
              >
                <source
                  src="/videos/wama-demo.mp4"
                  type="video/mp4"
                />
                Tu navegador no puede reproducir este video.
              </video>
            </div>

            <div className="mt-5 flex flex-col gap-2 text-sm text-[#707884] sm:flex-row sm:items-center sm:justify-between">
              <p>Demostración del entorno WAMA Sales Hub.</p>
              <a
                href="#acceso-demo"
                className="font-black text-[#0B0C0E] transition hover:text-[#008F87]"
              >
                Entrar a la demo →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type DemoClient = (typeof trialClients)[number];

type AccessSectionProps = {
  demoClient: DemoClient;
  email: string;
  password: string;
  error: string;
  showPassword: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onFillDemo: () => void;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
};

function AccessSection({
  demoClient,
  email,
  password,
  error,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onFillDemo,
  onLogin,
}: AccessSectionProps) {
  return (
    <section
      id="acceso-demo"
      className="scroll-mt-24 bg-white"
    >
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-32">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">
            Acceso de demostración
          </p>

          <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-[-0.055em] text-[#0B0C0E] md:text-6xl">
            Entra y prueba el producto.
          </h2>

          <p className="mt-7 max-w-xl text-lg leading-8 text-[#626A76]">
            Utiliza las credenciales demo para explorar Sales Hub. Podrás revisar
            oportunidades, mover negocios entre etapas y consultar el dashboard
            comercial.
          </p>

          <div className="mt-10 border-y border-[#DDE1E6] py-7">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0B0C0E] text-lg font-black text-[#00E5D6]">
                {demoClient.logoText}
              </div>

              <div>
                <p className="text-lg font-black text-[#0B0C0E]">
                  {demoClient.companyName}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#747C87]">
                  Entorno demo · Sales Hub
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8A929D]">
                  Correo
                </p>
                <p className="mt-2 break-all font-black text-[#20252C]">
                  {demoClient.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8A929D]">
                  Clave
                </p>
                <p className="mt-2 font-black text-[#20252C]">
                  {demoClient.password}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onFillDemo}
              className="mt-7 inline-flex items-center justify-center rounded-full border-2 border-[#0B0C0E] bg-white px-6 py-3.5 text-sm font-black text-[#0B0C0E] transition hover:bg-[#0B0C0E] hover:text-white"
            >
              Completar credenciales
            </button>
          </div>
        </div>

        <form
          onSubmit={onLogin}
          className="rounded-[2rem] bg-[#0B0C0E] p-7 text-white shadow-[0_35px_110px_rgba(11,12,14,0.2)] sm:p-10"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00E5D6]">
            Portal WAMA
          </p>

          <h3 className="mt-4 text-4xl font-black tracking-[-0.05em]">
            Iniciar sesión
          </h3>

          <p className="mt-4 max-w-lg text-sm leading-7 text-[#B7BEC7]">
            Las credenciales de demostración ya están disponibles. Puedes
            completarlas automáticamente o escribirlas manualmente.
          </p>

          <div className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-black text-white">
                Correo
              </span>

              <input
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 text-sm text-white outline-none transition placeholder:text-[#747C87] focus:border-[#00E5D6]/70 focus:bg-white/[0.08]"
                placeholder="usuario@empresa.cl"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-white">
                Clave
              </span>

              <div className="relative">
                <input
                  value={password}
                  onChange={(event) =>
                    onPasswordChange(event.target.value)
                  }
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 pr-24 text-sm text-white outline-none transition placeholder:text-[#747C87] focus:border-[#00E5D6]/70 focus:bg-white/[0.08]"
                  placeholder="Clave asignada"
                />

                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#00E5D6] transition hover:text-white"
                >
                  {showPassword ? "Ocultar" : "Ver clave"}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold leading-6 text-red-100"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(0,229,214,0.2)]"
          >
            Entrar a WAMA
          </button>

          <p className="mt-5 text-center text-xs leading-6 text-[#858E99]">
            Entorno demostrativo con datos ficticios.
          </p>
        </form>
      </div>
    </section>
  );
}

type LeadSectionProps = {
  leadName: string;
  leadCompany: string;
  leadContact: string;
  leadNeed: string;
  leadSent: boolean;
  onLeadNameChange: (value: string) => void;
  onLeadCompanyChange: (value: string) => void;
  onLeadContactChange: (value: string) => void;
  onLeadNeedChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function LeadSection({
  leadName,
  leadCompany,
  leadContact,
  leadNeed,
  leadSent,
  onLeadNameChange,
  onLeadCompanyChange,
  onLeadContactChange,
  onLeadNeedChange,
  onSubmit,
}: LeadSectionProps) {
  return (
    <section className="border-y border-white/10 bg-[#0B0C0E] text-white">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:py-32">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#00E5D6]">
            Hazlo realidad
          </p>

          <h2 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-[-0.055em] md:text-6xl">
            Activa WAMA para tu empresa.
          </h2>

          <p className="mt-7 max-w-xl text-lg leading-8 text-[#B7BEC7]">
            Cuéntanos qué proceso quieres ordenar primero. Revisaremos tus
            necesidades, los usuarios y los módulos adecuados para comenzar.
          </p>

          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            <LeadBenefit
              number="01"
              text="Portal configurado con tu empresa"
            />
            <LeadBenefit
              number="02"
              text="Usuarios y permisos definidos"
            />
            <LeadBenefit
              number="03"
              text="Implementación por módulos"
            />
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="grid gap-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <LeadInput
              label="Nombre"
              value={leadName}
              placeholder="Tu nombre"
              onChange={onLeadNameChange}
            />

            <LeadInput
              label="Empresa"
              value={leadCompany}
              placeholder="Nombre de la empresa"
              onChange={onLeadCompanyChange}
            />
          </div>

          <LeadInput
            label="Correo o teléfono"
            value={leadContact}
            placeholder="contacto@empresa.cl"
            onChange={onLeadContactChange}
          />

          <label className="grid gap-2">
            <span className="text-sm font-black text-white">
              ¿Qué quieres gestionar primero?
            </span>

            <textarea
              value={leadNeed}
              onChange={(event) =>
                onLeadNeedChange(event.target.value)
              }
              className="min-h-32 w-full resize-none rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 text-sm text-white outline-none transition placeholder:text-[#747C87] focus:border-[#00E5D6]/70 focus:bg-white/[0.08]"
              placeholder="Ventas, operación, finanzas, reportes u otro proceso."
              required
            />
          </label>

          {leadSent && (
            <div
              role="status"
              className="rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 p-4 text-sm font-bold leading-6 text-white"
            >
              Tus datos quedaron registrados en este navegador. El próximo paso
              será conectar este formulario con contacto@wamaapp.com.
            </div>
          )}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:-translate-y-0.5 hover:bg-[#00E5D6]"
          >
            Solicitar implementación
          </button>

          <p className="text-center text-xs leading-6 text-[#858E99]">
            Por ahora, esta solicitud se almacena localmente en el navegador.
          </p>
        </form>
      </div>
    </section>
  );
}

function LeadBenefit({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[3rem_1fr] gap-4 py-5">
      <span className="text-xs font-black text-[#00E5D6]">
        {number}
      </span>
      <p className="text-sm font-black text-white">{text}</p>
    </div>
  );
}

type LeadInputProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function LeadInput({
  label,
  value,
  placeholder,
  onChange,
}: LeadInputProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-white">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 text-sm text-white outline-none transition placeholder:text-[#747C87] focus:border-[#00E5D6]/70 focus:bg-white/[0.08]"
        placeholder={placeholder}
        required
      />
    </label>
  );
}

function AccessFooter() {
  return (
    <footer className="bg-[#0B0C0E] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xl font-black tracking-[-0.04em]">
            WAMA
          </p>

          <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-[#00E5D6]">
            Warn and Manage
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#AAB2BC]">
          <Link
            href="/"
            className="transition hover:text-[#00E5D6]"
          >
            Inicio
          </Link>

          <Link
            href="/sales-hub"
            className="transition hover:text-[#00E5D6]"
          >
            Sales Hub
          </Link>

          <a
            href="#acceso-demo"
            className="transition hover:text-[#00E5D6]"
          >
            Acceso demo
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs font-semibold text-[#727B86] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 WAMA. Todos los derechos reservados.</p>
          <p>www.wamaapp.com</p>
        </div>
      </div>
    </footer>
  );
}