import { json, SALES_STAGES, supabaseRest } from "../_shared";

type Deal = {
  id: string;
  title: string;
  stage: string;
  status: string;
  amount_uf: number | string | null;
  weighted_amount_uf: number | string | null;
  probability: number | string | null;
  created_at?: string;
  account?: {
    company_name?: string;
    brand_name?: string;
  } | null;
};

export async function GET() {
  const result = await supabaseRest<Deal[]>(
    "sales_deals?select=*,account:sales_accounts(*)&order=created_at.desc"
  );

  if (!result.ok) {
    return json({
      ok: false,
      data: {
        deals_open: 0,
        closed_won: 0,
        closed_lost: 0,
        disqualified: 0,
        win_rate: 0,
        activities_today: 0,
        pipeline_total_uf: 0,
        pipeline_weighted_uf: 0,
        by_stage: [],
        top_deals: [],
      },
      error: result.error,
      details: result.details,
    }, result.status);
  }

  const deals = Array.isArray(result.data) ? result.data : [];
  const openDeals = deals.filter((deal) => deal.status === "open");
  const wonDeals = deals.filter((deal) => deal.status === "won" || deal.stage === "closed_won");
  const lostDeals = deals.filter((deal) => deal.status === "lost" || deal.stage === "closed_lost");
  const disqualifiedDeals = deals.filter((deal) => deal.status === "disqualified" || deal.stage === "disqualified");
  const closedDeals = wonDeals.length + lostDeals.length;

  const pipelineTotalUf = openDeals.reduce((sum, deal) => sum + Number(deal.amount_uf || 0), 0);
  const pipelineWeightedUf = openDeals.reduce((sum, deal) => sum + Number(deal.weighted_amount_uf || 0), 0);

  const byStage = SALES_STAGES.map((stage) => ({
    stage,
    count: deals.filter((deal) => deal.stage === stage).length,
    total_uf: deals
      .filter((deal) => deal.stage === stage)
      .reduce((sum, deal) => sum + Number(deal.amount_uf || 0), 0),
  }));

  const topDeals = [...openDeals]
    .sort((a, b) => Number(b.amount_uf || 0) - Number(a.amount_uf || 0))
    .slice(0, 8);

  return json({
    ok: true,
    data: {
      deals_open: openDeals.length,
      closed_won: wonDeals.length,
      closed_lost: lostDeals.length,
      disqualified: disqualifiedDeals.length,
      win_rate: closedDeals ? Math.round((wonDeals.length / closedDeals) * 100) : 0,
      activities_today: 0,
      pipeline_total_uf: pipelineTotalUf,
      pipeline_weighted_uf: pipelineWeightedUf,
      by_stage: byStage,
      top_deals: topDeals,
    },
  });
}
