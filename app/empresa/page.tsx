"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import EnterpriseShell from "../../src/components/enterprise/EnterpriseShell";
import MobileInstallButton from "../../src/components/enterprise/MobileInstallButton";
import { SectionCard, StatCard, StatusPill } from "../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../src/core/portal/portalData";

export default function CompanyPage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);

  useEffect(() => { void loadEnterprisePortalData().then(setData); }, []);

  const usedSeats = useMemo(() => data?.licenses.reduce((sum, item) => sum + item.used_seats, 0) ?? 0, [data]);
  const capacity = useMemo(() => data?.licenses.reduce((sum, item) => sum + item.seat_capacity, 0) ?? 0, [data]);
  const activeProjects = useMemo(() => data?.projects.filter((project) => project.status === "active").length ?? 0, [data]);

  return (
    <EnterpriseShell title="Mi empresa" subtitle="Vista general del portal, licencias y estado de la organización.">
      {!data ? <Loading /> : <div className="space-y-6 sm:space-y-8">
        <section className="overflow-hidden rounded-[2rem] bg-[#0B0C0E] p-6 text-white shadow-[0_28px_80px_rgba(11,12,14,.16)] sm:p-10">
          <div className="grid gap-8 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#00E5D6] text-2xl font-black text-[#0B0C0E]">{data.tenant.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">Portal empresarial</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">{data.tenant.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#AEB6BF]">Controla usuarios, módulos, proyectos, seguridad e inteligencia empresarial desde un solo lugar.</p>
                <div className="mt-4 flex flex-wrap gap-2"><StatusPill>{data.tenant.status === "trial" ? "Trial activo" : "Activo"}</StatusPill><span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#C4C7CC]">{data.tenant.code}</span><span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#C4C7CC]">Rol: {data.tenant.membership.role}</span><MobileInstallButton /></div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:min-w-[260px]">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#00E5D6_0deg,#00E5D6_352deg,rgba(255,255,255,.12)_352deg)]"><div className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-[#151719] text-3xl font-black">98</div></div>
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#00E5D6]">Trust Score</p><p className="mt-1 font-black">Nivel Enterprise</p><p className="mt-1 text-xs text-[#C4C7CC]">Protección excelente</p></div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Módulos activos" value={`${data.licenses.length}`} detail="Licencias contratadas" trend="+1 este trimestre" />
          <StatCard label="Usuarios asignados" value={`${usedSeats}`} detail={`${capacity - usedSeats} cupos disponibles`} trend="Capacidad saludable" />
          <StatCard label="Proyectos activos" value={`${activeProjects}`} detail="Uso opcional por empresa" trend="Actividad estable" />
          <StatCard label="Seguridad" value="100%" detail="Aislamiento multiempresa activo" trend="Sin alertas críticas" />
        </div>

        <Link href="/empresa/ia" className="group grid gap-5 overflow-hidden rounded-[2rem] bg-[#DFFFFA] p-6 transition hover:-translate-y-0.5 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B0C0E] text-[#00E5D6]"><Bot className="h-7 w-7" /></span>
          <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#008F87]">WAMA AI</p><h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Buenos días. Tu empresa está operando con normalidad.</h2><p className="mt-2 text-sm leading-6 text-[#50606A]">Tienes 13 cupos disponibles, ningún riesgo crítico y 3 usuarios que conviene revisar por baja actividad.</p></div>
          <span className="inline-flex items-center gap-2 font-black text-[#008F87]">Ver recomendaciones <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></span>
        </Link>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <SectionCard title="Módulos y consumo" eyebrow="Licenciamiento" action={<Link href="/empresa/licencias" className="text-sm font-black text-[#008F87]">Administrar</Link>}>
            <div className="divide-y divide-[#E4E8EC]">{data.licenses.map((license) => { const use = Math.round((license.used_seats / license.seat_capacity) * 100); return <div key={license.module_key} className="py-5 first:pt-0 last:pb-0"><div className="flex items-center justify-between gap-4"><div><h3 className="font-black">{license.module_name}</h3><p className="text-sm text-[#69717D]">{license.used_seats} de {license.seat_capacity} licencias utilizadas</p></div><strong>{use}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8ECEF]"><div className="h-full rounded-full bg-[#00B8AE] transition-all" style={{ width: `${Math.min(use, 100)}%` }} /></div></div>; })}</div>
            <Link href="/empresa/licencias" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B0C0E] px-5 py-4 text-sm font-black text-white">+ Comprar licencias</Link>
          </SectionCard>

          <SectionCard title="Estado de confianza" eyebrow="WAMA Trust" action={<Link href="/empresa/trust" className="text-sm font-black text-[#008F87]">Ver centro</Link>}>
            <div className="space-y-4">{[["Aislamiento de datos", "100%"], ["Políticas RLS", "Activo"], ["Auditoría", "Habilitada"], ["Sesión protegida", "98%"]].map(([item, value]) => <div key={item} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-[#00AFA5]" /><span className="flex-1 text-sm font-bold">{item}</span><span className="text-xs font-black text-[#008F87]">{value}</span></div>)}</div>
            <div className="mt-6 rounded-2xl bg-[#F0FFFC] p-4"><div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-[#008F87]" /><div><p className="font-black">Protección multiempresa activa</p><p className="text-xs leading-5 text-[#69717D]">Cada dato está asociado a una empresa y protegido por permisos.</p></div></div></div>
          </SectionCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">{[
          ["Usuarios", "Asigna módulos y controla el consumo individual.", "/empresa/usuarios"],
          ["Proyectos", "Organiza la operación por iniciativas, sedes o contratos.", "/empresa/proyectos"],
          ["Facturación", "Revisa el plan y el cobro mensual estimado.", "/empresa/facturacion"],
        ].map(([title, text, href]) => <Link key={href} href={href} className="group rounded-3xl border border-[#DCE1E6] bg-white p-6 transition hover:-translate-y-1 hover:border-[#00B8AE]"><h3 className="text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#69717D]">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#008F87]">Abrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}</div>

        <div className="flex items-center justify-center gap-2 text-center text-xs text-[#7B838D]"><TrendingUp className="h-4 w-4" /> Portal optimizado para escritorio, tablet y aplicación móvil.</div>
        {data.source === "demo" && <p className="text-center text-xs text-[#7B838D]">Mostrando datos demostrativos hasta que exista una sesión Supabase con empresa asociada.</p>}
      </div>}
    </EnterpriseShell>
  );
}

function Loading() { return <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map((i)=><div key={i} className="h-40 animate-pulse rounded-3xl bg-white" />)}</div>; }
