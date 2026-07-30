"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Building2, ImagePlus, Save } from "lucide-react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { getMyTenants, updateTenant } from "../../../src/core/tenant";

export default function CompanySettingsPage() {
  const [tenantId,setTenantId]=useState("");
  const [name,setName]=useState("");
  const [logoUrl,setLogoUrl]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{ void getMyTenants().then((tenants)=>{const tenant=tenants[0];if(!tenant)return;setTenantId(tenant.id);setName(tenant.name);setLogoUrl(tenant.logoUrl);}); },[]);

  function selectLogo(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]; if(!file)return;
    if(file.size>1_000_000){setMessage("El logo debe pesar menos de 1 MB.");return;}
    const reader=new FileReader(); reader.onload=()=>setLogoUrl(String(reader.result||"")); reader.readAsDataURL(file);
  }

  async function save(event:FormEvent){event.preventDefault();if(!tenantId)return;setSaving(true);setMessage("");try{await updateTenant(tenantId,{name,logoUrl});setMessage("La información de tu empresa fue actualizada.");}catch(reason){setMessage(reason instanceof Error?reason.message:"No fue posible guardar los cambios.");}finally{setSaving(false);}}

  return <EnterpriseShell title="Configuración de empresa" subtitle="Personaliza el portal con tu nombre y logo corporativo."><form onSubmit={save} className="mx-auto max-w-3xl rounded-[2rem] border border-[#DCE1E6] bg-white p-6 sm:p-9"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DFFFFA] text-[#008F87]"><Building2 className="h-7 w-7"/></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">Identidad de tu portal</p><h2 className="text-2xl font-black">Tu empresa en WAMA</h2></div></div><div className="mt-8 grid gap-6 sm:grid-cols-[180px_1fr]"><label className="group flex h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#B8C1C8] bg-[#F7F9FA] text-center">{logoUrl?<img src={logoUrl} alt="Logo de empresa" className="h-full w-full object-contain p-4"/>:<><ImagePlus className="h-8 w-8 text-[#008F87]"/><strong className="mt-3 text-sm">Subir logo</strong><span className="mt-1 text-xs text-[#69717D]">PNG, JPG o WEBP</span></>}<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo}/></label><div className="space-y-5"><label className="grid gap-2 text-sm font-black">Nombre de la empresa<input required value={name} onChange={e=>setName(e.target.value)} className="rounded-2xl border border-[#DCE1E6] px-4 py-3 font-medium outline-none focus:border-[#00B8AE]"/></label><div className="rounded-2xl bg-[#F4F7F8] p-4 text-sm leading-6 text-[#69717D]">El logo se mostrará en la bienvenida y en el portal de tu organización. Para mantener el rendimiento, usa una imagen liviana y con fondo transparente.</div></div></div>{message&&<div className="mt-6 rounded-2xl bg-[#DFFFFA] p-4 text-sm font-bold text-[#08645F]">{message}</div>}<button disabled={saving||!tenantId} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-6 py-4 text-sm font-black disabled:opacity-50"><Save className="h-4 w-4"/>{saving?"Guardando…":"Guardar personalización"}</button></form></EnterpriseShell>;
}
