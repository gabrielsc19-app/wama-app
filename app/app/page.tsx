"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function WamaAppEntryPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      router.replace(data.session ? "/empresa?source=pwa" : "/login");
    });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#0B0C0E] text-white">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#00E5D6] text-2xl font-black text-black">
          W
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-[#00E5D6]">
          WAMA
        </p>
        <p className="mt-2 text-sm text-[#AEB5BD]">Abriendo tu espacio de trabajo…</p>
      </div>
    </main>
  );
}
