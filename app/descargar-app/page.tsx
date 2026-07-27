"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Apple, CheckCircle2, Download, MonitorSmartphone, Smartphone } from "lucide-react";
import WamaShell from "../../src/components/brand/WamaShell";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function DownloadAppPage() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone;
    setInstalled(Boolean(standalone));
    const handler = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  return (
    <WamaShell>
      <main className="min-h-screen bg-[#F3F6F8] text-[#0B0C0E]">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
            <div>
              <div className="flex items-center gap-4"><Image src="/wama-icon-192.png?v=1" alt="WAMA" width={64} height={64} className="rounded-2xl shadow-lg" priority /><div><p className="text-sm font-black uppercase tracking-[0.22em] text-[#008F87]">WAMA Mobile</p><p className="mt-1 text-sm font-bold text-[#66707C]">Warn and Manage</p></div></div>
              <h1 className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-[-0.06em] sm:mt-6 sm:text-5xl md:text-7xl">Tu empresa, también en tu celular.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#66707C] sm:mt-7 sm:text-lg sm:leading-8">Instala WAMA como aplicación en iPhone, iPad, Android, tablet o computador. Conserva los accesos rápidos y trabaja a pantalla completa.</p>

              <div className="mt-8 hidden gap-3 sm:grid">
                {["Captura fotos y documentos desde la cámara", "Accede a Sales Hub y Expense Hub", "Recibe una experiencia optimizada para móvil", "Usa la misma cuenta y permisos de tu empresa"].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="h-5 w-5 text-[#00A99D]" />{item}</div>)}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {isIOS && !installed && <p className="mb-3 text-sm font-bold text-[#008F87]">Detectamos un dispositivo Apple: instala WAMA desde Safari usando Compartir → Agregar a inicio.</p>}
                {installed ? (
                  <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[#DFFFFB] px-7 py-4 text-sm font-black text-[#007E77]"><CheckCircle2 className="h-5 w-5" />WAMA ya está instalada</div>
                ) : promptEvent ? (
                  <button onClick={install} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E] transition hover:bg-white"><Download className="h-5 w-5" />Instalar WAMA ahora</button>
                ) : (
                  <a href="#instrucciones" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black text-[#0B0C0E]"><Smartphone className="h-5 w-5" />Ver cómo instalar</a>
                )}
                <Link href="/acceso" className="inline-flex items-center justify-center rounded-full border border-[#CBD3DA] bg-white px-7 py-4 text-sm font-black">Entrar a los portales</Link>
              </div>
            </div>

            <div className="relative hidden overflow-hidden rounded-[2.5rem] bg-[#0B0C0E] p-6 text-white shadow-[0_35px_110px_rgba(11,12,14,.28)] sm:block sm:p-10">
              <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#00E5D6]/15 blur-3xl" />
              <div className="relative mx-auto max-w-md rounded-[2.4rem] border-[8px] border-[#050607] bg-[#F5F6F7] p-3 text-[#0B0C0E]">
                <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[#242A30]" />
                <div className="rounded-[1.8rem] bg-[#0B0C0E] p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">WAMA</p>
                  <h2 className="mt-3 text-3xl font-black">¿Qué quieres hacer?</h2>
                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl bg-[#00E5D6] p-4 text-[#0B0C0E]"><p className="font-black">📷 Rendir un gasto</p><p className="mt-1 text-xs">Toma una foto y confirma.</p></div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-black">💼 Revisar Sales Hub</p><p className="mt-1 text-xs text-[#B7BEC8]">Pipeline, actividades y oportunidades.</p></div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-black">🔔 Notificaciones</p><p className="mt-1 text-xs text-[#B7BEC8]">Aprobaciones y alertas importantes.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section id="instrucciones" className="mt-12 grid gap-4 sm:mt-20 sm:gap-6 lg:grid-cols-2">
            <article className="rounded-[1.5rem] border border-[#D9E0E5] bg-white p-5 sm:rounded-[2rem] sm:p-8"><Apple className="h-9 w-9" /><h2 className="mt-5 text-3xl font-black">Instalar en iPhone o iPad</h2><ol className="mt-6 grid gap-4 text-sm leading-6 text-[#66707C]"><li><strong className="text-[#0B0C0E]">1.</strong> Abre <strong>wamaapp.com</strong> en Safari.</li><li><strong className="text-[#0B0C0E]">2.</strong> Presiona Compartir.</li><li><strong className="text-[#0B0C0E]">3.</strong> Selecciona “Agregar a inicio”.</li><li><strong className="text-[#0B0C0E]">4.</strong> Confirma “Agregar”.</li></ol></article>
            <article className="rounded-[1.5rem] border border-[#D9E0E5] bg-white p-5 sm:rounded-[2rem] sm:p-8"><MonitorSmartphone className="h-9 w-9" /><h2 className="mt-5 text-3xl font-black">Instalar en Android o computador</h2><ol className="mt-6 grid gap-4 text-sm leading-6 text-[#66707C]"><li><strong className="text-[#0B0C0E]">1.</strong> Abre WAMA en Chrome.</li><li><strong className="text-[#0B0C0E]">2.</strong> Presiona “Instalar aplicación” en el menú.</li><li><strong className="text-[#0B0C0E]">3.</strong> Acepta la instalación.</li><li><strong className="text-[#0B0C0E]">4.</strong> WAMA quedará en tu pantalla de inicio.</li></ol></article>
          </section>

          <section className="mt-8 rounded-[2rem] bg-[#0B0C0E] p-7 text-white sm:p-10"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">Primer acceso seguro</p><h2 className="mt-3 text-3xl font-black">Correo, clave provisoria y nueva contraseña.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#B7BEC8]">Tu empresa crea el usuario. WAMA envía una clave temporal y, en el primer ingreso, solicita definir una contraseña personal antes de abrir el portal.</p></div><div className="grid gap-2 text-sm font-black"><span className="rounded-full border border-white/15 px-5 py-3">1. Recibe tu acceso</span><span className="rounded-full border border-white/15 px-5 py-3">2. Cambia la contraseña</span><span className="rounded-full bg-[#00E5D6] px-5 py-3 text-[#0B0C0E]">3. Entra a WAMA</span></div></div></section>
        </section>
      </main>
    </WamaShell>
  );
}
