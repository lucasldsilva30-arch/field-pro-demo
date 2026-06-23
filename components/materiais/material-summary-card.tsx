"use client";

type MaterialSummaryCardProps = {
  active: boolean;
  helper: string;
  label: string;
  onClick: () => void;
  tone: "blue" | "green" | "yellow" | "red";
  value: string;
};

const toneStyles = {
  blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  yellow: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  red: "border-red-500/20 bg-red-500/10 text-red-300",
};

const helperStyles = {
  blue: "text-blue-200",
  green: "text-emerald-200",
  yellow: "text-yellow-200",
  red: "text-red-200",
};

export function MaterialSummaryCard({ active, helper, label, onClick, tone, value }: MaterialSummaryCardProps) {
  return (
    <button
      data-material-summary-card
      data-demo-nav="true"
      className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:border-yellow-500/60 ${
        active ? "ring-2 ring-yellow-500/50" : "border-white/10 bg-black"
      } ${toneStyles[tone]}`}
      onClick={onClick}
      type="button"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <strong className="mt-5 block text-[2rem] font-black tracking-tight text-white">{value}</strong>
      <p className={`mt-2 text-sm ${helperStyles[tone]}`}>{helper}</p>
    </button>
  );
}
