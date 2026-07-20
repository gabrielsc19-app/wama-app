import Link from "next/link";

const stages = [
  { name: "Target account", deals: 0, value: "0 UF", progress: 0 },
  { name: "First contact", deals: 0, value: "0 UF", progress: 0 },
  { name: "Qualified lead", deals: 0, value: "0 UF", progress: 0 },
  { name: "Proposal sent", deals: 0, value: "0 UF", progress: 0 },
  { name: "Negotiation", deals: 0, value: "0 UF", progress: 0 },
  { name: "Closing", deals: 0, value: "0 UF", progress: 0 },
];

export default function SalesHubDashboardPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F7] text-[#0B0C0E]">
      <header className="border-b border-[#D7DBE0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
              Dashboard comercial
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              Reporte ejecutivo Sales Hub
            </h1>

            <p className="mt-2 text-sm text-[#5F6673]">
              Vista de decisión para pipeline, conversión, riesgos y próximos
              pasos comerciales.
            </p>
          </div>

          <Link
            href="/sales-hub/crm"
            className="rounded-full bg-[#00E5D6] px-6 py-3 text-sm font-black"
          >
            Volver al CRM
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Deals abiertos" value="0" />
          <Metric label="Pipeline total" value="0 UF" />
          <Metric label="Pipeline ponderado" value="0 UF" />
          <Metric label="Win rate" value="0%" />
          <Metric label="Actividades hoy" value="0" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#D7DBE0] bg-white p-7 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
              Pipeline por etapa
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Distribución comercial
            </h2>

            <div className="mt-7 grid gap-4">
              {stages.map((stage) => (
                <div key={stage.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <strong>{stage.name}</strong>

                    <span className="font-bold text-[#63708A]">
                      {stage.deals} deal(s) · {stage.value}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#EEF1F4]">
                    <div
                      className="h-3 rounded-full bg-[#00E5D6]"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#D7DBE0] bg-white p-7 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
              Recomendación WAMA
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Lectura ejecutiva inicial
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#5F6673]">
              Aún no existen oportunidades cargadas. Para activar el dashboard,
              crea los primeros target accounts, asigna responsables y registra
              monto estimado en UF.
            </p>

            <div className="mt-6 grid gap-3">
              <Action text="Crear primer deal comercial." />
              <Action text="Definir responsable del pipeline." />
              <Action text="Cargar contactos y próximos pasos." />
              <Action text="Revisar win rate semanalmente." />
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#D7DBE0] bg-white p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
            Informe ejecutivo
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Cómo se verá el reporte cuando exista información
          </h2>

          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#5F6673]">
            El dashboard mostrará pipeline total, pipeline ponderado, deals por
            etapa, win rate, oportunidades ganadas, oportunidades perdidas,
            responsables con actividad pendiente y recomendaciones comerciales
            para priorizar cierres.
          </p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[#D7DBE0] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#63708A]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function Action({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#D7DBE0] bg-[#F7F9FB] p-4 text-sm font-bold text-[#344054]">
      {text}
    </div>
  );
}