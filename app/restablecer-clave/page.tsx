"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";
import { supabase } from "../lib/supabase";

type LinkState = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function prepareRecoverySession() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) setLinkState("invalid");
          return;
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (tokenHash && type === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (verifyError) {
          if (active) setLinkState("invalid");
          return;
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      setLinkState(!sessionError && data.session ? "ready" : "invalid");
    }

    void prepareRecoverySession();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) setLinkState("ready");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 10) {
      setError("La contraseña debe tener al menos 10 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError("El enlace venció, ya fue utilizado o no pudo actualizarse. Solicita uno nuevo.");
      return;
    }
    await supabase.auth.signOut();
    router.replace("/login?password=updated");
  }

  return <WamaShell><section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl place-items-center px-6 py-16"><WamaCard className="w-full max-w-xl p-7 sm:p-9"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#00E5D6]/15 text-[#00E5D6]"><KeyRound className="h-6 w-6"/></span><p className="mt-6 text-sm font-semibold uppercase tracking-[.22em] text-[#00E5D6]">Seguridad WAMA</p><h1 className="mt-2 text-4xl font-black tracking-[-.04em] text-white">Crea una nueva contraseña.</h1>{linkState === "checking" && <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/5 p-5 text-sm text-[#C4C7CC]"><LoaderCircle className="h-5 w-5 animate-spin text-[#00E5D6]"/>Validando tu enlace seguro…</div>}{linkState === "ready" && <form onSubmit={submit} className="mt-7 grid gap-4"><Password label="Nueva contraseña" value={password} show={showPassword} onChange={setPassword} onToggle={()=>setShowPassword(current=>!current)}/><Password label="Confirmar contraseña" value={confirm} show={showConfirm} onChange={setConfirm} onToggle={()=>setShowConfirm(current=>!current)}/>{error&&<div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}<button disabled={loading} className="cursor-pointer rounded-full bg-[#00E5D6] px-5 py-4 text-sm font-black text-[#0B0C0E] disabled:opacity-50">{loading?"Guardando…":"Guardar nueva contraseña"}</button></form>}{linkState === "invalid" && <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-50"><strong className="block text-base">Este enlace no está disponible.</strong><span>Puede haber vencido o haber sido utilizado anteriormente.</span><Link href="/recuperar-clave" className="mt-4 block font-black text-[#00E5D6]">Solicitar un enlace nuevo</Link></div>}</WamaCard></section></WamaShell>;
}

function Password({label,value,show,onChange,onToggle}:{label:string;value:string;show:boolean;onChange:(value:string)=>void;onToggle:()=>void}) {
  return <label className="grid gap-2 text-sm font-semibold text-white">{label}<div className="relative"><input required autoComplete="new-password" type={show?"text":"password"} value={value} onChange={event=>onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-4 pr-12 outline-none focus:border-[#00E5D6]/60"/><button type="button" onClick={onToggle} aria-label={show?"Ocultar contraseña":"Mostrar contraseña"} className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center text-[#AEB6BF]">{show?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div></label>;
}
