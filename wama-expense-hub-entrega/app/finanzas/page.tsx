import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

const kpis = [
  {
    label: "Documentos cargados",
    value: "126",
    detail: "Facturas y respaldos",
  },
  {
    label: "Pendientes de pago",
    value: "42",
    detail: "Documentos por revisar",
  },
  {
    label: "Conciliados",
    value: "84",
    detail: "Cruce con cartola",
  },
  {
    label: "Monto pendiente",
    value: "$38M",
    detail: "Base demo",
  },
];

const documents = [
  {
    supplier: "Proveedor Servicios Norte",
    type: "Factura",
    amount: "$4.850.000",
    status: "Pendiente",
  },
  {
    supplier: "Mantención Integral",
    type: "Factura",
    amount: "$2.420.000",
    status: "Conciliado",
  },
  {
    supplier: "Seguridad Operativa",
    type: "Documento",
    amount: "$8.100.000",
    status: "Por validar",
  },
];

const flow = [
  "Carga de documentos",
  "Carga de cartola",
  "Conciliación",
  "Validación de pendientes",
  "Dashboard financiero",
];

export default function FinancePage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
              Finanzas / Cuentas por pagar
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-6xl">
              Control financiero con documentos, cartola y conciliación.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
              WAMA Finanzas permite ordenar la carga documental, cruzar pagos,
              detectar pendientes y visualizar el estado financiero operativo
              en una sola vista.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <WamaButton href="/app" variant="secondary">
              Volver al portal
            </WamaButton>

            <WamaButton href="/reportes">Ver reportes</WamaButton>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <WamaCard key={kpi.label} className="p-6">
              <p className="text-sm text-[#C4C7CC]">{kpi.label}</p>

              <strong className="mt-3 block text-4xl font-black text-[#F5F6F7]">
                {kpi.value}
              </strong>

              <p className="mt-3 text-sm text-[#C4C7CC]">{kpi.detail}</p>
            </WamaCard>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <WamaCard className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                  Documentos
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                  Estado de cuentas por pagar
                </h2>
              </div>

              <span className="rounded-full bg-[#00E5D6]/15 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                DEMO
              </span>
            </div>

            <div className="grid gap-4">
              {documents.map((document) => (
                <div
                  key={document.supplier}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <h3 className="font-bold text-[#F5F6F7]">
                      {document.supplier}
                    </h3>

                    <p className="mt-1 text-sm text-[#C4C7CC]">
                      {document.type}
                    </p>
                  </div>

                  <div className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#C4C7CC]">
                    {document.status}
                  </div>

                  <div className="text-right text-lg font-black text-[#F5F6F7]">
                    {document.amount}
                  </div>
                </div>
              ))}
            </div>
          </WamaCard>

          <WamaCard className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
              Flujo financiero
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
              De la carga al control
            </h2>

            <div className="mt-6 grid gap-3">
              {flow.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                    {index + 1}
                  </span>

                  <span className="text-sm font-semibold text-[#F5F6F7]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </WamaCard>
        </div>
      </section>
    </WamaShell>
  );
}