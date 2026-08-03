"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { EnterpriseShell } from "../../../src/components/enterprise/EnterpriseShell";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../../src/lib/enterprisePortal";
import { updateTenant } from "../../../src/core/tenant/TenantService";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function normalizeWebsite(value: string) {
  const clean = value.trim();
  if (!clean) return null;
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

export default function ProfilePage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadEnterprisePortalData().then((portal) => {
      setData(portal);
      setName(portal.tenant.name);
      setWebsite(portal.tenant.website || "");
      setLogo(portal.tenant.logoUrl || "");
    });
  }, []);

  function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    setMessage("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen en formato PNG, JPG, WEBP o SVG.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("La imagen es demasiado pesada. El máximo permitido es 2 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result || ""));
    reader.onerror = () => setError("No pudimos leer la imagen seleccionada.");
    reader.readAsDataURL(file);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!data || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const normalizedWebsite = normalizeWebsite(website);
      await updateTenant(data.tenant.id, {
        name,
        website: normalizedWebsite,
        logoUrl: logo || null,
      });
      setWebsite(normalizedWebsite || "");
      setMessage("Datos de la empresa actualizados correctamente.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EnterpriseShell title="Mi empresa" subtitle="Identidad, datos generales y preferencias de la organización.">
      {!data ? (
        <div className="h-64 animate-pulse rounded-3xl bg-white" />
      ) : (
        <form onSubmit={save} className="mx-auto max-w-4xl rounded-[2rem] border border-[#DCE1E6] bg-white p-7 sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-3xl border bg-white p-2 text-3xl font-black">
              {logo ? <img src={logo} alt="Logo de la empresa" className="h-full w-full object-contain" /> : name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#008F87]">Identidad empresarial</p>
              <h2 className="mt-2 text-3xl font-black">{name || data.tenant.name}</h2>
              <p className="mt-2 text-sm text-[#69717D]">Código interno: {data.tenant.code}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6">
            <label className="grid gap-2 text-sm font-black">
              Nombre de la empresa
              <input value={name} onChange={(event) => setName(event.target.value)} required className="rounded-2xl border p-4 font-bold" />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Sitio web de la empresa <span className="font-normal text-[#69717D]">(opcional)</span>
              <input type="text" inputMode="url" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="www.tuempresa.cl" className="rounded-2xl border p-4 font-bold" />
              <span className="text-xs font-normal text-[#69717D]">Ingresa la página oficial de tu empresa, si tiene una.</span>
            </label>

            <section className="rounded-3xl border border-[#DCE1E6] bg-[#F8FAFA] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-black">Logo de la empresa</h3>
                  <p className="mt-1 text-xs text-[#69717D]">Carga una imagen PNG, JPG, WEBP o SVG de hasta 2 MB.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={selectLogo} className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl bg-black px-4 py-3 text-sm font-black text-white">
                    {logo ? "Cambiar imagen" : "Cargar imagen"}
                  </button>
                  {logo && (
                    <button type="button" onClick={() => { setLogo(""); if (fileRef.current) fileRef.current.value = ""; }} className="rounded-xl border border-[#C9D0D5] bg-white px-4 py-3 text-sm font-black">
                      Quitar logo
                    </button>
                  )}
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#F5F7F8] p-4"><span className="text-xs text-[#69717D]">País</span><strong className="mt-1 block">{data.tenant.countryCode}</strong></div>
              <div className="rounded-2xl bg-[#F5F7F8] p-4"><span className="text-xs text-[#69717D]">Zona horaria</span><strong className="mt-1 block">{data.tenant.timezone}</strong></div>
            </div>
          </div>

          {message && <p className="mt-5 rounded-2xl bg-[#DFFFFA] p-4 text-sm font-bold text-[#08645F]">{message}</p>}
          {error && <p className="mt-5 rounded-2xl bg-[#FFF0F0] p-4 text-sm font-bold text-[#9B1C1C]">{error}</p>}
          <button disabled={saving} className="mt-6 w-full rounded-2xl bg-[#00E5D6] px-6 py-4 font-black text-black disabled:cursor-wait disabled:opacity-60">
            {saving ? "Guardando cambios…" : "Guardar cambios"}
          </button>
        </form>
      )}
    </EnterpriseShell>
  );
}
