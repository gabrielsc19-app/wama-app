import { TrendingUp } from "lucide-react";

export function StatCard({ label, value, detail, trend }: { label: string; value: string; detail?: string; trend?: string }) {
  return <article className="rounded-3xl border border-[#DCE1E6] bg-white p-6 shadow-[0_12px_35px_rgba(11,12,14,.05)]"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#69717D]">{label}</p><p className="mt-3 text-4xl font-black tracking-[-0.05em]">{value}</p>{detail && <p className="mt-2 text-sm text-[#69717D]">{detail}</p>}{trend && <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-[#008F87]"><TrendingUp className="h-4 w-4" />{trend}</p>}</article>;
}

export function SectionCard({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="rounded-3xl border border-[#DCE1E6] bg-white p-6 shadow-[0_12px_35px_rgba(11,12,14,.04)] sm:p-7"><div className="mb-6 flex items-start justify-between gap-4"><div>{eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#008F87]">{eyebrow}</p>}<h2 className="mt-1 text-xl font-black tracking-[-0.03em]">{title}</h2></div>{action}</div>{children}</section>;
}

export function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "gray" }) {
  const cls = tone === "green" ? "bg-[#D9FFF8] text-[#006E68]" : tone === "amber" ? "bg-[#FFF3D6] text-[#8A5A00]" : "bg-[#EEF1F4] text-[#59616B]";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${cls}`}>{children}</span>;
}
