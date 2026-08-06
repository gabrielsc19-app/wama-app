"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import WamaShell from "../../src/components/brand/WamaShell";
import WamaCard from "../../src/components/brand/WamaCard";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const emailFromUrl = new URLSearchParams(window.location.search).get("email");
    if (emailFromUrl) setEmail(emailFromUrl);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.replace(/\D/g, "");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError("El código debe tener 6 dígitos.");
      return;
    }
    if (password.length < 10) {
      setError("La contraseña debe tener al menos 10 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedCode,
      type: "recovery",
    });

    if (verifyError) {
      setLoading(false);
      setError("El código es incorrecto, venció o ya fue utilizado. Solicita uno nuevo.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError("No pudimos guardar la nueva contraseña. Solicita un código nuevo.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?password=updated");
  }

  return (
    <WamaShell>
      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl place-items-center px-6 py-16">
        <WamaCard className="w-full max-w-xl p-7 sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#00E5D6]/15 text-[#00E5D6]"><KeyRound className="h-6 w-6" /></span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[.22em] text-[#00E5D6]">Seguridad WAMA</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.04em] text-white">Ingresa tu código.</h1>
          <p className="mt-4 text-sm leading-6 text-[#B8C0C8]">Escribe el código de 6 dígitos que recibiste y define tu nueva contraseña.</p>
          <form onSubmit={submit} className="mt-7 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-white">Correo<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-4 outline-none focus:border-[#00E5D6]/60" /></label>
            <label className="grid gap-2 text-sm font-semibold text-white">Código de 6 dígitos<input type="text" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="rounded-2xl border border-white/10 bg-[#111318] px-4 py-4 text-center text-2xl font-black tracking-[.35em] outline-none focus:border-[#00E5D6]/60" placeholder="000000" /></label>
            <Password label="Nueva contraseña" value={password} show={show} onChange={setPassword} onToggle={() => setShow(!show)} />
            <Password label="Repetir contraseña" value={confirm} show={showConfirm} onChange={setConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
            {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
            <button disabled={loading} className="cursor-pointer rounded-full bg-[#00E5D6] px-5 py-4 text-sm font-black text-[#0B0C0E] disabled:opacity-50">{loading ? "Validando…" : "Guardar nueva contraseña"}</button>
          </form>
          <Link href="/recuperar-clave" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#00E5D6]"><ArrowLeft className="h-4 w-4" />Solicitar un código nuevo</Link>
        </WamaCard>
      </section>
    </WamaShell>
  );
}

function Password({ label, value, show, onChange, onToggle }: { label: string; value: string; show: boolean; onChange: (value: string) => void; onToggle: () => void }) {
  return <label className="grid gap-2 text-sm font-semibold text-white">{label}<div className="relative"><input required type={show ? "text" : "password"} autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-4 pr-12 outline-none focus:border-[#00E5D6]/60" /><button type="button" onClick={onToggle} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center text-[#AEB6BF]">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>;
}
