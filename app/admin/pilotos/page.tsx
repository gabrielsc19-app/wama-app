"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function PilotAdminPage() {
  const [form, setForm] = useState({ secret: "", companyName: "", companyRut: "", ownerName: "", ownerEmail: "", ownerPhone: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(""); setResult("");
    try {
      const response = await fetch("/api/pilot/provision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear el piloto.");
      setResult(`Portal creado para ${data.tenant.name}. Las claves fueron enviadas a ${data.ownerEmail} desde contacto@wamaapp.com. Rendiciones de Gastos quedó activo por 15 días con 10 usuarios incluidos.`);
      setForm((current) => ({ ...current, companyName: "", companyRut: "", ownerName: "", ownerEmail: "", ownerPhone: "" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado");
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#0B0C0E] px-5 py-12 text-white"><div className="mx-auto max-w-3xl"><Link href="/" className="text-sm font-black text-[#00E5D6]">← Volver a WAMA</Link><div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.05] p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">Administración interna</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em]">Crear empresa piloto</h1><p className="mt-4 leading-7 text-[#B9C0C8]">Crea el portal, activa Rendiciones de Gastos por 15 días y envía las claves al administrador principal. Los 10 usuarios corresponden a toda la empresa dentro del módulo.</p><form onSubmit={submit} className="mt-8 grid gap-4"><Input label="Clave interna" type="password" value={form.secret} onChange={(value) => setForm({ ...form, secret: value })}/><div className="grid gap-4 sm:grid-cols-2"><Input label="Empresa" value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })}/><Input label="RUT empresa" required={false} value={form.companyRut} onChange={(value) => setForm({ ...form, companyRut: value })}/></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Administrador principal" value={form.ownerName} onChange={(value) => setForm({ ...form, ownerName: value })}/><Input label="Teléfono" required={false} value={form.ownerPhone} onChange={(value) => setForm({ ...form, ownerPhone: value })}/></div><Input label="Correo administrador" type="email" value={form.ownerEmail} onChange={(value) => setForm({ ...form, ownerEmail: value })}/><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm leading-6 text-[#C4C7CC]"><strong className="text-white">Incluye:</strong> Rendiciones de Gastos · 15 días · 10 usuarios · Owner administrador · correo inmediato desde contacto@wamaapp.com.</div>{error && <p className="rounded-xl bg-red-500/15 p-4 text-sm text-red-100">{error}</p>}{result && <p className="rounded-xl bg-[#00E5D6]/15 p-4 text-sm leading-6 text-[#BFFFF9]">{result}</p>}<button disabled={loading} className="mt-2 rounded-full bg-[#00E5D6] px-6 py-4 font-black text-[#0B0C0E] disabled:opacity-50">{loading ? "Creando portal y enviando acceso…" : "Crear portal y enviar claves"}</button></form></div></div></main>;
}

function Input({ label, value, onChange, type = "text", required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="grid gap-2"><span className="text-sm font-black">{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-white/10 bg-[#14171B] px-4 py-4 outline-none focus:border-[#00E5D6]" /></label>;
}
