"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import EnterpriseShell from "../../src/components/enterprise/EnterpriseShell";
import MobileInstallButton from "../../src/components/enterprise/MobileInstallButton";
import { SectionCard, StatCard, StatusPill } from "../../src/components/enterprise/PortalUI";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../src/core/portal/portalData";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function CompanyPage() {
  const router = useRouter();
  const [data, setData] = useState<EnterprisePortalData | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void (async () => {
      const {data:auth} = await supabase.auth.getSession();
      if (!auth.session) { router.replace("/login"); return; }
      try { setData(await loadEnterprisePortalData()); }
      catch (reason) { setLoadError(reason instanceof Error ? reason.message : "No fue posible cargar tu empresa."); }
    })();
  }, [router]);

  const usedSeats = useMemo(() => data?.licenses.reduce((sum, item) => sum + item.used_seats, 0) ?? 0, [data]);
  const capacity = useMemo(() => data?.licenses.reduce((sum, item) => sum + item.seat_capacity, 0) ?? 0, [data]);
  const activeProjects = useMemo(() => data?.projects.filter((project) => project.status === "active").length ?? 0, [data]);
  const commercialLicenses = useMemo(() => data?.licenses.filter((item) => item.module_key === "expense" || item.module_key === "sales") ?? [], [data]);

  return (
    <EnterpriseShell title="Mi empresa" subtitle="Vista general del portal, licencias y estado de la organización.">
      {loadError ? <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-7 text-center"><h2 className="text-xl font-black">No pudimos abrir tu empresa</h2><p className="mt-3 text-sm leading-6 text-[#69717D]">{loadError}</p><button onClick={async()=>{await supabase.auth.signOut();router.replace("/login");}} className="mt-5 rounded-full bg-[#00E5D6] px-6 py-3 text-sm font-black text-[#0B0C0E]">Volver a iniciar sesión</button></div> : !data ? <Loading /> : <div className="space-y-6 sm:space-y-8">
        <section id="mi-empresa" className="scroll-mt-28 overflow-hidden rounded-[2rem] bg-[#0B0C0E] p-6 text-white shadow-[0_28px_80px_rgba(11,12,14,.16)] sm:p-10">
          <div className="grid gap-8 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white text-3xl font-black text-[#0B0C0E] ring-1 ring-white/15 sm:h-32 sm:w-32">
                {data.tenant.logoUrl ? (
                  <img src={data.tenant.logoUrl} alt={`Logo de ${data.tenant.name}`} className="h-full w-full object-contain bg-white p-2" />
                ) : (
                  data.tenant.name.slice(0, 2).toUpperCase()
                )}
              </div>
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
          <StatCard label="Módulos activos" value={`${commercialLicenses.length}`} detail="Expense Hub y Sales Hub" trend="Contratación independiente" />
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
          <div id="modulos" className="scroll-mt-28"><SectionCard title="Tus módulos WAMA" eyebrow="Portal modular" action={<Link href="/empresa/usuarios" className="text-sm font-black text-[#008F87]">Administrar usuarios</Link>}>
            <div className="grid gap-4 md:grid-cols-2">
              {(["sales", "expense"] as const).map((moduleKey) => {
                const license = commercialLicenses.find((item) => item.module_key === moduleKey);
                const title = moduleKey === "sales" ? "Sales Hub" : "Expense Hub";
                const href = moduleKey === "sales" ? "/sales-hub/crm" : "/expense-hub";

                return license ? (
                  <div key={moduleKey} className="rounded-3xl border border-[#DCE1E6] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#008F87]">{license.license_status === "trial" ? "Prueba activa" : license.license_status === "active" ? "Plan pagado" : "Requiere atención"}</p><h3 className="mt-1 text-xl font-black">{title}</h3></div>
                      <StatusPill>{license.license_status === "trial" ? `${license.trial_days_remaining} días` : license.license_status}</StatusPill>
                    </div>
                    <p className="mt-4 text-sm text-[#69717D]">{license.used_seats} de {license.seat_capacity} licencias utilizadas · {license.available_seats} disponibles</p>
                    <Link href={href} className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] shadow-[0_10px_24px_rgba(0,229,214,.22)] transition hover:bg-[#00CFC2]">Ingresar a {title}</Link>
                  </div>
                ) : (
                  <div key={moduleKey} className="rounded-3xl border border-dashed border-[#BFC6CD] bg-[#F7F9FA] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#69717D]">Disponible</p><h3 className="mt-1 text-xl font-black">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#69717D]">Activa 15 días gratis y recibe 10 licencias propias para este módulo.</p>
                    <Link href={`/trial?module=${moduleKey}`} className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] shadow-[0_10px_24px_rgba(0,229,214,.22)] transition hover:bg-[#00CFC2]">Activar prueba</Link>
                  </div>
                );
              })}
            </div>
            <Link href="/empresa/usuarios" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#DCE1E6] bg-white px-5 py-4 text-sm font-black text-[#0B0C0E]">Administrar usuarios y asignación por módulo</Link>
          </SectionCard></div>

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
