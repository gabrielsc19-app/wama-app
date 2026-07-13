"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

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
  status: string;
  source: string;
  website: string;
  description: string;
  nextStep: string;
  createdBy: string;
  commercialApproval: string;
  financeStatus: string;
  documents: string[];
  createdAt: string;
};

const STORAGE_DEALS_KEY = "wamaSalesHubDeals";
const STORAGE_DEALS_VERSION_KEY = "wamaSalesHubDealsVersion";
const CURRENT_DEALS_VERSION = "v3-clean-crm";

const stages = [
  "Target account",
  "First contact",
  "Qualified lead",
  "Proposal sent",
  "Negotiation",
  "Closing",
];

const tabs = [
  "Resumen",
  "Contactos",
  "Negociación",
  "Documentos",
  "Aprobación",
  "Finanzas",
  "Timeline",
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

function getStageScore(stage: string) {
  const index = stages.indexOf(stage);

  if (index < 0) return 10;

  return (index + 1) * 10;
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
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [activeModalTab, setActiveModalTab] = useState("Resumen");

  const [newDeal, setNewDeal] = useState({
    company: "",
    contact: "",
    stage: "Target account",
    amount: "",
    owner: "",
    probability: "25",
    source: "",
    website: "",
    description: "",
    nextStep: "",
    documents: [] as string[],
  });

  useEffect(() => {
    const storedTrial = localStorage.getItem("wamaTrialCompany");
    const storedVersion = localStorage.getItem(STORAGE_DEALS_VERSION_KEY);
    const storedDeals = localStorage.getItem(STORAGE_DEALS_KEY);

    if (storedTrial) {
      try {
        const parsedTrial = JSON.parse(storedTrial) as TrialCompany;
        setTrialCompany(parsedTrial);
      } catch {
        localStorage.removeItem("wamaTrialCompany");
      }
    }

    if (storedVersion !== CURRENT_DEALS_VERSION) {
      localStorage.removeItem(STORAGE_DEALS_KEY);
      localStorage.setItem(STORAGE_DEALS_VERSION_KEY, CURRENT_DEALS_VERSION);
      setDeals([]);
      return;
    }

    if (storedDeals) {
      try {
        const parsedDeals = JSON.parse(storedDeals) as Deal[];
        setDeals(parsedDeals);
      } catch {
        localStorage.removeItem(STORAGE_DEALS_KEY);
        setDeals([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_DEALS_KEY, JSON.stringify(deals));
    localStorage.setItem(STORAGE_DEALS_VERSION_KEY, CURRENT_DEALS_VERSION);
  }, [deals]);

  const selectedDeal = useMemo(() => {
    return deals.find((deal) => deal.id === selectedDealId) || null;
  }, [deals, selectedDealId]);

  const totalPipeline = useMemo(() => {
    return deals.reduce((sum, deal) => sum + deal.amount, 0);
  }, [deals]);

  const openDeals = useMemo(() => {
    return deals.filter((deal) => deal.stage !== "Closing");
  }, [deals]);

  const wonDeals = useMemo(() => {
    return deals.filter((deal) => deal.status === "Closed won");
  }, [deals]);

  const lostDeals = useMemo(() => {
    return deals.filter((deal) => deal.status === "Closed lost");
  }, [deals]);

  const weightedPipeline = useMemo(() => {
    return deals.reduce((sum, deal) => {
      return sum + deal.amount * (deal.probability / 100);
    }, 0);
  }, [deals]);

  const contacts = useMemo(() => {
    const uniqueContacts = new Map<string, Deal>();

    deals.forEach((deal) => {
      uniqueContacts.set(`${deal.contact}-${deal.company}`, deal);
    });

    return Array.from(uniqueContacts.values());
  }, [deals]);

  const pipelineStages = useMemo(() => {
    return stages.map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage);
      const stageAmount = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);

      return {
        name: stage,
        score: getStageScore(stage),
        deals: stageDeals,
        amount: stageAmount,
      };
    });
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
      label: "Closed won",
      value: String(wonDeals.length),
      detail: "Negocios ganados",
    },
    {
      label: "Closed lost",
      value: String(lostDeals.length),
      detail: "Negocios perdidos",
    },
    {
      label: "Contactos",
      value: String(contacts.length),
      detail: "Personas vinculadas",
    },
    {
      label: "Pipeline total",
      value: formatShortMoney(totalPipeline),
      detail: "Valor estimado",
    },
    {
      label: "Pipeline ponderado",
      value: formatShortMoney(weightedPipeline),
      detail: "Según probabilidad",
    },
  ];

  function handleCreateDeal(event: FormEvent<HTMLFormElement>) {
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
      owner: newDeal.owner || trialCompany.contactName || "Responsable comercial",
      probability: Number(newDeal.probability),
      status: "Open",
      source: newDeal.source || "No informado",
      website: newDeal.website || "No informado",
      description: newDeal.description || "Sin descripción inicial.",
      nextStep: newDeal.nextStep || "Definir próximo paso comercial.",
      createdBy: trialCompany.contactName || "Usuario trial",
      commercialApproval: "Draft",
      financeStatus: "No requerido",
      documents: newDeal.documents,
      createdAt: new Date().toISOString(),
    };

    setDeals((currentDeals) => [deal, ...currentDeals]);

    setNewDeal({
      company: "",
      contact: "",
      stage: "Target account",
      amount: "",
      owner: "",
      probability: "25",
      source: "",
      website: "",
      description: "",
      nextStep: "",
      documents: [],
    });

    setShowDealForm(false);
    setActiveView("Pipeline");
    setSelectedDealId(deal.id);
    setActiveModalTab("Resumen");
  }

  function handleDeleteDeal(id: number) {
    setDeals((currentDeals) => currentDeals.filter((deal) => deal.id !== id));

    if (selectedDealId === id) {
      setSelectedDealId(null);
    }
  }

  function handleMoveDeal(id: number, nextStage: string) {
    setDeals((currentDeals) =>
      currentDeals.map((deal) =>
        deal.id === id ? { ...deal, stage: nextStage } : deal
      )
    );
  }

  function handleUpdateDealField(id: number, field: keyof Deal, value: string) {
    setDeals((currentDeals) =>
      currentDeals.map((deal) =>
        deal.id === id
          ? {
              ...deal,
              [field]:
                field === "amount" || field === "probability"
                  ? Number(value)
                  : value,
            }
          : deal
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F6F7] text-[#0B0C0E]">
      <header className="sticky top-0 z-30 border-b border-[#E1E4E8] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[#D7DBE0] bg-white text-3xl font-black text-[#00AFA4] shadow-sm">
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
              <p className="truncate text-xs font-black uppercase tracking-[0.2em] text-[#00AFA4]">
                {trialCompany.companyName || "Empresa Demo"}
              </p>

              <div className="flex flex-wrap items-end gap-2">
                <h1 className="text-3xl font-black text-[#0B0C0E]">
                  Sales Hub
                </h1>

                <span className="pb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#8A94A3]">
                  powered by WAMA
                </span>
              </div>

              <p className="mt-1 text-sm text-[#5F6673]">
                {trialCompany.industry || "Módulo comercial"} ·{" "}
                {trialCompany.companyRut || "Trial"}
              </p>
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
                setActiveView("Pipeline");
              }}
              className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] shadow-[0_12px_30px_rgba(0,229,214,0.25)] transition hover:scale-[1.02]"
            >
              + Nuevo deal
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-6 rounded-[2rem] border border-[#E1E4E8] bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B5F]">
                Control comercial
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#0B0C0E]">
                Trabaja tus prospectos, contactos y negocios.
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#5F6673]">
                El dashboard ejecutivo se genera desde los datos reales cargados
                por el cliente. Primero carga prospectos o deals para comenzar.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                className="rounded-2xl border border-[#D7DBE0] bg-white px-4 py-3 text-sm font-semibold outline-none placeholder:text-[#8A94A3] focus:border-[#00AFA4]"
                placeholder="Buscar cliente, contacto o deal..."
              />

              <select className="rounded-2xl border border-[#D7DBE0] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#00AFA4]">
                <option>Todas las etapas</option>
                {stages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>

              <button className="rounded-2xl bg-[#0B0C0E] px-5 py-3 text-sm font-black text-white">
                Generar dashboard
              </button>
            </div>
          </div>
        </div>

        {showDealForm && (
          <CreateDealForm
            newDeal={newDeal}
            setNewDeal={setNewDeal}
            onSubmit={handleCreateDeal}
            onClose={() => setShowDealForm(false)}
          />
        )}

        {activeView === "Dashboard" && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-[1.5rem] border border-[#E1E4E8] bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5F6673]">
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
                title="Aún no tienes prospectos cargados"
                description="Carga tu primer prospecto, contacto o negocio para comenzar a usar el CRM. Luego podrás moverlo por etapas, adjuntar documentos y revisar su ficha completa."
                onAction={() => setShowDealForm(true)}
              />
            ) : (
              <PipelineBoard
                pipelineStages={pipelineStages}
                onOpenDeal={(id) => {
                  setSelectedDealId(id);
                  setActiveModalTab("Resumen");
                }}
                onMoveDeal={handleMoveDeal}
              />
            )}
          </>
        )}

        {activeView === "Deals" && (
          <>
            {deals.length === 0 ? (
              <EmptyState
                title="Carga tu primer deal"
                description="Aquí aparecerán los negocios comerciales que ingreses. Cada deal tendrá ficha, contactos, documentos, negociación y timeline."
                onAction={() => setShowDealForm(true)}
              />
            ) : (
              <DealsTable
                deals={deals}
                onOpenDeal={(id) => {
                  setSelectedDealId(id);
                  setActiveModalTab("Resumen");
                }}
                onDelete={handleDeleteDeal}
                onAdd={() => setShowDealForm(true)}
              />
            )}
          </>
        )}

        {activeView === "Pipeline" && (
          <PipelineBoard
            pipelineStages={pipelineStages}
            onOpenDeal={(id) => {
              setSelectedDealId(id);
              setActiveModalTab("Resumen");
            }}
            onMoveDeal={handleMoveDeal}
            onAdd={() => setShowDealForm(true)}
          />
        )}

        {activeView === "Contactos" && (
          <>
            {contacts.length === 0 ? (
              <EmptyState
                title="Aún no tienes contactos"
                description="Los contactos se crearán automáticamente cuando cargues tu primer prospecto o deal."
                buttonText="Cargar primer contacto"
                onAction={() => setShowDealForm(true)}
              />
            ) : (
              <ContactsGrid contacts={contacts} />
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

      {selectedDeal && (
        <DealModal
          deal={selectedDeal}
          activeTab={activeModalTab}
          setActiveTab={setActiveModalTab}
          onClose={() => setSelectedDealId(null)}
          onUpdate={handleUpdateDealField}
        />
      )}
    </main>
  );
}

function CreateDealForm({
  newDeal,
  setNewDeal,
  onSubmit,
  onClose,
}: {
  newDeal: {
    company: string;
    contact: string;
    stage: string;
    amount: string;
    owner: string;
    probability: string;
    source: string;
    website: string;
    description: string;
    nextStep: string;
    documents: string[];
  };
  setNewDeal: (deal: {
    company: string;
    contact: string;
    stage: string;
    amount: string;
    owner: string;
    probability: string;
    source: string;
    website: string;
    description: string;
    nextStep: string;
    documents: string[];
  }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).map((file) => file.name);

    setNewDeal({
      ...newDeal,
      documents: files,
    });
  }

  return (
    <div className="mb-6 rounded-[2rem] border border-[#D7DBE0] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00AFA4]">
            Ficha inicial
          </p>
          <h3 className="mt-1 text-2xl font-black text-[#0B0C0E]">
            Cargar prospecto o negocio
          </h3>
          <p className="mt-2 text-sm text-[#5F6673]">
            Esta ficha es genérica. Cada empresa puede adaptarla según lo que
            vende, arrienda, gestiona o necesita controlar.
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-full border border-[#D7DBE0] px-4 py-2 text-sm font-bold text-[#5F6673] hover:bg-[#F5F6F7]"
        >
          Cerrar
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <Field label="Empresa / prospecto">
          <input
            value={newDeal.company}
            onChange={(event) =>
              setNewDeal({ ...newDeal, company: event.target.value })
            }
            className="w-full rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
            placeholder="Ej: Centro Empresarial Apoquindo"
            required
          />
        </Field>

        <Field label="Contacto principal">
          <input
            value={newDeal.contact}
            onChange={(event) =>
              setNewDeal({ ...newDeal, contact: event.target.value })
            }
            className="w-full rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
            placeholder="Ej: Rodrigo Fuentes"
            required
          />
        </Field>

        <Field label="Etapa inicial">
          <select
            value={newDeal.stage}
            onChange={(event) =>
              setNewDeal({ ...newDeal, stage: event.target.value })
            }
            className="w-full rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
          >
            {stages.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </Field>

        <Field label="Monto estimado">
          <input
            value={newDeal.amount}
            onChange={(event) =>
              setNewDeal({ ...newDeal, amount: event.target.value })
            }
            className="w-full rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
            placeholder="Ej: 18500000"
            required
          />
        </Field>

        <Field label="Probabilidad">
          <select
            value={newDeal.probability}
            onChange={(event) =>
              setNewDeal({ ...newDeal, probability: event.target.value })
            }
            className="w-full rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
          >
            <option value="10">10%</option>
            <option value="25">25%</option>
            <option value="35">35%</option>
            <option value="50">50%</option>
            <option value="65">65%</option>
            <option value="80">80%</option>
            <option value="95">95%</option>
          </select>
        </Field>

        <Field label="Responsable">
          <input
            value={newDeal.owner}
            onChange={(event) =>
              setNewDeal({ ...newDeal, owner: event.target.value })
            }
            className="w-full rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
            placeholder="Ej: Camila Torres"
          />
        </Field>

        <Field label="Fuente">
          <input
            value={newDeal.source}
            onChange={(event) =>
              setNewDeal({ ...newDeal, source: event.target.value })
            }
            className="w-full rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
            placeholder="Ej: Contacto directo, web, referido"
          />
        </Field>

        <Field label="Sitio web">
          <input
            value={newDeal.website}
            onChange={(event) =>
              setNewDeal({ ...newDeal, website: event.target.value })
            }
            className="w-full rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
            placeholder="Ej: https://empresa.cl"
          />
        </Field>

        <Field label="Archivos adjuntos">
          <input
            type="file"
            multiple
            onChange={handleFiles}
            className="w-full rounded-2xl border border-dashed border-[#C8CDD3] bg-[#F5F6F7] px-4 py-3 text-sm outline-none"
          />
        </Field>

        <div className="grid gap-2 lg:col-span-3">
          <label className="text-sm font-bold text-[#0B0C0E]">
            Descripción / ficha inicial
          </label>
          <textarea
            value={newDeal.description}
            onChange={(event) =>
              setNewDeal({ ...newDeal, description: event.target.value })
            }
            className="min-h-[120px] rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
            placeholder="Describe la oportunidad, necesidad, servicio, producto, arriendo, proyecto o caso que se quiere gestionar."
          />
        </div>

        <div className="grid gap-2 lg:col-span-3">
          <label className="text-sm font-bold text-[#0B0C0E]">
            Próximo paso
          </label>
          <input
            value={newDeal.nextStep}
            onChange={(event) =>
              setNewDeal({ ...newDeal, nextStep: event.target.value })
            }
            className="rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] px-4 py-3 text-sm outline-none focus:border-[#00AFA4] focus:bg-white"
            placeholder="Ej: Llamar, enviar propuesta, agendar reunión, validar documentos"
          />
        </div>

        <div className="flex gap-3 lg:col-span-3">
          <button
            type="submit"
            className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] transition hover:scale-[1.02]"
          >
            Guardar ficha
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#D7DBE0] bg-white px-5 py-3 text-sm font-bold text-[#5F6673] hover:bg-[#F5F6F7]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-[#0B0C0E]">{label}</label>
      {children}
    </div>
  );
}

function EmptyState({
  title,
  description,
  buttonText = "Cargar primer prospecto",
  onAction,
}: {
  title: string;
  description: string;
  buttonText?: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#C8CDD3] bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E8FFFD] text-2xl font-black text-[#00AFA4]">
        +
      </div>

      <h3 className="mt-5 text-2xl font-black text-[#0B0C0E]">{title}</h3>

      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#5F6673]">
        {description}
      </p>

      <button
        onClick={onAction}
        className="mt-6 rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E] shadow-[0_12px_30px_rgba(0,229,214,0.25)] transition hover:scale-[1.02]"
      >
        {buttonText}
      </button>
    </div>
  );
}

function PipelineBoard({
  pipelineStages,
  onOpenDeal,
  onMoveDeal,
  onAdd,
}: {
  pipelineStages: {
    name: string;
    score: number;
    deals: Deal[];
    amount: number;
  }[];
  onOpenDeal: (id: number) => void;
  onMoveDeal: (id: number, stage: string) => void;
  onAdd?: () => void;
}) {
  return (
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

        {onAdd && (
          <button
            onClick={onAdd}
            className="rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black text-[#0B0C0E]"
          >
            + Nuevo deal
          </button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-6">
        {pipelineStages.map((stage) => (
          <div
            key={stage.name}
            className="min-h-[360px] rounded-[1.5rem] border border-[#E1E4E8] bg-[#F5F6F7] p-4"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="font-black text-[#0B0C0E]">{stage.name}</h4>
                <p className="mt-1 text-xs font-semibold text-[#5F6673]">
                  {stage.deals.length} deals · {formatShortMoney(stage.amount)}
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#5F6673]">
                {stage.score}
              </span>
            </div>

            <div className="grid gap-3">
              {stage.deals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C8CDD3] bg-white px-4 py-8 text-center text-xs leading-5 text-[#8A94A3]">
                  Sin negocios en esta etapa
                </div>
              ) : (
                stage.deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="cursor-pointer rounded-2xl border border-[#E1E4E8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => onOpenDeal(deal.id)}
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
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => onMoveDeal(deal.id, event.target.value)}
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
  );
}

function DealsTable({
  deals,
  onOpenDeal,
  onDelete,
  onAdd,
}: {
  deals: Deal[];
  onOpenDeal: (id: number) => void;
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
            className="grid cursor-pointer grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.5fr] items-center border-t border-[#E1E4E8] px-4 py-4 text-sm hover:bg-[#F5F6F7]"
            onClick={() => onOpenDeal(deal.id)}
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
              onClick={(event) => {
                event.stopPropagation();
                onDelete(deal.id);
              }}
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

function ContactsGrid({ contacts }: { contacts: Deal[] }) {
  return (
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
            <h4 className="font-black text-[#0B0C0E]">{contact.contact}</h4>
            <p className="mt-2 text-sm text-[#5F6673]">{contact.company}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#00AFA4]">
              Asociado a deal
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealModal({
  deal,
  activeTab,
  setActiveTab,
  onClose,
  onUpdate,
}: {
  deal: Deal;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose: () => void;
  onUpdate: (id: number, field: keyof Deal, value: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B0C0E]/70 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex flex-col justify-between gap-6 border-b border-[#E1E4E8] p-6 lg:flex-row lg:items-start">
          <div className="flex gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D7DBE0] bg-[#F5F6F7] text-2xl font-black text-[#00AFA4]">
              {deal.company.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B5F]">
                Deal record
              </p>

              <h2 className="mt-1 text-3xl font-black text-[#0B0C0E]">
                {deal.company}
              </h2>

              <p className="mt-1 text-sm font-semibold text-[#5F6673]">
                Contacto comercial: {deal.contact}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={deal.stage}
              onChange={(event) => onUpdate(deal.id, "stage", event.target.value)}
              className="rounded-2xl border border-[#D7DBE0] bg-white px-4 py-3 text-sm font-black outline-none"
            >
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="rounded-2xl bg-[#F5F6F7] px-5 py-3 text-sm font-black text-[#0B0C0E]"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-[#E1E4E8] px-6 py-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-black ${
                activeTab === tab
                  ? "bg-[#0B0C0E] text-white"
                  : "bg-[#F5F6F7] text-[#5F6673]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "Resumen" && (
            <div className="grid gap-5 lg:grid-cols-3">
              <InfoCard
                title="Estado del negocio"
                rows={[
                  ["Etapa", deal.stage],
                  ["Estado", deal.status],
                  ["Creado por", deal.createdBy],
                  ["Asignado a", deal.owner],
                  ["Probabilidad", `${deal.probability}%`],
                  ["Aprobación comercial", deal.commercialApproval],
                  ["Finanzas", deal.financeStatus],
                ]}
              />

              <InfoCard
                title="Cliente / prospecto"
                rows={[
                  ["Rubro", "Genérico"],
                  ["Web", deal.website],
                  ["Fuente", deal.source],
                ]}
                note={deal.description}
              />

              <InfoCard
                title="Resumen comercial"
                rows={[
                  ["Monto estimado", formatMoney(deal.amount)],
                  ["Probabilidad", `${deal.probability}%`],
                  ["Valor ponderado", formatMoney(deal.amount * (deal.probability / 100))],
                  ["Documentos", String(deal.documents.length)],
                  ["Próximo paso", deal.nextStep],
                ]}
              />
            </div>
          )}

          {activeTab === "Contactos" && (
            <SimplePanel
              title="Contactos asociados"
              description="Aquí se registran las personas clave del prospecto o cliente."
              items={[deal.contact, deal.owner]}
            />
          )}

          {activeTab === "Negociación" && (
            <SimplePanel
              title="Negociación"
              description="Registra próximos pasos, comentarios comerciales, reuniones y decisiones."
              items={[deal.nextStep, deal.description]}
            />
          )}

          {activeTab === "Documentos" && (
            <SimplePanel
              title="Documentos adjuntos"
              description="Archivos cargados en la ficha inicial del negocio."
              items={
                deal.documents.length
                  ? deal.documents
                  : ["No hay documentos adjuntos todavía."]
              }
            />
          )}

          {activeTab === "Aprobación" && (
            <SimplePanel
              title="Aprobación comercial"
              description="Control genérico para validación interna de la oportunidad."
              items={[
                `Estado: ${deal.commercialApproval}`,
                `Responsable: ${deal.owner}`,
                "Resultado: pendiente de revisión",
              ]}
            />
          )}

          {activeTab === "Finanzas" && (
            <SimplePanel
              title="Finanzas"
              description="Resumen financiero genérico asociado al negocio."
              items={[
                `Monto estimado: ${formatMoney(deal.amount)}`,
                `Valor ponderado: ${formatMoney(deal.amount * (deal.probability / 100))}`,
                `Estado financiero: ${deal.financeStatus}`,
              ]}
            />
          )}

          {activeTab === "Timeline" && (
            <SimplePanel
              title="Timeline"
              description="Historial inicial del negocio."
              items={[
                `Ficha creada: ${new Date(deal.createdAt).toLocaleString("es-CL")}`,
                `Etapa inicial: ${deal.stage}`,
                `Próximo paso: ${deal.nextStep}`,
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  rows,
  note,
}: {
  title: string;
  rows: [string, string][];
  note?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#E1E4E8] bg-white p-5 shadow-sm">
      <h3 className="mb-5 text-sm font-black uppercase tracking-[0.12em] text-[#5F6673]">
        {title}
      </h3>

      <div className="grid gap-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-5 border-b border-[#E1E4E8] pb-2 text-sm"
          >
            <span className="font-bold text-[#5F6673]">{label}</span>
            <strong className="text-right text-[#0B0C0E]">{value}</strong>
          </div>
        ))}
      </div>

      {note && (
        <div className="mt-4 rounded-2xl bg-[#F5F6F7] p-4 text-sm font-semibold leading-6 text-[#263142]">
          {note}
        </div>
      )}
    </div>
  );
}

function SimplePanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#E1E4E8] bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-black text-[#0B0C0E]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#5F6673]">{description}</p>

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[#E1E4E8] bg-[#F5F6F7] p-4 text-sm font-semibold text-[#263142]"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}