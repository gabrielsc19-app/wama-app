"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../../src/core/portal/portalData";
import { updateTenant } from "../../../src/core/tenant/TenantService";

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const TARGET_LOGO_BYTES = 700 * 1024;
const MAX_LOGO_SIDE = 1400;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No pudimos leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No pudimos procesar esta imagen."));
    image.src = source;
  });
}

async function optimizeRasterLogo(file: File) {
  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(1, MAX_LOGO_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let quality = 0.9;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("El navegador no pudo optimizar la imagen.");
    context.drawImage(image, 0, 0, width, height);
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob) throw new Error("El navegador no pudo convertir la imagen.");
    if (blob.size <= TARGET_LOGO_BYTES) break;
    if (quality > 0.58) quality -= 0.08;
    else {
      width = Math.max(320, Math.round(width * 0.85));
      height = Math.max(320, Math.round(height * 0.85));
    }
  }

  if (!blob || blob.size > TARGET_LOGO_BYTES) {
    throw new Error("No fue posible reducir suficientemente la imagen. Prueba con otra fotografía.");
  }
  return { dataUrl: await readAsDataUrl(blob), optimizedBytes: blob.size };
}

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
  const [optimizing, setOptimizing] = useState(false);
  const [logoInfo, setLogoInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadEnterprisePortalData().then((portal) => {
      setData(portal);
      setName(portal.tenant.name);
      setWebsite(portal.tenant.website || "");
      setLogo(portal.tenant.logoUrl || "");
    });
  }, []);

  async function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    setMessage("");
    setLogoInfo("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      setError("Selecciona una imagen en formato PNG, JPG, WEBP o SVG.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("La imagen supera los 20 MB. Selecciona un archivo más liviano.");
      event.target.value = "";
      return;
    }
    setOptimizing(true);
    try {
      if (file.type === "image/svg+xml") {
        if (file.size > TARGET_LOGO_BYTES) throw new Error("El SVG supera los 700 KB. Optimízalo antes de cargarlo.");
        setLogo(await readAsDataUrl(file));
        setLogoInfo(`Imagen lista: ${formatBytes(file.size)}.`);
      } else {
        const optimized = await optimizeRasterLogo(file);
        setLogo(optimized.dataUrl);
        setLogoInfo(`Imagen optimizada: ${formatBytes(file.size)} → ${formatBytes(optimized.optimizedBytes)}.`);
      }
    } catch (optimizationError) {
      setError(optimizationError instanceof Error ? optimizationError.message : "No pudimos optimizar la imagen.");
      event.target.value = "";
    } finally {
      setOptimizing(false);
    }
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
                  <p className="mt-1 text-xs text-[#69717D]">Carga una imagen PNG, JPG o WEBP de hasta 20 MB. WAMA reducirá automáticamente su peso antes de guardarla.</p>
                  {optimizing && <p className="mt-2 text-xs font-black text-[#008F87]">Optimizando imagen…</p>}
                  {logoInfo && !optimizing && <p className="mt-2 text-xs font-bold text-[#08645F]">{logoInfo}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={selectLogo} className="hidden" />
                  <button type="button" disabled={optimizing} onClick={() => fileRef.current?.click()} className="rounded-xl bg-black px-4 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
                    {optimizing ? "Optimizando…" : logo ? "Cambiar imagen" : "Cargar imagen"}
                  </button>
                  {logo && (
                    <button type="button" disabled={optimizing} onClick={() => { setLogo(""); setLogoInfo(""); if (fileRef.current) fileRef.current.value = ""; }} className="rounded-xl border border-[#C9D0D5] bg-white px-4 py-3 text-sm font-black disabled:opacity-60">
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
          <button disabled={saving || optimizing} className="mt-6 w-full rounded-2xl bg-[#00E5D6] px-6 py-4 font-black text-black disabled:cursor-wait disabled:opacity-60">
            {saving ? "Guardando cambios…" : "Guardar cambios"}
          </button>
        </form>
      )}
    </EnterpriseShell>
  );
}
