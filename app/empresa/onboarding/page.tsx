"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ImagePlus, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getMyTenants, updateTenant } from "../../../src/core/tenant";
import { getMyLicensingSummary } from "../../../src/core/licensing/licensingService";
import { trialDaysRemaining } from "../../../src/lib/trialDisplay";

export default function EnterpriseOnboardingPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [moduleName, setModuleName] = useState("Expense Hub");
  const [used, setUsed] = useState(1);
  const [capacity, setCapacity] = useState(10);
  const [days, setDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) { router.replace("/login"); return; }
      setEmail(auth.session.user.email || "");
      setOwnerName(String(auth.session.user.user_metadata?.full_name || auth.session.user.email?.split("@")[0] || "Administrador"));
      try {
        const [tenants, licenses] = await Promise.all([getMyTenants(), getMyLicensingSummary()]);
        const tenant = tenants[0];
        if (!tenant) throw new Error("No encontramos una empresa asociada a este acceso.");
        if (tenant.onboardingCompleted) { router.replace("/empresa"); return; }
        const activeLicense = licenses[0];
        setTenantId(tenant.id); setName(tenant.name); setLogoUrl(tenant.logoUrl);
        setDays(trialDaysRemaining(tenant.trialEndsAt, tenant.timezone));
        if (activeLicense) {
          setModuleName(activeLicense.module_key === "sales" ? "Sales Hub" : activeLicense.module_key === "expense" ? "Expense Hub" : activeLicense.module_name);
          setUsed(activeLicense.used_seats); setCapacity(activeLicense.seat_capacity);
        }
      } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos cargar la configuración inicial."); }
      finally { setLoading(false); }
    })();
  }, [router]);

  function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) { setError("El logo debe pesar menos de 1 MB."); return; }
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) { setError("Usa un logo PNG, JPG o WEBP."); return; }
    const reader = new FileReader(); reader.onload = () => setLogoUrl(String(reader.result || "")); reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (!logoUrl) { setError("Sube el logo de tu empresa para continuar."); return; }
    setSaving(true);
    try {
      await updateTenant(tenantId, { name, logoUrl, onboardingCompleted: true });
      router.replace("/empresa"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos guardar la identidad de la empresa."); }
    finally { setSaving(false); }
  }

  const available = useMemo(() => Math.max(0, capacity - used), [capacity, used]);
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#F5F6F7]"><p className="font-black">Preparando tu portal WAMA…</p></main>;

  return <main className="min-h-screen bg-[#F5F6F7] px-4 py-8 text-[#0B0C0E] sm:px-8 lg:py-12">
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#00E5D6] text-xl font-black">W</span><div><strong className="block">WAMA</strong><span className="text-xs font-bold text-[#69717D]">Configuración inicial</span></div></div>
      <div className="grid overflow-hidden rounded-[2rem] border border-[#DCE1E6] bg-white shadow-[0_30px_90px_rgba(11,12,14,.1)] lg:grid-cols-[.82fr_1.18fr]">
        <aside className="bg-[#0B0C0E] p-7 text-white sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">{moduleName}</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-.05em]">Prepara el portal de tu empresa.</h1>
          <p className="mt-4 text-sm leading-7 text-[#B8C0C8]">Esta identidad se mostrará en el portal, las rendiciones, los usuarios y las licencias.</p>
          <div className="mt-8 space-y-3">
            <Summary icon={<ShieldCheck />} label="Administrador" value={email || "Correo del trial"} />
            <Summary icon={<Users />} label="Licencias utilizadas" value={`${used} de ${capacity} · ${available} disponibles`} />
            <Summary icon={<CheckCircle2 />} label="Prueba gratuita" value={days === null ? "15 días" : `${days} días restantes`} />
          </div>
        </aside>
        <form onSubmit={submit} className="p-7 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">Paso 1 de 1</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Identidad de la empresa</h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-[180px_1fr]">
            <label className="flex h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#B8C1C8] bg-[#F7F9FA] text-center">
              {logoUrl ? <img src={logoUrl} alt="Logo de empresa" className="h-full w-full object-contain p-4" /> : <><ImagePlus className="h-8 w-8 text-[#008F87]"/><strong className="mt-3 text-sm">Subir logo</strong><span className="mt-1 text-xs text-[#69717D]">PNG, JPG o WEBP</span></>}
              <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo}/>
            </label>
            <div className="space-y-4">
              <label className="grid gap-2 text-sm font-black">Nombre de la empresa<input required minLength={2} value={name} onChange={(event)=>setName(event.target.value)} className="rounded-2xl border border-[#DCE1E6] px-4 py-3 font-medium outline-none focus:border-[#00B8AE]"/></label>
              <label className="grid gap-2 text-sm font-black">Administrador principal<input readOnly value={ownerName} className="rounded-2xl border border-[#DCE1E6] bg-[#F5F6F7] px-4 py-3 font-medium"/></label>
              <label className="grid gap-2 text-sm font-black">Correo administrador<input readOnly value={email} className="rounded-2xl border border-[#DCE1E6] bg-[#F5F6F7] px-4 py-3 font-medium"/></label>
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-[#E8FFFB] p-4 text-sm leading-6 text-[#245B57]"><strong className="text-[#0B0C0E]">Tu administrador ya ocupa 1 licencia.</strong> Podrás invitar hasta {available} usuarios adicionales desde la sección Usuarios.</div>
          {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
          <button disabled={saving || !tenantId} className="mt-7 w-full rounded-full bg-[#00E5D6] px-6 py-4 text-sm font-black disabled:opacity-50">{saving ? "Guardando identidad…" : "Guardar y entrar al portal"}</button>
        </form>
      </div>
    </div>
  </main>;
}

function Summary({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) { return <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.05] p-4"><span className="text-[#00E5D6] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#8F99A3]">{label}</p><p className="mt-1 break-words text-sm font-black">{value}</p></div></div>; }
