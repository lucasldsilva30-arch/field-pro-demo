"use client";

import type { MaterialReading } from "@/hooks/useMateriais";

type AutomaticReadingsPanelProps = {
  readings: MaterialReading[];
  onConfirmUsage: (reading: MaterialReading) => void;
};

export function AutomaticReadingsPanel({ readings, onConfirmUsage }: AutomaticReadingsPanelProps) {
  return (
    <section data-material-readings className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">Leitura automática</p>
          <h2 className="mt-2 text-xl font-black text-white">Itens pendentes para baixa</h2>
        </div>
        <p className="text-sm text-slate-400">{readings.length} itens aguardando confirmação</p>
      </div>

      {readings.length === 0 ? (
        <p className="mt-5 rounded-xl border border-white/10 bg-black px-4 py-6 text-sm text-slate-500">
          Nenhum item pendente encontrado. Os itens já confirmados aparecem automaticamente nas movimentações.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {readings.map((reading) => (
            <article
              className={`rounded-2xl border p-4 transition ${
                reading.pendingQuantity > 0 ? "border-yellow-500/30 bg-yellow-500/10" : "border-emerald-500/20 bg-emerald-500/10"
              }`}
              key={reading.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-500">Leitura automática</p>
                  <h3 className="mt-1 text-lg font-bold text-white">{reading.material}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                    reading.pendingQuantity > 0 ? "bg-red-500 text-white" : "bg-emerald-500 text-black"
                  }`}
                >
                  {reading.pendingQuantity > 0 ? "Pendente" : "Processado"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <MiniValue label="Quantidade" value={`${reading.pendingQuantity} un`} />
                <MiniValue label="Ocorrências" value={String(reading.count)} />
                <MiniValue label="Última data" value={reading.lastDate} />
                <MiniValue label="Responsável" value={reading.responsible} />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-extrabold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={reading.pendingQuantity <= 0}
                  onClick={() => onConfirmUsage(reading)}
                  type="button"
                >
                  Confirmar uso
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MiniValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
