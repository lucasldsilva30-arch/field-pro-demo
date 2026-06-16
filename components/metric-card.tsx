type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "positive" | "warning" | "danger";
};

const toneClass = {
  default: "text-slate-400",
  positive: "text-emerald-400",
  warning: "text-yellow-400",
  danger: "text-red-400",
};

export function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-sm text-slate-400">{label}</p>
      <strong className="mt-6 block text-3xl tracking-tight text-white">{value}</strong>
      <p className={`mt-2 text-sm ${toneClass[tone]}`}>{helper}</p>
    </article>
  );
}
