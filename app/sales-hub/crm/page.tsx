"use client";

import { useEffect, useMemo, useState } from "react";

type TrialCompany = {
  companyName: string;
  companyRut?: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  selectedModule?: string;
  companyLogo?: string | null;
  status?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialDaysRemaining?: number;
};

type Deal = {
  id: number;
  company: string;
  contact: string;
  stage: string;
  amount: number;
  owner: string;
  probability: number;
};

const stages = [
  "Prospecto",
  "Contactado",
  "Reunión",
  "Propuesta",
  "Negociación",
  "Cierre",
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortMoney(value: number) {
  if (value >= 1000000) {
    return `$${Math.round(value / 1000000)}M`;
  }

  return formatMoney(value);
}

function getRemainingDays(trialEndsAt?: string) {
  if (!trialEndsAt) return 14;

  const today = new Date();
  const endDate = new Date(trialEndsAt);
  const diff = endDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(days, 0);
}

export default function SalesHubCrmPage() {
  const [trialCompany, setTrialCompany] = useState<TrialCompany>({
    companyName: "Empresa Demo",
    companyLogo: null,
    status: "trial",
    trialDaysRemaining: 14,
  });

  const [deals, setDeals] = useState<Deal[]>([]);
  const [showDealForm, setShowDealForm] = useState(false);
  const [activeView, setActiveView] = useState("Dashboard");

  const [newDeal, setNewDeal] = useState({
    company: "",
    contact: "",
    stage: "Prospecto",
    amount: "",
    owner: "",
    probability: "25",
  });

  useEffect(() => {
    const storedTrial = localStorage.getItem("wamaTrialCompany");
    const storedDeals = localStorage.getItem("wamaSalesHubDeals");

    if (storedTrial) {
      try {
        const parsedTrial = JSON.parse(storedTrial) as TrialCompany;
        setTrialCompany(parsedTrial);
      } catch {
        localStorage.removeItem("wamaTrialCompany");
      }
    }

    if (storedDeals) {
      try {
        const parsedDeals = JSON.parse(storedDeals) as Deal[];
        setDeals(parsedDeals);
      } catch {
        localStorage.removeItem("wamaSalesHubDeals");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wamaSalesHubDeals", JSON.stringify(deals));
  }, [deals]);

  const totalPipeline = useMemo(() => {
    return deals.reduce((sum, deal) => sum + deal.amount, 0);
  }, [deals]);

  const openDeals = useMemo(() => {
    return deals.filter((deal) => deal.stage !== "Cierre");
  }, [deals]);

  const weightedPipeline = useMemo(() => {
    return deals.reduce((sum, deal) => {
      return sum + deal.amount * (deal.probability / 100);
    }, 0);
  }, [deals]);

  const pipelineStages = useMemo(() => {
    return stages.map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage);
      const stageAmount = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);

      return {
        name: stage,
        deals: stageDeals,
        amount: stageAmount,
      };
    });
  }, [deals]);

  const contacts = useMemo(() => {
    const uniqueContacts = new Map<string, Deal>();

    deals.forEach((deal) => {
      uniqueContacts.set(`${deal.contact}-${deal.company}`, deal);
    });

    return Array.from(uniqueContacts.values());
  }, [deals]);

  const remainingDays = getRemainingDays(trialCompany.trialEndsAt);

  const companyInitial = trialCompany.companyName
    ? trialCompany.companyName.slice(0, 1).toUpperCase()
    : "E";

  const kpis = [
    {
      label: "Deals abiertos",
      value: String(openDeals.length),
      detail: "Oportunidades activas",
    },
    {
      label: "Monto pipeline",
      value: formatShortMoney(totalPipeline),
      detail: "Valor total estimado",
    },
    {
      label: "Pipeline ponderado",
      value: formatShortMoney(weightedPipeline),
      detail: "Según probabilidad",
    },
    {
      label: "Contactos",
      value: String(contacts.length),
      detail: "Personas vinculadas a deals",
    },
  ];

  function handleCreateDeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amountNumber = Number(newDeal.amount.replace(/\D/g, ""));

    if (!newDeal.company || !newDeal.contact || !amountNumber) {
      return;
    }

    const deal: Deal = {
      id: Date.now(),
      company: newDeal.company,
      contact: newDeal.contact,
      stage: newDeal.stage,
      amount: amountNumber,
      owner: newDeal.owner || "Responsable comercial",
      probability: Number(newDeal.probability),
    };

    setDeals((currentDeals) => [deal, ...currentDeals]);

    setNewDeal({
      company: "",
      contact: "",
      stage: "Prospecto",
      amount: "",
      owner: "",
      probability: "25",
    });

    setShowDealForm(false);
    setActiveView("Deals");
  }

  function handleDeleteDeal(id: number) {
    setDeals((currentDeals) => currentDeals.filter((deal) => deal.id !== id));
  }

  function handleMoveDeal(id: number, nextStage: string) {
    setDeals((currentDeals) =>
      currentDeals.map((deal) =>
        deal.id === id ? { ...deal, stage: nextStage } : deal
      )
    );
  }

  function EmptyState({
    title,
    description,
    buttonText = "Cargar primer deal",
  }: {
    title: string;
    description: string;
    buttonText?: string;
  }) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[#C8CDD3] bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E8FFFD] text-2xl font-black text-[#00AFA4]">
          +
        </div>

        <h3 className="mt-5 text-2xl font-black text-[#0B0C0E]">{title}</h3>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#5F6673]">
          {description}
        </p>

        <button
          onClick={() => setShowDealForm(true)}
          className="mt-6 rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] shadow-[0_12px_30px_rgba(0,229,214,0.25)] transition hover:scale-[1.02]"
        >
          {buttonText}
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F6F7] text-[#0B0C0E]">
      <header className="sticky top-0 z-30 border-b border-[#E1E4E8] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[#D7DBE0] bg-white text-2xl font-black text-[#00AFA4] shadow-sm">
              {trialCompany.companyLogo ? (
                <img
                  src={trialCompany.companyLogo}
                  alt={`Logo ${trialCompany.companyName}`}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                companyInitial
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-[#00AFA4]">
                {trialCompany.companyName || "Empresa Demo"}
              </p>

              <div className="flex flex-wrap items-end gap-2">
                <h1 className="text-2xl font-black text-[#0B0C0E]">
                  Sales Hub
                </h1>

                <span className="pb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#8A94A3]">
                  powered by WAMA
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-[#E1E4E8] bg-[#F5F6F7] p-1 md:flex">
            {["Dashboard", "Deals", "Pipeline", "Contactos"].map((item) => (
              <button
                key={item}
                onClick={() => setActiveView(item)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeView === item
                    ? "bg-[#0B0C0E] text-white"
                    : "text-[#5F6673] hover:bg-white hover:text-[#0B0C0E]"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden rounded-2xl border border-[#CDEDEA] bg-[#E8FFFD] px-4 py-2 text-sm lg:block">
              <span className="font-black text-[#00AFA4]">Trial activo</span>
              <span className="ml-2 text-[#5F6673]">
                {remainingDays} días restantes
              </span>
            </div>

            <button
              onClick={() => {
                setShowDealForm(true);
                setActiveView("Deals");
              }}
              className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] shadow-[0_12px_30px_rgba(0,229,214,0.25)] transition hover:scale-[1.02]"
            >
              + Nuevo deal
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-[2rem] border border-[#E1E4E8] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold text-[#5F6673]">
                CRM operativo
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#0B0C0E] md:text-5xl">
                Gestiona tu pipeline comercial.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-7 text-[#5F6673]">
                Carga prospectos, contactos y negocios. Luego avanza cada deal
                por las etapas del pipeline comercial.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-[#E1E4E8] bg-[#F5F6F7] p-4 text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-[#5F6673]">Plan</span>
                <strong>Trial Sales Hub</strong>
              </div>

              <div className="flex justify-between gap-8">
                <span className="text-[#5F6673]">Usuarios incluidos</span>
                <strong>10</strong>
              </div>

              <div className="flex justify-between gap-8">
                <span className="text-[#5F6673]">Precio luego del trial</span>
                <strong>US$10 / módulo</strong>
              </div>
            </div>
          </div>
        </div>

        {showDealForm && (
          <div className="mb-6 rounded-[2rem] border border-[#D7DBE0] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                  Nuevo deal
                </p>

                <h3 className="mt-1 text-2xl font-black text-[#0B0C0E]">
                  Cargar negocio comercial
                </h3>
              </div>

              <button
                onClick={() => setShowDealForm(false)}
                className="rounded-full border border-[#D7DBE0] px-4 py-2 text-sm font-bold text-[#5F6673] hover:bg-[#F5F6F7]"
              >
                Cerrar
              </button>
            </div>

            <form
              onSubmit={handleCreateDeal}
              className="grid gap-4 lg:grid-cols-3"
            >
              <div className="grid gap-2">
                <label className="text-sm font-bold text-[#0B0C0E]">
                  Empresa / prospecto
                </label>
                <input
                  value={newDeal.company}
                  onChange={(event) =>
                    setNewDeal({ ...newDeal, company: event.target.value })
                  }
                  className="rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
                  placeholder="Ej: Centro Empresarial Apoquindo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-[#0B0C0E]">
                  Contacto
                </label>
                <input
                  value={newDeal.contact}
                  onChange={(event) =>
                    setNewDeal({ ...newDeal, contact: event.target.value })
                  }
                  className="rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
                  placeholder="Ej: Rodrigo Fuentes"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-[#0B0C0E]">
                  Etapa
                </label>
                <select
                  value={newDeal.stage}
                  onChange={(event) =>
                    setNewDeal({ ...newDeal, stage: event.target.value })
                  }
                  className="rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
                >
                  {stages.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-[#0B0C0E]">
                  Monto estimado
                </label>
                <input
                  value={newDeal.amount}
                  onChange={(event) =>
                    setNewDeal({ ...newDeal, amount: event.target.value })
                  }
                  className="rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
                  placeholder="Ej: 18500000"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-[#0B0C0E]">
                  Probabilidad
                </label>
                <select
                  value={newDeal.probability}
                  onChange={(event) =>
                    setNewDeal({ ...newDeal, probability: event.target.value })
                  }
                  className="rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
                >
                  <option value="10">10%</option>
                  <option value="25">25%</option>
                  <option value="35">35%</option>
                  <option value="50">50%</option>
                  <option value="65">65%</option>
                  <option value="80">80%</option>
                  <option value="95">95%</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-[#0B0C0E]">
                  Responsable
                </label>
                <input
                  value={newDeal.owner}
                  onChange={(event) =>
                    setNewDeal({ ...newDeal, owner: event.target.value })
                  }
                  className="rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
                  placeholder="Ej: Camila Torres"
                />
              </div>

              <div className="flex gap-3 lg:col-span-3">
                <button
                  type="submit"
                  className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] transition hover:scale-[1.02]"
                >
                  Guardar deal
                </button>

                <button
                  type="button"
                  onClick={() => setShowDealForm(false)}
                  className="rounded-full border border-[#D7DBE0] bg-white px-5 py-3 text-sm font-bold text-[#5F6673] hover:bg-[#F5F6F7]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {activeView === "Dashboard" && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-[1.75rem] border border-[#E1E4E8] bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#5F6673]">
                    {kpi.label}
                  </p>
                  <strong className="mt-3 block text-3xl font-black text-[#0B0C0E]">
                    {kpi.value}
                  </strong>
                  <p className="mt-2 text-sm text-[#5F6673]">{kpi.detail}</p>
                </div>
              ))}
            </div>

            {deals.length === 0 ? (
              <EmptyState
                title="Todavía no tienes negocios cargados"
                description="Para comenzar a trabajar en el CRM, carga tu primer prospecto o deal. Después podrás moverlo por las etapas del pipeline y controlar el avance comercial."
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <DealsTable
                  deals={deals}
                  onDelete={handleDeleteDeal}
                  onAdd={() => {
                    setShowDealForm(true);
                    setActiveView("Deals");
                  }}
                />

                <PipelineSummary pipelineStages={pipelineStages} />
              </div>
            )}
          </>
        )}

        {activeView === "Deals" && (
          <>
            {deals.length === 0 ? (
              <EmptyState
                title="Carga tu primer prospecto o negocio"
                description="Aquí aparecerán los deals que ingreses. Cada oportunidad tendrá empresa, contacto, etapa, monto estimado, probabilidad y responsable."
              />
            ) : (
              <DealsTable
                deals={deals}
                onDelete={handleDeleteDeal}
                onAdd={() => setShowDealForm(true)}
              />
            )}
          </>
        )}

        {activeView === "Pipeline" && (
          <div className="rounded-[2rem] border border-[#E1E4E8] bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                  Pipeline
                </p>
                <h3 className="mt-1 text-2xl font-black text-[#0B0C0E]">
                  Tablero de ventas
                </h3>
              </div>

              <button
                onClick={() => setShowDealForm(true)}
                className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E]"
              >
                + Nuevo deal
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-6">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.name}
                  className="min-h-[280px] rounded-[1.5rem] border border-[#E1E4E8] bg-[#F5F6F7] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-[#0B0C0E]">
                        {stage.name}
                      </h4>
                      <p className="mt-1 text-xs font-semibold text-[#5F6673]">
                        {stage.deals.length} deals ·{" "}
                        {formatShortMoney(
                          stage.deals.reduce((sum, deal) => sum + deal.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {stage.deals.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#C8CDD3] bg-white px-4 py-6 text-center text-xs leading-5 text-[#8A94A3]">
                        Sin negocios en esta etapa
                      </div>
                    ) : (
                      stage.deals.map((deal) => (
                        <div
                          key={deal.id}
                          className="rounded-2xl border border-[#E1E4E8] bg-white p-4 shadow-sm"
                        >
                          <h5 className="font-black text-[#0B0C0E]">
                            {deal.company}
                          </h5>
                          <p className="mt-1 text-xs text-[#5F6673]">
                            {deal.contact}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="rounded-full bg-[#E8FFFD] px-3 py-1 text-xs font-black text-[#00AFA4]">
                              {deal.probability}%
                            </span>
                            <strong className="text-sm">
                              {formatShortMoney(deal.amount)}
                            </strong>
                          </div>

                          <select
                            value={deal.stage}
                            onChange={(event) =>
                              handleMoveDeal(deal.id, event.target.value)
                            }
                            className="mt-3 w-full rounded-xl border border-[#D7DBE0] bg-[#F5F6F7] px-3 py-2 text-xs font-bold outline-none"
                          >
                            {stages.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === "Contactos" && (
          <>
            {contacts.length === 0 ? (
              <EmptyState
                title="Aún no tienes contactos"
                description="Los contactos se crearán automáticamente cuando cargues tu primer deal. Luego podrás gestionar personas, empresas y seguimiento comercial."
                buttonText="Cargar deal con contacto"
              />
            ) : (
              <div className="rounded-[2rem] border border-[#E1E4E8] bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                    Contactos
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-[#0B0C0E]">
                    Personas registradas
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {contacts.map((contact) => (
                    <div
                      key={`${contact.contact}-${contact.company}`}
                      className="rounded-[1.5rem] border border-[#E1E4E8] bg-[#F5F6F7] p-5"
                    >
                      <h4 className="font-black text-[#0B0C0E]">
                        {contact.contact}
                      </h4>
                      <p className="mt-2 text-sm text-[#5F6673]">
                        {contact.company}
                      </p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#00AFA4]">
                        Asociado a deal
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-6 rounded-[2rem] border border-[#E1E4E8] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                Licencia
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#0B0C0E]">
                Trial activo
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F6673]">
                La prueba gratuita dura 14 días. Luego, el acceso al módulo
                Sales Hub cuesta US$10 mensuales e incluye hasta 10 usuarios.
                Usuarios adicionales: US$10 extra.
              </p>
            </div>

            <a
              href="/licencia"
              className="inline-flex rounded-full border border-[#D7DBE0] px-4 py-2 text-sm font-black text-[#0B0C0E] hover:bg-[#F5F6F7]"
            >
              Ver plan
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function DealsTable({
  deals,
  onDelete,
  onAdd,
}: {
  deals: Deal[];
  onDelete: (id: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-[#E1E4E8] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
            Deals
          </p>
          <h3 className="mt-1 text-2xl font-black text-[#0B0C0E]">
            Negocios comerciales
          </h3>
        </div>

        <button
          onClick={onAdd}
          className="rounded-full border border-[#D7DBE0] bg-white px-4 py-2 text-sm font-bold text-[#0B0C0E] hover:bg-[#F5F6F7]"
        >
          + Agregar
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-[#E1E4E8]">
        <div className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.5fr] bg-[#F5F6F7] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#5F6673]">
          <span>Empresa</span>
          <span>Etapa</span>
          <span>Prob.</span>
          <span>Monto</span>
          <span></span>
        </div>

        {deals.map((deal) => (
          <div
            key={deal.id}
            className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.5fr] items-center border-t border-[#E1E4E8] px-4 py-4 text-sm"
          >
            <div>
              <p className="font-black text-[#0B0C0E]">{deal.company}</p>
              <p className="mt-1 text-[#5F6673]">
                {deal.contact} · {deal.owner}
              </p>
            </div>

            <span className="w-fit rounded-full bg-[#F5F6F7] px-3 py-1 font-bold text-[#5F6673]">
              {deal.stage}
            </span>

            <span className="w-fit rounded-full bg-[#E8FFFD] px-3 py-1 font-black text-[#00AFA4]">
              {deal.probability}%
            </span>

            <strong>{formatShortMoney(deal.amount)}</strong>

            <button
              onClick={() => onDelete(deal.id)}
              className="text-sm font-bold text-[#9CA3AF] hover:text-[#0B0C0E]"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineSummary({
  pipelineStages,
}: {
  pipelineStages: {
    name: string;
    deals: Deal[];
    amount: number;
  }[];
}) {
  return (
    <div className="rounded-[2rem] border border-[#E1E4E8] bg-white p-6 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
        Pipeline
      </p>
      <h3 className="mt-1 text-2xl font-black text-[#0B0C0E]">Etapas</h3>

      <div className="mt-5 grid gap-3">
        {pipelineStages.map((stage) => (
          <div
            key={stage.name}
            className="rounded-2xl border border-[#E1E4E8] bg-[#F5F6F7] p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <strong>{stage.name}</strong>
              <span className="text-sm font-bold text-[#5F6673]">
                {stage.deals.length} deals
              </span>
            </div>
            <p className="text-sm text-[#5F6673]">
              {formatShortMoney(stage.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}