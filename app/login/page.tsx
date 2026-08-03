"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("password") === "updated") setNotice("Tu contraseña fue actualizada. Ya puedes ingresar con tu nueva clave.");
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      const mustChange = Boolean(data.session.user.user_metadata?.must_change_password);
      router.replace(mustChange ? "/cuenta/crear-clave" : "/empresa");
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (authError || !data.user) {
      setError("El correo o la clave no son correctos. Usa los datos recibidos desde contacto@wamaapp.com.");
      setLoading(false);
      return;
    }
    const mustChange = Boolean(data.user.user_metadata?.must_change_password);
    router.replace(mustChange ? "/cuenta/crear-clave" : "/empresa");
  }

  return (
    <WamaShell>
      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">Portal WAMA</div>
          <h1 className="text-5xl font-black leading-tight tracking-[-.04em] text-[#F5F6F7] md:text-7xl">Accede a tu portal.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C4C7CC]">Ingresa con el correo y la clave temporal enviados por WAMA. En tu primer acceso crearás una clave personal.</p>
        </div>
        <WamaCard className="p-7 sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[.25em] text-[#00E5D6]">Acceso al software</p>
          <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">Iniciar sesión</h2>
          <form className="mt-7 grid gap-5" onSubmit={submit}>
            <label className="grid gap-2 text-sm font-semibold text-white">Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 outline-none focus:border-[#00E5D6]/60" /></label>
            <label className="grid gap-2 text-sm font-semibold text-white">Clave<div className="relative"><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 pr-12 outline-none focus:border-[#00E5D6]/60" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"} className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center text-[#AEB6BF] transition hover:text-[#00E5D6]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>
            <div className="-mt-2 text-right"><Link href="/recuperar-clave" className="text-sm font-black text-[#00E5D6] hover:underline">¿Olvidaste tu contraseña?</Link></div>
            {notice && <div className="rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 p-4 text-sm text-[#D9FFFC]">{notice}</div>}
            {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
            <button disabled={loading} className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] disabled:opacity-50">{loading ? "Ingresando…" : "Acceder al portal"}</button>
          </form>
          <div className="mt-6 border-t border-white/10 pt-5 text-sm text-[#AEB6BF]">¿Aún no tienes acceso? <Link href="/trial" className="font-black text-[#00E5D6]">Activa una prueba gratuita</Link>.</div>
        </WamaCard>
      </section>
    </WamaShell>
  );
}
