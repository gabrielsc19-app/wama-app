"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExpenseHubAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@wamaapp.com");
  const [password, setPassword] = useState("WamaExpense2026!");
  const [error, setError] = useState("");

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== "demo@wamaapp.com" || password !== "WamaExpense2026!") {
      setError("No pudimos validar el acceso. Usa las credenciales demo indicadas.");
      return;
    }
    window.localStorage.setItem("wamaExpenseSession", JSON.stringify({ email, companyName: "Empresa Demo SpA", role: "Administrador" }));
    const changed = window.localStorage.getItem(`wamaPasswordChanged:${email.trim().toLowerCase()}`);
    if (!changed) {
      window.localStorage.setItem("wamaPasswordContext", JSON.stringify({ email: email.trim().toLowerCase(), name: "Usuario Expense", companyName: "Empresa Demo SpA", module: "expense", redirectTo: "/expense-hub" }));
      router.push("/cambiar-clave");
      return;
    }
    router.push("/expense-hub");
  }

  return (
    <main className="min-h-screen bg-[#0B0C0E] text-white">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <Link href="/" className="text-sm font-black text-[#AEB6C0] hover:text-[#00E5D6]">← Volver al inicio</Link>
          <p className="mt-12 text-sm font-black uppercase tracking-[0.24em] text-[#00E5D6]">Expense Hub</p>
          <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-[-0.065em] md:text-7xl">Rinde gastos. WAMA se encarga del resto.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#B7BEC8]">Captura documentos, controla anticipos, aprueba rendiciones y revisa alertas desde teléfono, tablet o computador.</p>
          <div className="mt-8 rounded-[1.5rem] border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5D6]">Acceso demo</p>
            <p className="mt-3 font-black">demo@wamaapp.com</p>
            <p className="mt-1 text-sm text-[#C4C7CC]">Clave provisoria: WamaExpense2026!</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="rounded-[2rem] border border-white/10 bg-[#111318] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00E5D6]">Portal privado</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.05em]">Acceder a Expense Hub</h2><p className="mt-3 text-sm leading-6 text-[#C4C7CC]">En tu primer ingreso deberás reemplazar la clave provisoria por una contraseña personal.</p>
          <div className="mt-8 grid gap-5">
            <label className="grid gap-2"><span className="text-sm font-black">Correo</span><input value={email} onChange={(e)=>setEmail(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 outline-none focus:border-[#00E5D6]/60" /></label>
            <label className="grid gap-2"><span className="text-sm font-black">Clave</span><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0B0C0E] px-4 py-4 outline-none focus:border-[#00E5D6]/60" /></label>
          </div>
          {error && <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</div>}
          <button className="mt-7 w-full rounded-full bg-[#00E5D6] px-6 py-4 text-sm font-black text-[#0B0C0E]">Acceder a Expense Hub</button>
          <p className="mt-5 text-center text-xs leading-5 text-[#8F98A3]">En producción, cada empresa tendrá usuarios, permisos y datos privados.</p>
        </form>
      </section>
    </main>
  );
}
