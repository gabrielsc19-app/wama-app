import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

const plans = [
  {
    name: "Starter",
    description: "Para empresas que quieren comenzar con un módulo.",
    price: "Activación mensual",
    features: [
      "1 módulo WAMA",
      "Hasta 3 usuarios",
      "Prueba gratis 14 días",
      "Carga inicial asistida",
      "Dashboard base",
    ],
  },
  {
    name: "Business",
    description: "Para empresas que necesitan operar con más áreas.",
    price: "Plan recomendado",
    features: [
      "Hasta 3 módulos",
      "Hasta 10 usuarios",
      "Soporte de implementación",
      "Reportes ejecutivos",
      "Personalización de empresa",
    ],
  },
  {
    name: "Enterprise",
    description: "Para organizaciones con flujos avanzados.",
    price: "Cotización",
    features: [
      "Módulos personalizados",
      "Usuarios avanzados",
      "Integraciones",
      "Soporte prioritario",
      "Implementación dedicada",
    ],
  },
];

export default function LicensePage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Activación de licencia
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Continúa usando WAMA después de la prueba.
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#C4C7CC]">
            Al finalizar los 14 días gratis, la empresa puede activar una
            licencia mensual o anual para mantener acceso completo a sus módulos,
            usuarios y datos.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <WamaCard key={plan.name} className="flex flex-col p-7">
              <div className="mb-5 inline-flex w-fit rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-1 text-xs font-bold text-[#00E5D6]">
                {plan.price}
              </div>

              <h2 className="text-3xl font-black text-[#F5F6F7]">
                {plan.name}
              </h2>

              <p className="mt-4 min-h-[72px] text-sm leading-7 text-[#C4C7CC]">
                {plan.description}
              </p>

              <div className="mt-6 grid gap-3">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-[#F5F6F7]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#00E5D6]" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <WamaButton href="/trial" variant="secondary">
                  Solicitar activación
                </WamaButton>
              </div>
            </WamaCard>
          ))}
        </div>

        <WamaCard className="mt-10 p-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Pago inicial
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#F5F6F7]">
                Activación manual para primeros clientes
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#C4C7CC]">
                En esta etapa, la licencia se activa luego de validación
                comercial. El pago puede gestionarse mediante factura,
                transferencia o link de pago. Más adelante WAMA podrá integrar
                pago automático con Webpay, Flow, Mercado Pago o Stripe.
              </p>
            </div>

            <WamaButton href="/sales-hub">Volver al Sales Hub</WamaButton>
          </div>
        </WamaCard>
      </section>
    </WamaShell>
  );
}