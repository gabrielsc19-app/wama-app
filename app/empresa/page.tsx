"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  FolderKanban,
  ImagePlus,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import EnterpriseShell from "../../src/components/enterprise/EnterpriseShell";
import MobileInstallButton from "../../src/components/enterprise/MobileInstallButton";
import { SectionCard, StatusPill } from "../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../src/core/portal/portalData";

function daysRemaining(date: string | null | undefined) {
  if (!date) return null;
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000));
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "Administrador";
}

export default function CompanyPage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadEnterprisePortalData()
      .then(setData)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "No pudimos cargar tu portal."),
      );
  }, []);

  const usedSeats = useMemo(
    () => data?.licenses.reduce((sum, item) => sum + item.used_seats, 0) ?? 0,
    [data],
  );
  const capacity = useMemo(
    () => data?.licenses.reduce((sum, item) => sum + item.seat_capacity, 0) ?? 0,
    [data],
  );
  const activeProjects = useMemo(
    () => data?.projects.filter((project) => project.status === "active").length ?? 0,
    [data],
  );
  const trialDays = data ? daysRemaining(data.tenant.trialEndsAt) : null;
  const expense = data?.licenses.find((license) => license.module_key === "expense");
  const setupProgress = data
    ? Math.round(
        ([Boolean(data.tenant.logoUrl), data.projects.length > 0, usedSeats > 1, data.licenses.length > 0]
          .filter(Boolean).length /
          4) *
          100,
      )
    : 0;

  const administratorName = data
    ? firstName(data.tenant.membership.role === "owner" ? "Gabriel" : "Administrador")
    : "Administrador";

  return (
    <EnterpriseShell
      title="Portal gerencial"
      subtitle="El estado operativo y comercial de tu empresa en un solo lugar."
    >
      {error ? (
        <PortalError message={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0B0C0E] p-5 text-white shadow-[0_28px_80px_rgba(11,12,14,.18)] sm:rounded-[2.25rem] sm:p-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#00E5D6]/10 blur-3xl" />
            <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {data.tenant.logoUrl ? (
                  <img
                    src={data.tenant.logoUrl}
                    alt={`Logo de ${data.tenant.name}`}
                    className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 bg-white object-contain p-2 sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#00E5D6] text-2xl font-black text-[#0B0C0E] sm:h-24 sm:w-24">
                    {data.tenant.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">
                    Bienvenido a tu portal
                  </p>
                  <h2 className="mt-2 text-[2rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl">
                    Hola, {administratorName}.
                  </h2>
                  <p className="mt-2 truncate text-lg font-black text-white/95 sm:text-2xl">
                    {data.tenant.name}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#AEB6BF]">
                    Tu empresa está lista para operar. Revisa módulos, licencias, proyectos y
                    accesos desde este centro de control.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <StatusPill>
                      {data.tenant.status === "trial" ? "Prueba gratuita activa" : "Empresa activa"}
                    </StatusPill>
                    {trialDays !== null && (
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#D4D9DE]">
                        {trialDays} días restantes
                      </span>
                    )}
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#D4D9DE]">
                      {data.tenant.code}
                    </span>
                    <MobileInstallButton />
                  </div>
                </div>
              </div>

              <div className="grid min-w-[250px] gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Link
                  href="/expense-hub"
                  className="group flex items-center gap-4 rounded-2xl bg-[#00E5D6] p-4 text-[#0B0C0E] transition hover:-translate-y-0.5"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/60">
                    <Camera className="h-5 w-5" />
                  </span>
                  <span>
                    <strong className="block text-sm">Nueva rendición</strong>
                    <small className="block text-xs font-bold opacity-70">Foto + lectura IA</small>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/empresa/configuracion"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-[#00E5D6]/40"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#00E5D6]">
                    <ImagePlus className="h-5 w-5" />
                  </span>
                  <span>
                    <strong className="block text-sm">Personalizar empresa</strong>
                    <small className="block text-xs text-[#AEB6BF]">Logo y datos</small>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi
              label="Módulos"
              value={String(data.licenses.length)}
              detail="Activos o en prueba"
              icon={WalletCards}
            />
            <Kpi
              label="Usuarios"
              value={`${usedSeats}/${capacity || 0}`}
              detail={`${Math.max(0, capacity - usedSeats)} cupos disponibles`}
              icon={Users}
            />
            <Kpi
              label="Proyectos"
              value={String(activeProjects)}
              detail="No consumen licencias"
              icon={FolderKanban}
            />
            <Kpi
              label="Licencia"
              value={data.tenant.status === "trial" ? "Trial" : "Activa"}
              detail={trialDays !== null ? `${trialDays} días restantes` : "Vigente"}
              icon={BadgeCheck}
            />
            <Kpi
              label="Configuración"
              value={`${setupProgress}%`}
              detail="Progreso inicial"
              icon={Activity}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <SectionCard
              title="Resumen del gerente"
              eyebrow="WAMA AI"
              action={
                <Link href="/empresa/ia" className="text-sm font-black text-[#008F87]">
                  Abrir WAMA AI
                </Link>
              }
            >
              <div className="rounded-2xl bg-[#0B0C0E] p-5 text-white sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#00E5D6] text-[#0B0C0E]">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.16em] text-[#00E5D6]">
                      Informe de inicio
                    </p>
                    <h3 className="mt-2 text-xl font-black">Buenos días, {administratorName}.</h3>
                    <p className="mt-3 text-sm leading-6 text-[#BCC3CA]">
                      {expense
                        ? `Expense Hub está activo con ${expense.used_seats} de ${expense.seat_capacity} usuarios asignados.`
                        : "Todavía no tienes Expense Hub activo."}{" "}
                      Tienes {activeProjects} proyecto{activeProjects === 1 ? "" : "s"} activo
                      {activeProjects === 1 ? "" : "s"} y tu configuración inicial va en {setupProgress}%.
                    </p>
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      <Insight
                        ok={Boolean(data.tenant.logoUrl)}
                        text={data.tenant.logoUrl ? "Logo corporativo configurado" : "Falta cargar el logo corporativo"}
                      />
                      <Insight
                        ok={data.projects.length > 0}
                        text={data.projects.length > 0 ? "Proyectos disponibles" : "Aún no existen proyectos"}
                      />
                      <Insight
                        ok={usedSeats > 1}
                        text={usedSeats > 1 ? "Equipo asignado" : "Invita a tu primer usuario"}
                      />
                      <Insight
                        ok={Boolean(expense)}
                        text={expense ? "Lectura documental disponible" : "Módulo de rendiciones no activo"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Acciones rápidas" eyebrow="Gestión">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <QuickAction href="/expense-hub" icon={ReceiptText} title="Nueva rendición" text="Captura una boleta con OpenAI" />
                <QuickAction href="/empresa/proyectos" icon={FolderKanban} title="Crear proyecto" text="Ordena gastos, obras o contratos" />
                <QuickAction href="/empresa/usuarios" icon={UserPlus} title="Invitar usuario" text="Asigna permisos y licencias" />
                <QuickAction href="/empresa/licencias" icon={KeyRound} title="Gestionar licencias" text="Revisa módulos y cupos" />
              </div>
            </SectionCard>
          </section>

          {expense && (
            <section className="grid overflow-hidden rounded-[1.75rem] border border-[#BCEFEA] bg-[#E8FFFB] lg:grid-cols-[1.15fr_.85fr]">
              <div className="p-5 sm:p-9">
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#008F87]">
                  Módulo solicitado
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">
                  Expense Hub está listo.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#50606A]">
                  Fotografía una boleta o factura. WAMA AI identifica comercio, fecha, monto y
                  datos tributarios para que el usuario solo revise y confirme.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/expense-hub"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0C0E] px-6 py-4 text-sm font-black text-white"
                  >
                    <Camera className="h-4 w-4" />
                    Abrir Expense Hub
                  </Link>
                  <Link
                    href="/empresa/proyectos"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#8BDDD5] bg-white px-6 py-4 text-sm font-black"
                  >
                    <FolderKanban className="h-4 w-4" />
                    Configurar proyectos
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-[#BCEFEA] p-4 sm:p-5 lg:border-l lg:border-t-0">
                <Feature icon={Camera} label="Foto o galería" text="Captura desde celular" />
                <Feature icon={Bot} label="Lectura con IA" text="OpenAI completa los datos" />
                <Feature icon={ShieldCheck} label="Validación" text="Revisión tributaria" />
                <Feature icon={CheckCircle2} label="Aprobación" text="Flujo y trazabilidad" />
              </div>
            </section>
          )}

          <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
            <SectionCard
              title="Licencias y módulos"
              eyebrow="Estado comercial"
              action={
                <Link href="/empresa/licencias" className="text-sm font-black text-[#008F87]">
                  Administrar
                </Link>
              }
            >
              {data.licenses.length ? (
                <div className="divide-y divide-[#E4E8EC]">
                  {data.licenses.map((license) => {
                    const usage = license.seat_capacity
                      ? Math.round((license.used_seats / license.seat_capacity) * 100)
                      : 0;
                    return (
                      <div key={license.module_key} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate font-black">{license.module_name}</h3>
                            <p className="mt-1 text-sm text-[#69717D]">
                              {license.used_seats} de {license.seat_capacity} usuarios ·{" "}
                              {license.license_status}
                            </p>
                          </div>
                          <strong className="shrink-0">{usage}%</strong>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8ECEF]">
                          <div
                            className="h-full rounded-full bg-[#00B8AE]"
                            style={{ width: `${Math.min(usage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={WalletCards}
                  title="No hay módulos activos"
                  text="Activa un módulo para comenzar a trabajar."
                  href="/empresa/licencias"
                  action="Ver módulos"
                />
              )}
            </SectionCard>

            <SectionCard title="Actividad y próximos pasos" eyebrow="Timeline">
              <div className="space-y-4">
                <TimelineItem
                  icon={Building2}
                  title="Empresa creada"
                  text={`${data.tenant.name} ya tiene un portal privado.`}
                  done
                />
                <TimelineItem
                  icon={WalletCards}
                  title="Módulo activado"
                  text={
                    data.licenses.length
                      ? `${data.licenses.length} módulo${data.licenses.length === 1 ? "" : "s"} disponible${data.licenses.length === 1 ? "" : "s"}.`
                      : "Activa tu primer módulo."
                  }
                  done={data.licenses.length > 0}
                />
                <TimelineItem
                  icon={FolderKanban}
                  title="Proyecto inicial"
                  text={
                    data.projects.length
                      ? `${data.projects.length} proyecto${data.projects.length === 1 ? "" : "s"} creado${data.projects.length === 1 ? "" : "s"}.`
                      : "Crea un proyecto para ordenar la operación."
                  }
                  done={data.projects.length > 0}
                />
                <TimelineItem
                  icon={Users}
                  title="Equipo"
                  text={usedSeats > 1 ? `${usedSeats} usuarios asignados.` : "Invita y asigna usuarios."}
                  done={usedSeats > 1}
                />
              </div>
            </SectionCard>
          </section>

          <SectionCard
            title="Proyectos de tu empresa"
            eyebrow="Organización"
            action={
              <Link href="/empresa/proyectos" className="text-sm font-black text-[#008F87]">
                Gestionar proyectos
              </Link>
            }
          >
            {data.projects.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {data.projects.slice(0, 6).map((project) => (
                  <Link
                    key={project.id}
                    href="/empresa/proyectos"
                    className="rounded-2xl border border-[#E0E4E8] p-4 transition hover:border-[#00B8AE]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FFFB] text-[#008F87]">
                        <FolderKanban className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black">{project.name}</p>
                        <p className="text-xs text-[#69717D]">
                          {project.code} · {project.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="Todavía no tienes proyectos"
                text="Puedes trabajar sin proyectos o crearlos para ordenar gastos, sedes, contratos u obras."
                href="/empresa/proyectos"
                action="Crear proyecto"
              />
            )}
          </SectionCard>

          <p className="flex items-center justify-center gap-2 text-center text-xs text-[#7B838D]">
            <CalendarDays className="h-4 w-4" />
            Tu empresa autogestiona su operación; WAMA controla la vigencia comercial de módulos y licencias.
          </p>
        </div>
      )}
    </EnterpriseShell>
  );
}

function Kpi({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <article className="rounded-2xl border border-[#DCE1E6] bg-white p-5 shadow-[0_12px_35px_rgba(11,12,14,.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#69717D]">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-[-.05em]">{value}</p>
          <p className="mt-1 text-xs leading-5 text-[#69717D]">{detail}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E8FFFB] text-[#008F87]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function Insight({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00E5D6]" />
      ) : (
        <Zap className="h-4 w-4 shrink-0 text-[#FFB84D]" />
      )}
      <span>{text}</span>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  text,
}: {
  href: string;
  icon: typeof ReceiptText;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-[#E0E4E8] p-4 transition hover:border-[#00B8AE] hover:bg-[#F9FFFE]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E8FFFB] text-[#008F87]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{title}</strong>
        <small className="block truncate text-[#69717D]">{text}</small>
      </span>
      <ArrowRight className="h-4 w-4 text-[#69717D] transition group-hover:translate-x-1" />
    </Link>
  );
}

function Feature({ icon: Icon, label, text }: { icon: typeof Camera; label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <Icon className="h-5 w-5 text-[#008F87]" />
      <p className="mt-3 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs text-[#69717D]">{text}</p>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  text,
  done,
}: {
  icon: typeof Building2;
  title: string;
  text: string;
  done: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          done ? "bg-[#DFFFFA] text-[#008F87]" : "bg-[#F0F2F4] text-[#727B85]"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 border-b border-[#E8ECEF] pb-4 last:border-b-0">
        <div className="flex items-center justify-between gap-3">
          <p className="font-black">{title}</p>
          <span className={`text-xs font-black ${done ? "text-[#008F87]" : "text-[#9A6200]"}`}>
            {done ? "Listo" : "Pendiente"}
          </span>
        </div>
        <p className="mt-1 text-sm leading-5 text-[#69717D]">{text}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  href,
  action,
}: {
  icon: typeof FolderKanban;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F6F8F9] p-6 text-center">
      <Icon className="mx-auto h-8 w-8 text-[#008F87]" />
      <p className="mt-3 font-black">{title}</p>
      <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-[#69717D]">{text}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-full bg-[#0B0C0E] px-5 py-3 text-sm font-black text-white"
      >
        {action}
      </Link>
    </div>
  );
}

function PortalError({ message }: { message: string }) {
  return (
    <div className="rounded-[2rem] border border-amber-200 bg-white p-8 text-center">
      <Building2 className="mx-auto h-10 w-10 text-[#008F87]" />
      <h2 className="mt-4 text-2xl font-black">No pudimos abrir tu empresa</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#69717D]">{message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/login" className="rounded-full border px-5 py-3 text-sm font-black">
          Volver a ingresar
        </Link>
        <Link href="/trial" className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black">
          Activar prueba
        </Link>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-40 animate-pulse rounded-3xl bg-white" />
      ))}
    </div>
  );
}
