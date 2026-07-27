import WamaShell from "./WamaShell";
import WamaButton from "./WamaButton";
import WamaCard from "./WamaCard";

type ModuleLandingProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCta?: string;
  secondaryCta?: string;
  secondaryHref?: string;
  accentLabel: string;
  selfServiceTitle: string;
  selfServiceDescription: string;
  guideTitle: string;
  guideDescription: string;
  guidePrompts: string[];
  features: string[];
  workflow: string[];
  metrics: {
    label: string;
    value: string;
    detail: string;
    progress: string;
  }[];
  demoCards: {
    title: string;
    detail: string;
    value: string;
  }[];
};

export default function WamaModuleLanding({
  eyebrow,
  title,
  subtitle,
  description,
  primaryCta = "Activar prueba gratis",
  secondaryCta = "Acceso portal",
  secondaryHref = "/login",
  accentLabel,
  selfServiceTitle,
  selfServiceDescription,
  guideTitle,
  guideDescription,
  guidePrompts,
  features,
  workflow,
  metrics,
  demoCards,
}: ModuleLandingProps) {
  return (
    <WamaShell>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="wama-fade-up">
              <div className="mb-5 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
                {eyebrow}
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.05em] text-[#F5F6F7] md:text-7xl">
                {title}
              </h1>

              <p className="mt-6 text-2xl font-black tracking-[-0.03em] text-[#F5F6F7]">
                {subtitle}
              </p>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C4C7CC]">
                {description}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <WamaButton href="/trial">{primaryCta}</WamaButton>

                <WamaButton href={secondaryHref} variant="secondary">
                  {secondaryCta}
                </WamaButton>
              </div>
            </div>

            <WamaCard className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                    Demo interactiva
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-[#F5F6F7]">
                    {accentLabel}
                  </h2>
                </div>

                <span className="rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-3 py-1 text-xs font-black text-[#00E5D6]">
                  LIVE
                </span>
              </div>

              <div className="grid gap-4">
                {demoCards.map((card) => (
                  <div
                    key={card.title}
                    className="wama-card-motion rounded-3xl border border-white/10 bg-[#0B0C0E]/70 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-[#F5F6F7]">
                          {card.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-[#C4C7CC]">
                          {card.detail}
                        </p>
                      </div>

                      <strong className="text-2xl font-black text-[#00E5D6]">
                        {card.value}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </WamaCard>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {metrics.map((metric) => (
              <WamaCard key={metric.label} className="p-6">
                <p className="text-sm text-[#C4C7CC]">{metric.label}</p>

                <strong className="mt-3 block text-4xl font-black text-[#F5F6F7]">
                  {metric.value}
                </strong>

                <p className="mt-2 text-sm text-[#C4C7CC]">{metric.detail}</p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="wama-progress-fill h-2 rounded-full bg-[#00E5D6]"
                    style={{ width: metric.progress }}
                  />
                </div>
              </WamaCard>
            ))}
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <WamaCard className="p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Autogestión
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#F5F6F7]">
                {selfServiceTitle}
              </h2>

              <p className="mt-5 text-base leading-8 text-[#C4C7CC]">
                {selfServiceDescription}
              </p>

              <div className="mt-7 grid gap-3">
                {workflow.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
                      {index + 1}
                    </span>

                    <p className="text-sm font-bold text-[#F5F6F7]">{step}</p>
                  </div>
                ))}
              </div>
            </WamaCard>

            <WamaCard className="p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                Asistente WAMA
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#F5F6F7]">
                {guideTitle}
              </h2>

              <p className="mt-5 text-base leading-8 text-[#C4C7CC]">
                {guideDescription}
              </p>

              <div className="mt-8 rounded-[2rem] border border-[#00E5D6]/25 bg-[#00E5D6]/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00E5D6] text-xl font-black text-[#0B0C0E]">
                    W
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#F5F6F7]">
                      Hola, soy WAMA.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#C4C7CC]">
                      Puedo acompañarte a configurar, resolver dudas y avanzar
                      dentro del módulo.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {guidePrompts.map((prompt) => (
                    <div
                      key={prompt}
                      className="rounded-2xl border border-white/10 bg-[#0B0C0E]/70 p-4 text-sm font-semibold text-[#F5F6F7]"
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>
            </WamaCard>
          </div>

          <div className="mt-16">
            <WamaCard className="p-7">
              <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00E5D6]">
                    Qué incluye
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#F5F6F7]">
                    Todo listo para activar y probar.
                  </h2>
                </div>

                <WamaButton href="/trial">Comenzar prueba</WamaButton>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="wama-card-motion rounded-3xl border border-white/10 bg-white/[0.035] p-5"
                  >
                    <span className="mb-4 block h-2 w-2 rounded-full bg-[#00E5D6]" />

                    <p className="text-sm font-bold leading-6 text-[#F5F6F7]">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </WamaCard>
          </div>
        </div>
      </section>
    </WamaShell>
  );
}