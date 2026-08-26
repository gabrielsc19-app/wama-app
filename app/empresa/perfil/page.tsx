"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { loadEnterprisePortalData, type EnterprisePortalData } from "../../../src/core/portal/portalData";
import { supabase } from "../../lib/supabase";

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

async function renderLogoFrame(source: string, zoom: number, offsetX: number, offsetY: number) {
  const image = await loadImage(source);
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No pudimos preparar el encuadre del logo.");
  context.clearRect(0, 0, size, size);
  const contain = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const drawWidth = image.naturalWidth * contain * zoom;
  const drawHeight = image.naturalHeight * contain * zoom;
  const x = (size - drawWidth) / 2 + (offsetX / 100) * size;
  const y = (size - drawHeight) / 2 + (offsetY / 100) * size;
  context.drawImage(image, x, y, drawWidth, drawHeight);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (!blob) throw new Error("No pudimos guardar el encuadre del logo.");
  return readAsDataUrl(blob);
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
  const [logoSource, setLogoSource] = useState("");
  const [logoZoom, setLogoZoom] = useState(1);
  const [logoOffset, setLogoOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
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
      setLogoSource(portal.tenant.logoUrl || "");
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
        const prepared = await readAsDataUrl(file);
        setLogo(prepared);
        setLogoSource(prepared);
        setLogoZoom(1);
        setLogoOffset({ x: 0, y: 0 });
        setLogoInfo(`Imagen lista: ${formatBytes(file.size)}.`);
      } else {
        const optimized = await optimizeRasterLogo(file);
        setLogo(optimized.dataUrl);
        setLogoSource(optimized.dataUrl);
        setLogoZoom(1);
        setLogoOffset({ x: 0, y: 0 });
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
      const framedLogo = logoSource ? await renderLogoFrame(logoSource, logoZoom, logoOffset.x, logoOffset.y) : null;
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Tu sesión terminó. Vuelve a ingresar.");

      const response = await fetch("/api/enterprise/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: data.tenant.id,
          name,
          website: normalizedWebsite,
          logoUrl: framedLogo,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error || "No fue posible guardar los cambios.");
      setWebsite(normalizedWebsite || "");
      if (framedLogo) { setLogo(framedLogo); setLogoSource(framedLogo); setLogoZoom(1); setLogoOffset({ x: 0, y: 0 }); }
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
            <div
              className="relative flex h-36 w-36 shrink-0 touch-none select-none items-center justify-center overflow-hidden rounded-3xl border bg-white text-3xl font-black cursor-grab active:cursor-grabbing"
              onPointerDown={(event) => { if (!logoSource) return; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, originX: logoOffset.x, originY: logoOffset.y }; }}
              onPointerMove={(event) => { const drag = dragRef.current; if (!drag || !logoSource) return; setLogoOffset({ x: Math.max(-50, Math.min(50, drag.originX + ((event.clientX - drag.x) / 144) * 100)), y: Math.max(-50, Math.min(50, drag.originY + ((event.clientY - drag.y) / 144) * 100)) }); }}
              onPointerUp={() => { dragRef.current = null; }}
              onPointerCancel={() => { dragRef.current = null; }}
            >
              {logoSource ? <img src={logoSource} alt="Logo de la empresa" draggable={false} className="pointer-events-none h-full w-full object-contain" style={{ transform: `translate(${logoOffset.x}%, ${logoOffset.y}%) scale(${logoZoom})` }} /> : name.slice(0, 2).toUpperCase()}
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
                  {logoSource && (
                    <button type="button" disabled={optimizing} onClick={() => { setLogo(""); setLogoSource(""); setLogoZoom(1); setLogoOffset({ x: 0, y: 0 }); setLogoInfo(""); if (fileRef.current) fileRef.current.value = ""; }} className="rounded-xl border border-[#C9D0D5] bg-white px-4 py-3 text-sm font-black disabled:opacity-60">
                      Quitar logo
                    </button>
                  )}
                </div>
              </div>
              {logoSource && <div className="mt-5 rounded-2xl border border-[#DDE8E7] bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex-1"><p className="text-sm font-black">Ajustar encuadre</p><p className="mt-1 text-xs text-[#69717D]">Arrastra el logo directamente en la vista previa. Usa el zoom para ajustar su tamaño.</p></div><label className="flex min-w-[240px] items-center gap-3 text-xs font-bold">Zoom<input type="range" min="0.5" max="3" step="0.05" value={logoZoom} onChange={(event)=>setLogoZoom(Number(event.target.value))} className="w-full"/><span className="w-12 text-right">{Math.round(logoZoom*100)}%</span></label><button type="button" onClick={()=>{setLogoZoom(1);setLogoOffset({x:0,y:0});}} className="rounded-xl border px-3 py-2 text-xs font-black">Centrar</button></div></div>}
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
