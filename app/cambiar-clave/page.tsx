"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import WamaShell from "../../src/components/brand/WamaShell";

type PasswordContext = { email: string; name?: string; companyName?: string; module?: string; redirectTo?: string };

export default function ChangePasswordPage() {
  const router = useRouter();
  const [context, setContext] = useState<PasswordContext | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("wamaPasswordContext");
    if (!stored) { router.push("/acceso"); return; }
    try { setContext(JSON.parse(stored) as PasswordContext); } catch { router.push("/acceso"); }
  }, [router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!context) return;
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("La nueva clave debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
      return;
    }
    if (newPassword !== confirmPassword) { setError("Las claves no coinciden."); return; }
    window.localStorage.setItem(`wamaPasswordChanged:${context.email}`, new Date().toISOString());
    window.localStorage.setItem(`wamaUserPassword:${context.email}`, newPassword);
    window.localStorage.removeItem("wamaPasswordContext");
    router.push(context.redirectTo || "/portal");
  }

  return (
    <WamaShell>
      <main className="min-h-[calc(100vh-5rem)] bg-[#0B0C0E] text-white">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="inline-flex rounded-2xl border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-4 text-[#00E5D6]"><KeyRound className="h-7 w-7" /></div>
            <p className="mt-7 text-sm font-black uppercase tracking-[.22em] text-[#00E5D6]">Primer ingreso seguro</p>
            <h1 className="mt-5 text-5xl font-black leading-[.96] tracking-[-.06em] md:text-7xl">Crea tu nueva contraseña.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#B7BEC8]">La clave que recibiste es provisoria. Debes reemplazarla antes de entrar al portal privado de tu empresa.</p>
            <div className="mt-8 grid gap-3 text-sm text-[#D6DBE0]">
              {["Mínimo 8 caracteres", "Una mayúscula y una minúscula", "Al menos un número", "No compartas tu contraseña"].map((item) => <div key={item} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-[#00E5D6]" />{item}</div>)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-[#12161B] p-7 shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:p-9">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">{context?.companyName || "Portal WAMA"}</p>
            <h2 className="mt-3 break-all text-2xl font-black sm:text-3xl">{context?.email || "Cargando..."}</h2>
            <div className="mt-8 grid gap-5">
              <label className="grid gap-2"><span className="text-sm font-black">Nueva contraseña</span><div className="relative"><input type={show ? "text" : "password"} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 pr-12 outline-none focus:border-[#00E5D6]/60" placeholder="Crea una contraseña segura" /><button type="button" onClick={()=>setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA3AD]">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>
              <label className="grid gap-2"><span className="text-sm font-black">Confirmar contraseña</span><input type={show ? "text" : "password"} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 outline-none focus:border-[#00E5D6]/60" placeholder="Repite la contraseña" /></label>
            </div>
            {error && <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}
            <button type="submit" className="mt-7 w-full rounded-full bg-[#00E5D6] px-6 py-4 text-sm font-black text-[#0B0C0E] transition hover:bg-white">Guardar contraseña y entrar</button>
          </form>
        </section>
      </main>
    </WamaShell>
  );
}
