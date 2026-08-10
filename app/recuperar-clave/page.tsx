"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "No pudimos procesar la solicitud. Intenta nuevamente en unos minutos.");
        return;
      }
      setSent(true);
    } catch {
      setError("No pudimos conectarnos con el servicio de correo. Intenta nuevamente en unos minutos.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifying(true);
    setError("");
    const { data, error: verifyError } = await import("../lib/supabase").then(({ supabase }) =>
      supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "recovery" }),
    );
    setVerifying(false);
    if (verifyError) {
      setError("El código no es válido o ya venció. Revisa el correo o solicita uno nuevo.");
      return;
    }
    if (!data.session) {
      setError("No pudimos iniciar el cambio de contraseña. Solicita un código nuevo.");
      return;
    }
    window.sessionStorage.setItem("wama_recovery_verified", String(Date.now()));
    window.location.replace("/restablecer-clave");
  }

  return <WamaShell><section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl place-items-center px-6 py-16"><WamaCard className="w-full max-w-xl p-7 sm:p-9"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#00E5D6]/15 text-[#00E5D6]">{sent?<KeyRound className="h-6 w-6"/>:<Mail className="h-6 w-6"/>}</span><p className="mt-6 text-sm font-semibold uppercase tracking-[.22em] text-[#00E5D6]">Seguridad WAMA</p><h1 className="mt-2 text-4xl font-black tracking-[-.04em] text-white">{sent?"Ingresa tu código.":"Recupera tu acceso."}</h1>{sent?<><div className="mt-6 rounded-2xl border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-5 text-sm leading-6 text-[#D9FFFC]"><strong className="block text-base text-white">Revisa tu correo</strong>Enviamos un código a <strong>{email}</strong>. Revisa también Spam.</div><form onSubmit={verify} className="mt-5 grid gap-4"><label className="grid gap-2 text-sm font-semibold text-white">Código de recuperación<input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={event=>setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-4 text-center text-2xl font-black tracking-[.35em] outline-none focus:border-[#00E5D6]/60" placeholder="000000"/></label>{error&&<div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}<button disabled={verifying||code.length<6} className="cursor-pointer rounded-full bg-[#00E5D6] px-5 py-4 text-sm font-black text-[#0B0C0E] disabled:opacity-50">{verifying?"Verificando…":"Verificar código"}</button><button type="button" onClick={()=>{setSent(false);setCode("");setError("")}} className="text-sm font-black text-[#C4C7CC]">Usar otro correo o reenviar código</button></form></>:<><p className="mt-4 text-sm leading-6 text-[#B8C0C8]">Escribe el correo con el que accedes. Te enviaremos un código para crear una nueva contraseña.</p><form onSubmit={submit} className="mt-7 grid gap-4"><label className="grid gap-2 text-sm font-semibold text-white">Correo<input type="email" required autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-4 outline-none focus:border-[#00E5D6]/60" placeholder="nombre@empresa.cl"/></label>{error&&<div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}<button disabled={loading} className="cursor-pointer rounded-full bg-[#00E5D6] px-5 py-4 text-sm font-black text-[#0B0C0E] disabled:opacity-50">{loading?"Enviando…":"Enviar código"}</button></form></>}<Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#00E5D6]"><ArrowLeft className="h-4 w-4"/>Volver al acceso</Link></WamaCard></section></WamaShell>;
}
