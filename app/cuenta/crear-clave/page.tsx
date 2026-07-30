"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function CreatePersonalPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setReady(true);
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 10) return setError("La clave debe tener al menos 10 caracteres.");
    if (password !== confirm) return setError("Las claves no coinciden.");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const currentMetadata = user?.user_metadata || {};
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { ...currentMetadata, must_change_password: false },
    });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    router.replace("/empresa");
  }

  if (!ready) return <main className="grid min-h-screen place-items-center bg-[#0B0C0E] text-white">Validando acceso…</main>;

  return (
    <main className="grid min-h-screen place-items-center bg-[#0B0C0E] p-5 text-white">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[.05] p-8 sm:p-10">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#00E5D6] text-2xl font-black text-black">W</span>
        <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">Primer acceso</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Crea tu clave personal.</h1>
        <p className="mt-3 text-sm leading-6 text-[#B8C0C8]">Reemplaza la clave temporal recibida por correo. Después entrarás directamente al Portal WAMA.</p>
        <form onSubmit={submit} className="mt-7 grid gap-4">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva clave" className="rounded-2xl border border-white/10 bg-[#15181C] px-4 py-4 outline-none focus:border-[#00E5D6]" />
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repetir clave" className="rounded-2xl border border-white/10 bg-[#15181C] px-4 py-4 outline-none focus:border-[#00E5D6]" />
          {error && <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{error}</p>}
          <button disabled={loading} className="rounded-full bg-[#00E5D6] px-6 py-4 font-black text-black disabled:opacity-60">{loading ? "Guardando…" : "Guardar y entrar a WAMA"}</button>
        </form>
      </section>
    </main>
  );
}
