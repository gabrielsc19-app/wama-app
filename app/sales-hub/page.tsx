"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import WamaLogo from "../components/WamaLogo";

type Account = { id: string; company_name: string; brand_name?: string | null; website?: string | null; industry?: string | null; assigned_to?: string | null };
type Deal = { id: string; account_id?: string | null; title: string; stage: string; probability: number; amount_uf: number; weighted_amount_uf: number; status: string; assigned_to?: string | null; next_step?: string | null; next_activity_date?: string | null; notes?: string | null; sales_accounts?: { company_name?: string; brand_name?: string; industry?: string; website?: string } | null };
type Metrics = { openDeals: number; closedWon: number; closedLost: number; disqualified: number; winRate: number; pipelineTotalUf: number; pipelineWeightedUf: number };

const stages = [
  { key: "target_account", label: "Target Account", probability: 15 },
  { key: "first_contact", label: "First Contact", probability: 30 },
  { key: "qualified_lead", label: "Qualified Lead", probability: 50 },
  { key: "proposal_sent", label: "Proposal Sent", probability: 70 },
  { key: "negotiation", label: "Negotiation", probability: 85 },
  { key: "closing", label: "Closing", probability: 95 },
];
const finalStages = [{ key: "closed_won", label: "Closed Won" }, { key: "closed_lost", label: "Closed Lost" }, { key: "disqualified", label: "No califica" }];
const emptyAccountForm = { company_name: "", brand_name: "", website: "", industry: "", source: "", initial_comment: "", assigned_to: "Sin asignar", contact_name: "", contact_email: "", contact_phone: "" };
const emptyDealForm = { account_id: "", title: "", stage: "target_account", amount_uf: "", assigned_to: "Sin asignar", next_step: "", next_activity_date: "", notes: "" };
function uf(value: number | string | null | undefined) { return Number(value || 0).toLocaleString("es-CL", { maximumFractionDigits: 1 }); }
function accountName(deal: Deal) { return deal.sales_accounts?.brand_name || deal.sales_accounts?.company_name || "Sin cuenta"; }

export default function SalesHubPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [dealForm, setDealForm] = useState(emptyDealForm);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [accountsResponse, dealsResponse, dashboardResponse] = await Promise.all([
        fetch("/api/sales/accounts", { cache: "no-store" }), fetch("/api/sales/deals", { cache: "no-store" }), fetch("/api/sales/dashboard", { cache: "no-store" }),
      ]);
      const accountsJson = await accountsResponse.json(); const dealsJson = await dealsResponse.json(); const dashboardJson = await dashboardResponse.json();
      if (!accountsResponse.ok) throw new Error(accountsJson.error || "No se pudieron cargar cuentas.");
      if (!dealsResponse.ok) throw new Error(dealsJson.error || "No se pudieron cargar deals.");
      setAccounts(accountsJson.accounts || []); setDeals(dealsJson.deals || []); setMetrics(dashboardJson.metrics || null);
    } catch (err) { setError(err instanceof Error ? err.message : "Error cargando Sales Hub."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const filteredDeals = useMemo(() => {
    const term = search.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchesStage = stageFilter === "all" || deal.stage === stageFilter;
      const target = `${deal.title} ${accountName(deal)} ${deal.assigned_to || ""} ${deal.notes || ""}`.toLowerCase();
      return matchesStage && (!term || target.includes(term));
    });
  }, [deals, search, stageFilter]);

  async function createAccount() {
    setError("");
    try {
      const response = await fetch("/api/sales/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...accountForm, created_by: "WAMA" }) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || "No se pudo crear la cuenta.");
      setAccountForm(emptyAccountForm); setShowAccountModal(false); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Error creando cuenta."); }
  }
  async function createDeal() {
    setError("");
    try {
      const response = await fetch("/api/sales/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dealForm, amount_uf: Number(dealForm.amount_uf || 0), created_by: "WAMA" }) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || "No se pudo crear el deal.");
      setDealForm(emptyDealForm); setShowDealModal(false); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Error creando deal."); }
  }
  async function moveDeal(deal: Deal, nextStage: string) {
    const comment = window.prompt("Comentario del cambio de etapa:", "Avance actualizado desde Sales Hub."); if (comment === null) return;
    try {
      const response = await fetch("/api/sales/deals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deal.id, stage: nextStage, moved_by: "WAMA", comment }) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || "No se pudo mover el deal."); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Error moviendo deal."); }
  }
  const metricCards = [["Deals abiertos", metrics?.openDeals ?? 0], ["Closed Won", metrics?.closedWon ?? 0], ["Closed Lost", metrics?.closedLost ?? 0], ["No califica", metrics?.disqualified ?? 0], ["Win rate", `${metrics?.winRate ?? 0}%`], ["Pipeline total", `${uf(metrics?.pipelineTotalUf)} UF`], ["Pipeline ponderado", `${uf(metrics?.pipelineWeightedUf)} UF`]];

  return <main className="sales-page"><header className="sales-hero"><div className="sales-hero-brand"><WamaLogo variant="light" size="md" /></div><div><p className="sales-eyebrow">Módulo comercial</p><h1>Sales Hub</h1><p>CRM comercial para gestionar target accounts, pipeline, contactos, propuestas y cierre de oportunidades.</p></div><aside className="sales-session"><span>Sesión activa</span><strong>Sales Hub</strong><p>CRM comercial</p><div className="sales-session-actions"><Link href="/app" className="btn light">← Módulos</Link><button className="btn coral" onClick={() => setShowAccountModal(true)}>+ Target account</button><button className="btn outline" onClick={loadData}>Refresh</button></div></aside></header>
  <section className="sales-control"><div><p className="sales-eyebrow coral-text">Control comercial</p><strong>Filtra por etapa, cliente o deal. El dashboard se abre como vista ejecutiva separada.</strong></div><div className="sales-filters"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, marca o deal..." /><select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}><option value="all">Todas las etapas</option>{[...stages, ...finalStages].map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select><button className="btn dark" onClick={() => setShowDealModal(true)}>+ Nuevo deal</button><Link className="btn dark" href="/sales-hub/dashboard">Generar dashboard comercial</Link></div></section>
  {error && <div className="sales-error">{error}</div>}{loading && <div className="sales-loading">Cargando Sales Hub...</div>}
  <section className="sales-metrics">{metricCards.map(([label, value]) => <article key={label} className="sales-metric"><span>{label}</span><strong>{value}</strong></article>)}</section>
  <section className="sales-kanban">{stages.map((stage) => { const stageDeals = filteredDeals.filter((deal) => deal.stage === stage.key); return <article key={stage.key} className="sales-column"><div className="sales-column-header"><div><strong>{stage.label}</strong><span>{stageDeals.length} deal(s)</span></div><b>{stage.probability}</b></div><div className="sales-card-list">{stageDeals.map((deal) => { const currentIndex = stages.findIndex((item) => item.key === deal.stage); const nextStage = currentIndex >= 0 && currentIndex < stages.length - 1 ? stages[currentIndex + 1].key : "closed_won"; return <div key={deal.id} className="deal-card"><div className="deal-logo">{accountName(deal).slice(0, 1)}</div><div className="deal-info"><strong>{accountName(deal)}</strong><span>{deal.title}</span><small>{uf(deal.amount_uf)} UF · {deal.probability}% · {deal.assigned_to || "Sin asignar"}</small></div><button title="Avanzar etapa" onClick={() => moveDeal(deal, nextStage)}>+</button></div>; })}{!stageDeals.length && <div className="empty-stage">No deals in this stage</div>}</div></article>; })}</section>
  <section className="sales-final-stages">{finalStages.map((stage) => <article key={stage.key} className="final-box"><h3>{stage.label}</h3><p>{filteredDeals.filter((deal) => deal.stage === stage.key).length} deal(s)</p></article>)}</section>
  {showAccountModal && <div className="modal-backdrop"><div className="sales-modal"><button className="modal-close" onClick={() => setShowAccountModal(false)}>Cerrar</button><p className="sales-eyebrow coral-text">Target account</p><h2>Crear cuenta objetivo</h2><div className="modal-grid"><label>Empresa / marca<input value={accountForm.company_name} onChange={(e) => setAccountForm({ ...accountForm, company_name: e.target.value })} /></label><label>Sitio web<input value={accountForm.website} onChange={(e) => setAccountForm({ ...accountForm, website: e.target.value })} /></label><label>Rubro<input value={accountForm.industry} onChange={(e) => setAccountForm({ ...accountForm, industry: e.target.value })} /></label><label>Responsable<select value={accountForm.assigned_to} onChange={(e) => setAccountForm({ ...accountForm, assigned_to: e.target.value })}><option>Sin asignar</option><option>Comercial</option><option>Owner</option></select></label><label>Nombre contacto<input value={accountForm.contact_name} onChange={(e) => setAccountForm({ ...accountForm, contact_name: e.target.value })} /></label><label>Correo contacto<input value={accountForm.contact_email} onChange={(e) => setAccountForm({ ...accountForm, contact_email: e.target.value })} /></label><label>Celular contacto<input value={accountForm.contact_phone} onChange={(e) => setAccountForm({ ...accountForm, contact_phone: e.target.value })} /></label><label>Origen / dónde se revisó<input value={accountForm.source} onChange={(e) => setAccountForm({ ...accountForm, source: e.target.value })} /></label><label className="full">Comentario inicial<textarea value={accountForm.initial_comment} onChange={(e) => setAccountForm({ ...accountForm, initial_comment: e.target.value })} /></label></div><button className="btn coral wide" onClick={createAccount}>Crear target account</button></div></div>}
  {showDealModal && <div className="modal-backdrop"><div className="sales-modal"><button className="modal-close" onClick={() => setShowDealModal(false)}>Cerrar</button><p className="sales-eyebrow coral-text">Nuevo deal</p><h2>Crear oportunidad</h2><div className="modal-grid"><label>Cuenta<select value={dealForm.account_id} onChange={(e) => setDealForm({ ...dealForm, account_id: e.target.value })}><option value="">Sin cuenta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.brand_name || account.company_name}</option>)}</select></label><label>Nombre deal<input value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} /></label><label>Etapa<select value={dealForm.stage} onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}>{stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select></label><label>Valor estimado UF<input type="number" value={dealForm.amount_uf} onChange={(e) => setDealForm({ ...dealForm, amount_uf: e.target.value })} /></label><label>Responsable<select value={dealForm.assigned_to} onChange={(e) => setDealForm({ ...dealForm, assigned_to: e.target.value })}><option>Sin asignar</option><option>Comercial</option><option>Owner</option></select></label><label>Próxima gestión<input type="date" value={dealForm.next_activity_date} onChange={(e) => setDealForm({ ...dealForm, next_activity_date: e.target.value })} /></label><label className="full">Próximo paso<input value={dealForm.next_step} onChange={(e) => setDealForm({ ...dealForm, next_step: e.target.value })} /></label><label className="full">Notas<textarea value={dealForm.notes} onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })} /></label></div><button className="btn coral wide" onClick={createDeal}>Crear deal</button></div></div>}
  <style jsx global>{`.sales-page{min-height:100vh;background:#f5f6f7;color:#070a18;font-family:inherit}.sales-hero{display:grid;grid-template-columns:160px 1fr 460px;gap:28px;align-items:center;padding:44px 34px;background:linear-gradient(135deg,#071323,#0b676d);color:white;border-radius:0 0 28px 28px;box-shadow:0 18px 44px rgba(0,0,0,.18)}.sales-hero h1{font-size:64px;line-height:.9;margin:8px 0 14px;font-weight:950}.sales-hero p{max-width:780px;font-weight:800}.sales-hero-brand{background:white;border-radius:20px;padding:24px}.sales-eyebrow{font-size:12px;letter-spacing:.42em;text-transform:uppercase;color:#00e5d6;font-weight:950}.coral-text{color:#ff684f}.sales-session{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:24px;padding:22px}.sales-session span{color:#c4c7cc}.sales-session strong{display:block;font-size:24px}.sales-session-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.btn{border:0;border-radius:16px;padding:13px 18px;font-weight:950;text-decoration:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.btn.light{background:white;color:#071323}.btn.coral{background:#ff684f;color:white}.btn.outline{background:transparent;color:white;border:1px solid rgba(255,255,255,.3)}.btn.dark{background:#070a18;color:white}.btn.wide{width:100%;margin-top:18px}.sales-control{display:grid;grid-template-columns:1fr 1.4fr;gap:24px;margin:28px auto 16px;padding:28px;max-width:1760px;background:white;border:1px solid #dbe4ef;border-radius:24px;box-shadow:0 12px 30px rgba(15,23,42,.08)}.sales-filters{display:grid;grid-template-columns:1fr 260px auto auto;gap:10px}.sales-filters input,.sales-filters select,.modal-grid input,.modal-grid select,.modal-grid textarea{width:100%;border:1px solid #cbd7e8;border-radius:16px;padding:14px 16px;font-weight:850;background:white}.sales-error,.sales-loading{max-width:1760px;margin:10px auto;padding:14px 18px;border-radius:16px;font-weight:900}.sales-error{background:#fff1f0;color:#b42318}.sales-loading{background:#e9fbfa;color:#00645f}.sales-metrics{max-width:1760px;margin:16px auto;display:grid;grid-template-columns:repeat(7,1fr);gap:14px}.sales-metric{background:white;border:1px solid #dbe4ef;border-radius:18px;padding:20px;box-shadow:0 8px 18px rgba(15,23,42,.06)}.sales-metric span{display:block;text-transform:uppercase;color:#65758d;font-weight:950;font-size:12px}.sales-metric strong{display:block;font-size:28px;margin-top:8px}.sales-kanban{max-width:1760px;margin:20px auto;display:grid;grid-template-columns:repeat(6,minmax(240px,1fr));gap:14px;overflow-x:auto}.sales-column{background:#fff;border:1px solid #dbe4ef;border-top:5px solid #ff684f;border-radius:20px;padding:14px;min-height:360px}.sales-column-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.sales-column-header strong{text-transform:uppercase;font-size:13px}.sales-column-header span{display:block;color:#65758d;font-size:12px;font-weight:800}.sales-column-header b{background:#f3f7fb;border-radius:999px;padding:7px 12px}.sales-card-list{display:grid;gap:12px}.deal-card{display:grid;grid-template-columns:48px 1fr 42px;gap:12px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:12px}.deal-logo{width:48px;height:48px;border-radius:16px;background:white;border:1px solid #dbe4ef;display:flex;align-items:center;justify-content:center;font-weight:950;color:#00a89f}.deal-info strong{display:block;text-transform:uppercase;font-size:13px}.deal-info span,.deal-info small{display:block;color:#475569;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.deal-card button{width:38px;height:38px;border:0;border-radius:999px;background:#ff684f;color:white;font-size:22px;font-weight:950;cursor:pointer}.empty-stage{border:1px dashed #cbd7e8;border-radius:16px;color:#94a3b8;text-align:center;padding:24px;font-size:13px}.sales-final-stages{max-width:1760px;margin:20px auto 50px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.final-box{background:#0b0c0e;color:white;border-radius:20px;padding:22px}.final-box h3{margin:0}.modal-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.72);display:flex;align-items:center;justify-content:center;z-index:100;padding:24px}.sales-modal{background:white;border-radius:28px;padding:28px;max-width:880px;width:100%;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.35)}.modal-close{position:absolute;right:18px;top:18px;border:0;background:#edf2f7;border-radius:999px;padding:10px 14px;font-weight:950;cursor:pointer}.modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.modal-grid label{display:grid;gap:7px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:950;color:#64748b}.modal-grid .full{grid-column:1/-1}.modal-grid textarea{min-height:90px}@media(max-width:1100px){.sales-hero,.sales-control{grid-template-columns:1fr}.sales-metrics{grid-template-columns:repeat(2,1fr)}.sales-filters{grid-template-columns:1fr}.sales-kanban{grid-template-columns:repeat(2,minmax(260px,1fr))}}@media(max-width:720px){.sales-kanban,.sales-final-stages,.modal-grid{grid-template-columns:1fr}.sales-hero h1{font-size:44px}.sales-metrics{grid-template-columns:1fr}}`}</style>
  </main>;
}
