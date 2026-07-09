"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Deal = { id: string; title: string; stage: string; amount_uf: number; weighted_amount_uf: number; probability: number; status: string; assigned_to?: string | null; sales_accounts?: { company_name?: string; brand_name?: string } | null };
type Metrics = { openDeals: number; closedWon: number; closedLost: number; disqualified: number; winRate: number; pipelineTotalUf: number; pipelineWeightedUf: number };
const labels: Record<string, string> = { target_account: "Target Account", first_contact: "First Contact", qualified_lead: "Qualified Lead", proposal_sent: "Proposal Sent", negotiation: "Negotiation", closing: "Closing", closed_won: "Closed Won", closed_lost: "Closed Lost", disqualified: "No califica" };
function uf(value: number | string | null | undefined) { return Number(value || 0).toLocaleString("es-CL", { maximumFractionDigits: 1 }); }
function accountName(deal: Deal) { return deal.sales_accounts?.brand_name || deal.sales_accounts?.company_name || "Sin cuenta"; }

export default function SalesHubDashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      try {
        const [d, m] = await Promise.all([fetch("/api/sales/deals", { cache: "no-store" }), fetch("/api/sales/dashboard", { cache: "no-store" })]);
        const dj = await d.json(); const mj = await m.json();
        if (!d.ok) throw new Error(dj.error || "No se pudieron cargar deals.");
        setDeals(dj.deals || []); setMetrics(mj.metrics || null);
      } catch (err) { setError(err instanceof Error ? err.message : "Error dashboard."); }
    }
    load();
  }, []);
  const byStage = useMemo(() => {
    const map: Record<string, number> = {};
    deals.forEach((deal) => { map[deal.stage] = (map[deal.stage] || 0) + 1; });
    return map;
  }, [deals]);
  const topDeals = deals.filter((deal) => deal.status === "open").sort((a,b)=>Number(b.weighted_amount_uf||0)-Number(a.weighted_amount_uf||0)).slice(0,6);
  return <main className="sales-dashboard"><header className="dash-header"><div><p>Dashboard comercial</p><h1>Resumen ejecutivo Sales Hub</h1><span>Pipeline, oportunidades relevantes y lectura comercial para reunión.</span></div><Link href="/sales-hub" className="dash-btn">← Volver al pipeline</Link></header>{error && <div className="dash-error">{error}</div>}<section className="dash-metrics"><article><span>Pipeline UF</span><strong>{uf(metrics?.pipelineTotalUf)} UF</strong></article><article><span>Ponderado UF</span><strong>{uf(metrics?.pipelineWeightedUf)} UF</strong></article><article><span>Deals abiertos</span><strong>{metrics?.openDeals ?? 0}</strong></article><article><span>Win rate</span><strong>{metrics?.winRate ?? 0}%</strong></article></section><section className="dash-grid"><div className="dash-panel"><h2>Deals por etapa</h2>{Object.entries(labels).map(([key,label]) => <div key={key} className="stage-row"><span>{label}</span><div><b style={{width:`${Math.min(100,(byStage[key]||0)*18)}%`}} /></div><strong>{byStage[key] || 0}</strong></div>)}</div><div className="dash-panel"><h2>Top oportunidades ponderadas</h2>{topDeals.map((deal)=><div key={deal.id} className="top-row"><div><strong>{accountName(deal)}</strong><span>{deal.title} · {labels[deal.stage] || deal.stage}</span></div><b>{uf(deal.weighted_amount_uf)} UF</b></div>)}{!topDeals.length && <p>No hay oportunidades abiertas.</p>}</div></section><section className="dash-conclusion"><h2>Conclusión ejecutiva</h2><p>El pipeline comercial muestra {metrics?.openDeals ?? 0} oportunidades abiertas por {uf(metrics?.pipelineTotalUf)} UF, con ponderación estimada de {uf(metrics?.pipelineWeightedUf)} UF. Priorizar próximos pasos en las oportunidades con mayor UF ponderada y mantener trazabilidad de actividades en Sales Hub.</p></section><style jsx global>{`.sales-dashboard{min-height:100vh;background:#f5f6f7;color:#071323;padding:30px}.dash-header{display:flex;justify-content:space-between;gap:20px;align-items:center;background:linear-gradient(135deg,#071323,#0b676d);color:white;border-radius:30px;padding:34px}.dash-header p{text-transform:uppercase;letter-spacing:.35em;color:#00e5d6;font-weight:950}.dash-header h1{font-size:52px;margin:0}.dash-header span{color:#d7dee8;font-weight:800}.dash-btn{background:white;color:#071323;border-radius:16px;padding:14px 18px;text-decoration:none;font-weight:950}.dash-error{background:#fff1f0;color:#b42318;padding:14px 18px;border-radius:16px;margin:16px 0;font-weight:900}.dash-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:22px 0}.dash-metrics article,.dash-panel,.dash-conclusion{background:white;border:1px solid #dbe4ef;border-radius:24px;padding:24px;box-shadow:0 12px 32px rgba(15,23,42,.08)}.dash-metrics span{text-transform:uppercase;color:#65758d;font-size:12px;font-weight:950}.dash-metrics strong{display:block;font-size:32px;margin-top:8px}.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.dash-panel h2,.dash-conclusion h2{margin-top:0}.stage-row{display:grid;grid-template-columns:170px 1fr 36px;gap:12px;align-items:center;margin:12px 0;font-weight:850}.stage-row div{height:12px;background:#eef2f7;border-radius:999px;overflow:hidden}.stage-row b{display:block;height:100%;background:#00e5d6;border-radius:999px}.top-row{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:14px 0;border-bottom:1px solid #e2e8f0}.top-row span{display:block;color:#64748b;font-weight:750}.top-row b{color:#00a89f}.dash-conclusion{margin-top:18px;font-size:18px;line-height:1.6}@media(max-width:900px){.dash-header,.dash-grid{display:block}.dash-metrics{grid-template-columns:1fr 1fr}}@media(max-width:600px){.dash-metrics{grid-template-columns:1fr}.dash-header h1{font-size:36px}}`}</style></main>;
}
