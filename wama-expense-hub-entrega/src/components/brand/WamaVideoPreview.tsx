export default function WamaVideoPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Demo visual
          </div>

          <h2 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
            Un software modular para ver, controlar y decidir.
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#C4C7CC]">
            WAMA conecta módulos comerciales, operativos y financieros en una
            experiencia simple para equipos que necesitan trazabilidad y control.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#111318] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,214,0.20),transparent_45%)]" />

        <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[2rem] border border-white/10 bg-[#0B0C0E]/80 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  WAMA Live
                </p>

                <h3 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                  Panel ejecutivo
                </h3>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-black text-[#00E5D6]">
                Demo
              </span>
            </div>

            <div className="grid gap-4">
              {[
                ["Sales Hub", "Pipeline comercial", "78%"],
                ["Operación", "Alertas y SLA", "64%"],
                ["Finanzas", "Pendientes y conciliación", "52%"],
                ["Reportes", "Decisiones ejecutivas", "86%"],
              ].map(([module, detail, progress]) => (
                <div
                  key={module}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-black text-[#F5F6F7]">{module}</p>
                      <p className="text-sm text-[#C4C7CC]">{detail}</p>
                    </div>

                    <span className="text-sm font-black text-[#00E5D6]">
                      {progress}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 animate-[wamaPreviewGrow_1.4s_ease-out] rounded-full bg-[#00E5D6]"
                      style={{ width: progress }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="animate-[wamaFloat_4s_ease-in-out_infinite] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Flujo WAMA
              </p>

              <h3 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                Prueba gratis → Portal → Módulo → Reporte
              </h3>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                {["Trial", "Portal", "CRM", "Reportes"].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-[#0B0C0E]/80 p-4 text-center"
                  >
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                      {index + 1}
                    </span>

                    <p className="mt-3 text-sm font-bold text-[#F5F6F7]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="animate-[wamaFloatSoft_5s_ease-in-out_infinite] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-sm text-[#C4C7CC]">Pipeline activo</p>

                <strong className="mt-2 block text-4xl font-black text-[#F5F6F7]">
                  $128M
                </strong>

                <p className="mt-2 text-sm text-[#00E5D6]">
                  18 oportunidades
                </p>
              </div>

              <div className="animate-[wamaFloatSoft_5s_ease-in-out_infinite] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-sm text-[#C4C7CC]">Cumplimiento</p>

                <strong className="mt-2 block text-4xl font-black text-[#F5F6F7]">
                  86%
                </strong>

                <p className="mt-2 text-sm text-[#00E5D6]">
                  Score ejecutivo
                </p>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes wamaPreviewGrow {
            from { width: 0; opacity: 0.4; }
            to { opacity: 1; }
          }

          @keyframes wamaFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          @keyframes wamaFloatSoft {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
      </div>
    </section>
  );
}