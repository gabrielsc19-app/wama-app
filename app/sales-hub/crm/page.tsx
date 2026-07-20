"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Stage =
  | "Target account"
  | "First contact"
  | "Qualified lead"
  | "Proposal sent"
  | "Negotiation"
  | "Closing"
  | "Closed won"
  | "Closed lost"
  | "No califica";

type SaleType = "Spot" | "Recurrente" | "Mixta";

type Deal = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  need: string;
  saleType: SaleType;
  amount: number;
  stage: Stage;
  probability: number;
  owner: string;
  source: string;
  comment: string;
  createdAt: string;
  documents: string[];
};

const stages: Stage[] = [
  "Target account",
  "First contact",
  "Qualified lead",
  "Proposal sent",
  "Negotiation",
  "Closing",
  "Closed won",
  "Closed lost",
  "No califica",
];

const probabilityByStage: Record<Stage, number> = {
  "Target account": 10,
  "First contact": 20,
  "Qualified lead": 30,
  "Proposal sent": 45,
  Negotiation: 65,
  Closing: 85,
  "Closed won": 100,
  "Closed lost": 0,
  "No califica": 0,
};

const initialForm = {
  company: "",
  contact: "",
  email: "",
  phone: "",
  website: "",
  need: "",
  saleType: "Recurrente" as SaleType,
  amount: 0,
  stage: "Target account" as Stage,
  probability: 10,
  owner: "",
  source: "Contacto directo",
  comment: "",
};

const tabs = [
  "Resumen",
  "Contactos",
  "Negociación",
  "Documentos",
  "Aprobación comercial",
  "Finanzas",
  "Timeline",
];

function formatUf(value: number) {
  return `${Number(value || 0).toLocaleString("es-CL")} UF`;
}

function initials(name: string) {
  const clean = name.trim();

  if (!clean) return "W";

  return clean
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function SalesHubCrmPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState<string[]>([]);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedTab, setSelectedTab] = useState("Resumen");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "Todas">("Todas");
  const [probabilityFilter, setProbabilityFilter] = useState("Todas");
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleType | "Todos">(
    "Todos"
  );
  const [ownerFilter, setOwnerFilter] = useState("Todos");

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const search = `${deal.company} ${deal.contact} ${deal.email} ${deal.website} ${deal.need}`
        .toLowerCase()
        .trim();

      const matchQuery = !query || search.includes(query.toLowerCase());
      const matchStage = stageFilter === "Todas" || deal.stage === stageFilter;
      const matchSaleType =
        saleTypeFilter === "Todos" || deal.saleType === saleTypeFilter;
      const matchOwner = ownerFilter === "Todos" || deal.owner === ownerFilter;
      const matchProbability =
        probabilityFilter === "Todas" ||
        (probabilityFilter === "Alta" && deal.probability >= 70) ||
        (probabilityFilter === "Media" &&
          deal.probability >= 30 &&
          deal.probability < 70) ||
        (probabilityFilter === "Baja" && deal.probability < 30);

      return (
        matchQuery &&
        matchStage &&
        matchSaleType &&
        matchOwner &&
        matchProbability
      );
    });
  }, [deals, query, stageFilter, saleTypeFilter, ownerFilter, probabilityFilter]);

  const owners = useMemo(() => {
    const unique = Array.from(
      new Set(deals.map((deal) => deal.owner).filter(Boolean))
    );

    return ["Todos", ...unique];
  }, [deals]);

  const metrics = useMemo(() => {
    const open = deals.filter(
      (deal) =>
        deal.stage !== "Closed won" &&
        deal.stage !== "Closed lost" &&
        deal.stage !== "No califica"
    );

    const won = deals.filter((deal) => deal.stage === "Closed won");
    const lost = deals.filter((deal) => deal.stage === "Closed lost");
    const noFit = deals.filter((deal) => deal.stage === "No califica");

    const pipelineTotal = open.reduce((sum, deal) => sum + deal.amount, 0);
    const weightedPipeline = open.reduce(
      (sum, deal) => sum + deal.amount * (deal.probability / 100),
      0
    );

    const closed = won.length + lost.length;
    const winRate = closed === 0 ? 0 : Math.round((won.length / closed) * 100);

    return {
      open: open.length,
      won: won.length,
      lost: lost.length,
      noFit: noFit.length,
      pipelineTotal,
      weightedPipeline,
      winRate,
    };
  }, [deals]);

  function updateStage(id: string, stage: Stage) {
    setDeals((current) =>
      current.map((deal) =>
        deal.id === id
          ? { ...deal, stage, probability: probabilityByStage[stage] }
          : deal
      )
    );

    setSelectedDeal((current) =>
      current?.id === id
        ? { ...current, stage, probability: probabilityByStage[stage] }
        : current
    );
  }

  function createDeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.company.trim()) return;

    const newDeal: Deal = {
      id: crypto.randomUUID(),
      company: form.company.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      need: form.need.trim(),
      saleType: form.saleType,
      amount: Number(form.amount) || 0,
      stage: form.stage,
      probability: Number(form.probability) || probabilityByStage[form.stage],
      owner: form.owner.trim() || "Sin asignar",
      source: form.source,
      comment: form.comment.trim(),
      createdAt: new Date().toISOString(),
      documents: files,
    };

    setDeals((current) => [newDeal, ...current]);
    setForm(initialForm);
    setFiles([]);
    setShowNewDeal(false);
  }

  function deleteDeal(id: string) {
    setDeals((current) => current.filter((deal) => deal.id !== id));

    if (selectedDeal?.id === id) {
      setSelectedDeal(null);
    }
  }

  function dealsByStage(stage: Stage) {
    return filteredDeals.filter((deal) => deal.stage === stage);
  }

  return (
    <main className="min-h-screen bg-[#F5F6F7] text-[#0B0C0E]">
      <header className="sticky top-0 z-40 border-b border-[#D7DBE0] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-6 px-8 py-5">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D7DBE0] bg-white text-2xl font-black text-[#00AFA4] shadow-sm">
              W
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#00AFA4]">
                Empresa cliente
              </p>

              <div className="flex items-end gap-3">
                <h1 className="text-3xl font-black tracking-[-0.04em]">
                  Sales Hub
                </h1>

                <span className="pb-1 text-xs font-black uppercase tracking-[0.2em] text-[#6B7280]">
                  Powered by WAMA
                </span>
              </div>

              <p className="mt-1 text-sm text-[#5F6673]">
                CRM operativo para administrar prospectos, contactos, deals,
                pipeline y seguimiento comercial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sales-hub/crm/dashboard"
              className="rounded-full border border-[#D7DBE0] px-5 py-3 text-sm font-black"
            >
              Dashboard comercial
            </Link>

            <div className="hidden rounded-full border border-[#B8F4EF] bg-[#E9FFFD] px-5 py-3 text-sm font-black text-[#00AFA4] lg:block">
              Trial activo · 14 días
            </div>

            <button
              type="button"
              onClick={() => setShowNewDeal(true)}
              className="rounded-full bg-[#00E5D6] px-6 py-3 text-sm font-black shadow-[0_18px_48px_rgba(0,229,214,0.25)]"
            >
              + Nuevo deal
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1700px] px-8 py-8">
        <div className="mb-8 rounded-[2rem] border border-[#D7DBE0] bg-white p-6 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.8fr]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente, marca, contacto o deal..."
              className="input"
            />

            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(event.target.value as Stage | "Todas")
              }
              className="input"
            >
              <option value="Todas">Todas las etapas</option>
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>

            <select
              value={probabilityFilter}
              onChange={(event) => setProbabilityFilter(event.target.value)}
              className="input"
            >
              <option value="Todas">Todas las probabilidades</option>
              <option value="Alta">Alta · 70%+</option>
              <option value="Media">Media · 30% a 69%</option>
              <option value="Baja">Baja · menos de 30%</option>
            </select>

            <select
              value={saleTypeFilter}
              onChange={(event) =>
                setSaleTypeFilter(event.target.value as SaleType | "Todos")
              }
              className="input"
            >
              <option value="Todos">Todos los tipos</option>
              <option value="Spot">Spot</option>
              <option value="Recurrente">Recurrente</option>
              <option value="Mixta">Mixta</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              className="input"
            >
              {owners.map((owner) => (
                <option key={owner}>{owner}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <Metric label="Deals abiertos" value={metrics.open.toString()} />
          <Metric label="Closed won" value={metrics.won.toString()} />
          <Metric label="Closed lost" value={metrics.lost.toString()} />
          <Metric label="No califica" value={metrics.noFit.toString()} />
          <Metric label="Win rate" value={`${metrics.winRate}%`} />
          <Metric label="Pipeline total" value={formatUf(metrics.pipelineTotal)} />
          <Metric
            label="Pipeline ponderado"
            value={formatUf(Math.round(metrics.weightedPipeline))}
          />
        </div>

        <div className="rounded-[2.5rem] border border-[#D7DBE0] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
                Pipeline
              </p>

              <h2 className="mt-2 text-3xl font-black">Tablero de ventas</h2>
            </div>

            <button
              type="button"
              onClick={() => setShowNewDeal(true)}
              className="rounded-full bg-[#00E5D6] px-6 py-3 text-sm font-black"
            >
              + Nuevo deal
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] border border-dashed border-[#C7CDD6] bg-[#F7F9FB] p-10 text-center">
              <div className="max-w-xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
                  Comienza tu CRM
                </p>

                <h3 className="mt-3 text-4xl font-black tracking-[-0.04em]">
                  Aún no tienes oportunidades cargadas.
                </h3>

                <p className="mt-4 text-base leading-7 text-[#5F6673]">
                  Crea tu primer target account, registra un contacto comercial
                  o carga una ficha inicial para comenzar a trabajar el pipeline.
                </p>

                <button
                  type="button"
                  onClick={() => setShowNewDeal(true)}
                  className="mt-7 rounded-full bg-[#00E5D6] px-7 py-4 text-sm font-black"
                >
                  Crear primer deal
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[1600px] grid-cols-9 gap-4">
                {stages.map((stage) => {
                  const stageDeals = dealsByStage(stage);
                  const stageAmount = stageDeals.reduce(
                    (sum, deal) => sum + deal.amount,
                    0
                  );

                  return (
                    <div
                      key={stage}
                      className="min-h-[540px] rounded-[1.7rem] border border-[#D7DBE0] bg-[#F6F8FA] p-4"
                    >
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-black">{stage}</h3>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#63708A]">
                            {probabilityByStage[stage]}%
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-semibold text-[#5F6673]">
                          {stageDeals.length} deal(s) · {formatUf(stageAmount)}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {stageDeals.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-[#C7CDD6] bg-white/70 p-4 text-center text-xs font-semibold text-[#8A94A6]">
                            Sin oportunidades en esta etapa
                          </div>
                        ) : (
                          stageDeals.map((deal) => (
                            <button
                              key={deal.id}
                              type="button"
                              onClick={() => {
                                setSelectedDeal(deal);
                                setSelectedTab("Resumen");
                              }}
                              className="rounded-2xl border border-[#D7DBE0] bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-black">
                                    {deal.company}
                                  </h4>

                                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#63708A]">
                                    {deal.need || "Sin comentario inicial"}
                                  </p>
                                </div>

                                <span className="rounded-full bg-[#E6FFFC] px-2 py-1 text-xs font-black text-[#00AFA4]">
                                  {deal.probability}%
                                </span>
                              </div>

                              <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs font-bold text-[#5F6673]">
                                  {deal.saleType}
                                </span>

                                <strong className="text-sm font-black">
                                  {formatUf(deal.amount)}
                                </strong>
                              </div>

                              <div className="mt-3">
                                <select
                                  value={deal.stage}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) =>
                                    updateStage(
                                      deal.id,
                                      event.target.value as Stage
                                    )
                                  }
                                  className="w-full rounded-xl border border-[#D7DBE0] bg-[#F7F9FB] px-3 py-2 text-xs font-black outline-none"
                                >
                                  {stages.map((stageOption) => (
                                    <option key={stageOption}>
                                      {stageOption}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {showNewDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0C0E]/70 p-6 backdrop-blur-sm">
          <form
            onSubmit={createDeal}
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D7DBE0] bg-white p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00AFA4]">
                  Nuevo deal
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  Crear oportunidad comercial
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowNewDeal(false)}
                className="rounded-full bg-[#F0F2F4] px-5 py-3 text-sm font-black"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <Field label="Empresa / prospecto">
                <input
                  required
                  value={form.company}
                  onChange={(event) =>
                    setForm({ ...form, company: event.target.value })
                  }
                  className="input"
                  placeholder="Ej: Empresa Andes"
                />
              </Field>

              <Field label="Contacto principal">
                <input
                  value={form.contact}
                  onChange={(event) =>
                    setForm({ ...form, contact: event.target.value })
                  }
                  className="input"
                  placeholder="Nombre del contacto"
                />
              </Field>

              <Field label="Correo">
                <input
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className="input"
                  placeholder="contacto@empresa.cl"
                />
              </Field>

              <Field label="Teléfono">
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className="input"
                  placeholder="+569..."
                />
              </Field>

              <Field label="Sitio web">
                <input
                  value={form.website}
                  onChange={(event) =>
                    setForm({ ...form, website: event.target.value })
                  }
                  className="input"
                  placeholder="https://..."
                />
              </Field>

              <Field label="Fuente">
                <select
                  value={form.source}
                  onChange={(event) =>
                    setForm({ ...form, source: event.target.value })
                  }
                  className="input"
                >
                  <option>Contacto directo</option>
                  <option>Referido</option>
                  <option>Web</option>
                  <option>LinkedIn</option>
                  <option>Campaña</option>
                  <option>Prospección interna</option>
                </select>
              </Field>

              <Field label="Tipo de venta">
                <select
                  value={form.saleType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      saleType: event.target.value as SaleType,
                    })
                  }
                  className="input"
                >
                  <option>Spot</option>
                  <option>Recurrente</option>
                  <option>Mixta</option>
                </select>
              </Field>

              <Field label="Monto estimado UF">
                <input
                  type="number"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: Number(event.target.value) })
                  }
                  className="input"
                />
              </Field>

              <Field label="Etapa inicial">
                <select
                  value={form.stage}
                  onChange={(event) => {
                    const nextStage = event.target.value as Stage;

                    setForm({
                      ...form,
                      stage: nextStage,
                      probability: probabilityByStage[nextStage],
                    });
                  }}
                  className="input"
                >
                  {stages.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </Field>

              <Field label="Probabilidad %">
                <input
                  type="number"
                  value={form.probability}
                  min={0}
                  max={100}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      probability: Number(event.target.value),
                    })
                  }
                  className="input"
                />
              </Field>

              <Field label="Responsable">
                <input
                  value={form.owner}
                  onChange={(event) =>
                    setForm({ ...form, owner: event.target.value })
                  }
                  className="input"
                  placeholder="Nombre responsable"
                />
              </Field>

              <Field label="Adjuntos / ficha inicial">
                <input
                  type="file"
                  multiple
                  onChange={(event) =>
                    setFiles(
                      Array.from(event.target.files || []).map((file) => file.name)
                    )
                  }
                  className="input"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Qué vende, qué necesita o comentario inicial">
                  <textarea
                    value={form.need}
                    onChange={(event) =>
                      setForm({ ...form, need: event.target.value })
                    }
                    className="input min-h-28 resize-none"
                    placeholder="Describe la oportunidad, necesidad, producto o servicio..."
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Comentario interno">
                  <textarea
                    value={form.comment}
                    onChange={(event) =>
                      setForm({ ...form, comment: event.target.value })
                    }
                    className="input min-h-24 resize-none"
                    placeholder="Primer comentario comercial..."
                  />
                </Field>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#D7DBE0] bg-white p-6">
              <button
                type="button"
                onClick={() => setShowNewDeal(false)}
                className="rounded-full border border-[#D7DBE0] px-6 py-3 text-sm font-black"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rounded-full bg-[#00E5D6] px-7 py-3 text-sm font-black"
              >
                Crear deal
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0C0E]/70 p-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-20 border-b border-[#D7DBE0] bg-white">
              <div className="flex items-start justify-between gap-6 p-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D7DBE0] bg-[#F7F9FB] text-xl font-black text-[#00AFA4]">
                    {initials(selectedDeal.company)}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6B5F]">
                      Deal record
                    </p>

                    <h2 className="text-3xl font-black tracking-[-0.04em]">
                      {selectedDeal.company}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-[#63708A]">
                      Contacto comercial{" "}
                      {selectedDeal.contact || "sin registrar"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedDeal.stage}
                    onChange={(event) =>
                      updateStage(selectedDeal.id, event.target.value as Stage)
                    }
                    className="rounded-2xl border border-[#D7DBE0] bg-white px-5 py-3 text-sm font-black outline-none"
                  >
                    {stages.map((stage) => (
                      <option key={stage}>{stage}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setSelectedDeal(null)}
                    className="rounded-full bg-[#F0F2F4] px-5 py-3 text-sm font-black"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto px-6 pb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedTab(tab)}
                    className={`rounded-full px-5 py-3 text-sm font-black ${
                      selectedTab === tab
                        ? "bg-[#0B0C0E] text-white"
                        : "bg-[#EEF1F4] text-[#63708A]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-3">
              <InfoCard title="Estado del negocio">
                <InfoRow label="Etapa" value={selectedDeal.stage} />
                <InfoRow label="Tipo venta" value={selectedDeal.saleType} />
                <InfoRow label="Responsable" value={selectedDeal.owner} />
                <InfoRow
                  label="Probabilidad"
                  value={`${selectedDeal.probability}%`}
                />
                <InfoRow label="Fuente" value={selectedDeal.source} />
                <InfoRow label="Moneda" value="UF" />
              </InfoCard>

              <InfoCard title="Target account">
                <InfoRow
                  label="Contacto"
                  value={selectedDeal.contact || "No informado"}
                />
                <InfoRow
                  label="Correo"
                  value={selectedDeal.email || "No informado"}
                />
                <InfoRow
                  label="Teléfono"
                  value={selectedDeal.phone || "No informado"}
                />
                <InfoRow
                  label="Web"
                  value={selectedDeal.website || "No informada"}
                />
              </InfoCard>

              <InfoCard title="Resumen comercial">
                <InfoRow
                  label="Monto estimado"
                  value={formatUf(selectedDeal.amount)}
                />
                <InfoRow
                  label="Monto ponderado"
                  value={formatUf(
                    Math.round(
                      selectedDeal.amount * (selectedDeal.probability / 100)
                    )
                  )}
                />
                <InfoRow
                  label="Documentos"
                  value={selectedDeal.documents.length.toString()}
                />
                <InfoRow label="Aprobación comercial" value="Draft" />
                <InfoRow label="Finanzas" value="No requerido" />
              </InfoCard>

              <div className="lg:col-span-3">
                <InfoCard title={selectedTab}>
                  {selectedTab === "Resumen" && (
                    <p className="text-sm leading-7 text-[#344054]">
                      {selectedDeal.comment ||
                        selectedDeal.need ||
                        "Registra aquí el resumen ejecutivo del negocio, próximos pasos, riesgos y avances comerciales."}
                    </p>
                  )}

                  {selectedTab === "Contactos" && (
                    <div>
                      <InfoRow
                        label="Contacto principal"
                        value={selectedDeal.contact || "Pendiente"}
                      />
                      <InfoRow
                        label="Correo"
                        value={selectedDeal.email || "Pendiente"}
                      />
                      <InfoRow
                        label="Teléfono"
                        value={selectedDeal.phone || "Pendiente"}
                      />
                    </div>
                  )}

                  {selectedTab === "Negociación" && (
                    <p className="text-sm leading-7 text-[#344054]">
                      Etapa actual: <strong>{selectedDeal.stage}</strong>.
                      Probabilidad: <strong>{selectedDeal.probability}%</strong>.
                      Próximo paso: registrar actividad comercial y fecha de
                      seguimiento.
                    </p>
                  )}

                  {selectedTab === "Documentos" && (
                    <div className="grid gap-3">
                      {selectedDeal.documents.length === 0 ? (
                        <p className="text-sm text-[#63708A]">
                          No hay documentos cargados en esta oportunidad.
                        </p>
                      ) : (
                        selectedDeal.documents.map((document) => (
                          <div
                            key={document}
                            className="rounded-2xl border border-[#D7DBE0] bg-[#F7F9FB] p-4 text-sm font-bold"
                          >
                            {document}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {selectedTab === "Aprobación comercial" && (
                    <p className="text-sm leading-7 text-[#344054]">
                      Estado inicial: Draft. En una siguiente versión se podrá
                      enviar a revisión comercial, solicitar aprobación y
                      bloquear cambios críticos.
                    </p>
                  )}

                  {selectedTab === "Finanzas" && (
                    <p className="text-sm leading-7 text-[#344054]">
                      Finanzas no requerido en esta etapa. Cuando el deal avance,
                      se podrá solicitar revisión documental y condiciones de pago.
                    </p>
                  )}

                  {selectedTab === "Timeline" && (
                    <div className="rounded-2xl border border-[#D7DBE0] bg-[#F7F9FB] p-4 text-sm">
                      <strong>Deal creado</strong>
                      <p className="mt-1 text-[#63708A]">
                        {new Date(selectedDeal.createdAt).toLocaleString(
                          "es-CL"
                        )}
                      </p>
                    </div>
                  )}
                </InfoCard>
              </div>

              <div className="flex justify-end lg:col-span-3">
                <button
                  type="button"
                  onClick={() => deleteDeal(selectedDeal.id)}
                  className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600"
                >
                  Eliminar deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #d7dbe0;
          background: #ffffff;
          padding: 0.85rem 1rem;
          font-size: 0.9rem;
          font-weight: 700;
          outline: none;
        }

        .input:focus {
          border-color: #00afa4;
        }
      `}</style>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[#D7DBE0] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#63708A]">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black tracking-[-0.03em]">{value}</p>
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
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#63708A]">
        {label}
      </span>

      {children}
    </label>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.7rem] border border-[#D7DBE0] bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-sm font-black uppercase tracking-[0.14em] text-[#63708A]">
        {title}
      </h3>

      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EEF1F4] py-3 text-sm last:border-b-0">
      <span className="font-bold text-[#63708A]">{label}</span>

      <strong className="text-right font-black text-[#0B0C0E]">{value}</strong>
    </div>
  );
}