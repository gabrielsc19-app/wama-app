"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarDays, Camera, CheckCircle2, FolderKanban, ImagePlus, ReceiptText, Users } from "lucide-react";
import EnterpriseShell from "../../src/components/enterprise/EnterpriseShell";
import MobileInstallButton from "../../src/components/enterprise/MobileInstallButton";
import { SectionCard, StatCard, StatusPill } from "../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../src/core/portal/portalData";

function daysRemaining(date: string | null | undefined) {
  if (!date) return null;
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000));
}

export default function CompanyPage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadEnterprisePortalData().then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : "No pudimos cargar tu portal."));
  }, []);

  const usedSeats = useMemo(() => data?.licenses.reduce((sum, item) => sum + item.used_seats, 0) ?? 0, [data]);
  const capacity = useMemo(() => data?.licenses.reduce((sum, item) => sum + item.seat_capacity, 0) ?? 0, [data]);
  const activeProjects = useMemo(() => data?.projects.filter((project) => project.status === "active").length ?? 0, [data]);
  const trialDays = data ? daysRemaining(data.tenant.trialEndsAt) : null;
  const expense = data?.licenses.find((license) => license.module_key === "expense");

  return (
    <EnterpriseShell title="Mi empresa" subtitle="Tu portal, módulos, licencias, usuarios y proyectos en un solo lugar.">
      {error ? <PortalError message={error} /> : !data ? <Loading /> : <div className="space-y-6 sm:space-y-8">
        <section className="overflow-hidden rounded-[2rem] bg-[#0B0C0E] p-6 text-white shadow-[0_28px_80px_rgba(11,12,14,.16)] sm:p-10">
          <div className="grid gap-8 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {data.tenant.logoUrl ? (
                <img src={data.tenant.logoUrl} alt={`Logo de ${data.tenant.name}`} className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 bg-white object-contain p-2" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#00E5D6] text-2xl font-black text-[#0B0C0E]">{data.tenant.name.slice(0, 2).toUpperCase()}</div>
              )}
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">Bienvenido a tu portal</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">{data.tenant.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#AEB6BF]">Desde aquí puedes probar tu módulo, administrar las licencias de tu empresa, crear proyectos e invitar a tu equipo.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill>{data.tenant.status === "trial" ? "Prueba gratuita activa" : "Cuenta activa"}</StatusPill>
                  {trialDays !== null && <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#C4C7CC]">{trialDays} días disponibles</span>}
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#C4C7CC]">Rol: {data.tenant.membership.role}</span>
                  <MobileInstallButton />
                </div>
              </div>
            </div>
            <Link href="/empresa/configuracion" className="group flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-5 transition hover:border-[#00E5D6]/40">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#00E5D6]"><ImagePlus className="h-6 w-6" /></span>
              <span><strong className="block">Personaliza tu empresa</strong><small className="mt-1 block text-[#AEB6BF]">Sube tu logo y completa tus datos</small></span>
              <ArrowRight className="ml-auto h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {expense && (
          <section className="grid overflow-hidden rounded-[2rem] border border-[#BCEFEA] bg-[#E8FFFB] lg:grid-cols-[1.15fr_.85fr]">
            <div className="p-6 sm:p-9">
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#008F87]">Tu módulo de prueba</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">Expense Hub está listo para usar.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#50606A]">Toma una foto de una boleta o factura, deja que OpenAI extraiga los datos y envía la rendición asociada a un proyecto y centro de costo.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/expense-hub" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0C0E] px-6 py-4 text-sm font-black text-white"><Camera className="h-4 w-4" />Abrir Expense Hub</Link>
                <Link href="/empresa/proyectos" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#8BDDD5] bg-white px-6 py-4 text-sm font-black"><FolderKanban className="h-4 w-4" />Configurar proyectos</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-[#BCEFEA] p-5 lg:border-l lg:border-t-0">
              {[{ icon: Camera, label: "Foto o galería", text: "Captura desde celular" }, { icon: ReceiptText, label: "Lectura con IA", text: "OpenAI completa los datos" }, { icon: FolderKanban, label: "Proyecto", text: "Asocia cada gasto" }, { icon: CheckCircle2, label: "Aprobación", text: "Controla el flujo" }].map(({ icon: Icon, label, text }) => <div key={label} className="rounded-2xl bg-white p-4"><Icon className="h-5 w-5 text-[#008F87]" /><p className="mt-3 text-sm font-black">{label}</p><p className="mt-1 text-xs text-[#69717D]">{text}</p></div>)}
            </div>
          </section>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Módulos activos" value={`${data.licenses.length}`} detail="Contratados o en prueba" trend="Gestionables por empresa" />
          <StatCard label="Usuarios asignados" value={`${usedSeats}`} detail={`${Math.max(0, capacity - usedSeats)} cupos disponibles`} trend="Licencias por módulo" />
          <StatCard label="Proyectos activos" value={`${activeProjects}`} detail="No consumen licencias" trend="Crea todos los necesarios" />
          <StatCard label="Estado" value={data.tenant.status === "trial" ? "Trial" : "Activo"} detail={trialDays !== null ? `${trialDays} días restantes` : "Suscripción vigente"} trend="Controlado por WAMA" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <SectionCard title="Estado de tus licencias" eyebrow="Módulos" action={<Link href="/empresa/licencias" className="text-sm font-black text-[#008F87]">Administrar</Link>}>
            <div className="divide-y divide-[#E4E8EC]">{data.licenses.map((license) => { const use = license.seat_capacity ? Math.round((license.used_seats / license.seat_capacity) * 100) : 0; return <div key={license.module_key} className="py-5 first:pt-0 last:pb-0"><div className="flex items-center justify-between gap-4"><div><h3 className="font-black">{license.module_name}</h3><p className="text-sm text-[#69717D]">{license.used_seats} de {license.seat_capacity} usuarios asignados · {license.license_status}</p></div><strong>{use}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8ECEF]"><div className="h-full rounded-full bg-[#00B8AE]" style={{ width: `${Math.min(use, 100)}%` }} /></div></div>; })}</div>
          </SectionCard>

          <SectionCard title="Configuración recomendada" eyebrow="Primeros pasos">
            <div className="space-y-3">
              <SetupLink href="/empresa/configuracion" icon={Building2} title="Completa tu empresa" text="Logo e información corporativa" done={Boolean(data.tenant.logoUrl)} />
              <SetupLink href="/empresa/proyectos" icon={FolderKanban} title="Crea tu primer proyecto" text="Opcional y sin consumo de licencias" done={data.projects.length > 0} />
              <SetupLink href="/empresa/usuarios" icon={Users} title="Invita a tu equipo" text="Asigna usuarios al módulo" done={usedSeats > 1} />
              <SetupLink href="/expense-hub" icon={ReceiptText} title="Registra el primer gasto" text="Foto + OpenAI + aprobación" done={false} />
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Proyectos de tu empresa" eyebrow="Organización" action={<Link href="/empresa/proyectos" className="text-sm font-black text-[#008F87]">Gestionar proyectos</Link>}>
          {data.projects.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.projects.slice(0, 6).map((project) => <Link key={project.id} href="/empresa/proyectos" className="rounded-2xl border border-[#E0E4E8] p-4 transition hover:border-[#00B8AE]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FFFB] text-[#008F87]"><FolderKanban className="h-5 w-5" /></span><div><p className="font-black">{project.name}</p><p className="text-xs text-[#69717D]">{project.code} · {project.status}</p></div></div></Link>)}</div> : <div className="rounded-2xl bg-[#F6F8F9] p-6 text-center"><FolderKanban className="mx-auto h-8 w-8 text-[#008F87]" /><p className="mt-3 font-black">Todavía no tienes proyectos</p><p className="mt-1 text-sm text-[#69717D]">Puedes trabajar sin proyectos o crearlos para ordenar gastos, sedes, contratos u obras.</p><Link href="/empresa/proyectos" className="mt-4 inline-flex rounded-full bg-[#0B0C0E] px-5 py-3 text-sm font-black text-white">Crear proyecto</Link></div>}
        </SectionCard>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-[#7B838D]"><CalendarDays className="h-4 w-4" />Tu empresa administra su operación; WAMA controla la vigencia comercial de módulos y licencias.</p>
      </div>}
    </EnterpriseShell>
  );
}

function SetupLink({ href, icon: Icon, title, text, done }: { href: string; icon: typeof Building2; title: string; text: string; done: boolean }) {
  return <Link href={href} className="flex items-center gap-3 rounded-2xl border border-[#E0E4E8] p-4 transition hover:border-[#00B8AE]"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${done ? "bg-[#DFFFFA] text-[#008F87]" : "bg-[#F0F2F4] text-[#59616B]"}`}>{done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><small className="block truncate text-[#69717D]">{text}</small></span><ArrowRight className="h-4 w-4 text-[#69717D]" /></Link>;
}

function PortalError({ message }: { message: string }) { return <div className="rounded-[2rem] border border-amber-200 bg-white p-8 text-center"><Building2 className="mx-auto h-10 w-10 text-[#008F87]" /><h2 className="mt-4 text-2xl font-black">No pudimos abrir tu empresa</h2><p className="mx-auto mt-2 max-w-xl text-sm text-[#69717D]">{message}</p><div className="mt-6 flex justify-center gap-3"><Link href="/login" className="rounded-full border px-5 py-3 text-sm font-black">Volver a ingresar</Link><Link href="/trial" className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black">Activar prueba</Link></div></div>; }
function Loading() { return <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map((i)=><div key={i} className="h-40 animate-pulse rounded-3xl bg-white" />)}</div>; }
