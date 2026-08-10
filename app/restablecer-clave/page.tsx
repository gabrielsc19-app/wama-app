"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function prepareRecovery() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const code = params.get("code");

      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (!active) return;
        if (verifyError) {
          setError("Este enlace venció, ya fue utilizado o no es válido. Solicita uno nuevo.");
          return;
        }
        setReady(true);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (exchangeError) {
          setError("Este enlace venció, ya fue utilizado o no es válido. Solicita uno nuevo.");
          return;
        }
        setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (active && data.session) setReady(true);
      if (active && !data.session) setError("Verifica primero el código recibido por correo.");
    }

    void prepareRecovery();
    return () => { active = false; };
  }, []);

  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");if(password.length<10){setError("La contraseña debe tener al menos 10 caracteres.");return}if(password!==confirm){setError("Las contraseñas no coinciden.");return}setLoading(true);const {error:updateError}=await supabase.auth.updateUser({password});setLoading(false);if(updateError){setError("El enlace expiró o no pudo actualizarse. Solicita uno nuevo.");return}router.replace("/login?password=updated")}

  return <WamaShell><section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl place-items-center px-6 py-16"><WamaCard className="w-full max-w-xl p-7 sm:p-9"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#00E5D6]/15 text-[#00E5D6]"><KeyRound className="h-6 w-6"/></span><h1 className="mt-6 text-4xl font-black tracking-[-.04em] text-white">Crea una nueva contraseña.</h1>{ready?<form onSubmit={submit} className="mt-7 grid gap-4"><Password label="Nueva contraseña" value={password} show={show} onChange={setPassword} onToggle={()=>setShow(!show)}/><Password label="Repetir contraseña" value={confirm} show={showConfirm} onChange={setConfirm} onToggle={()=>setShowConfirm(!showConfirm)}/>{error&&<div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}<button disabled={loading} className="cursor-pointer rounded-full bg-[#00E5D6] px-5 py-4 text-sm font-black text-[#0B0C0E] disabled:opacity-50">{loading?"Guardando…":"Guardar nueva contraseña"}</button></form>:<div className="mt-6 rounded-2xl bg-white/5 p-5 text-sm leading-6 text-[#C4C7CC]">{error || "Validando el enlace de recuperación…"}</div>}</WamaCard></section></WamaShell>;
}

function Password({label,value,show,onChange,onToggle}:{label:string;value:string;show:boolean;onChange:(value:string)=>void;onToggle?:()=>void}){return <label className="grid gap-2 text-sm font-semibold text-white">{label}<div className="relative"><input required type={show?"text":"password"} value={value} onChange={event=>onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-4 pr-12 outline-none focus:border-[#00E5D6]/60"/>{onToggle&&<button type="button" onClick={onToggle} aria-label={show?"Ocultar contraseña":"Mostrar contraseña"} className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center text-[#AEB6BF]">{show?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button>}</div></label>}
