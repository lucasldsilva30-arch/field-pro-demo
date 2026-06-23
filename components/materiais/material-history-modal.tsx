"use client";

import type { MaterialHistoryEntry } from "@/hooks/useMateriais";
import type { MaterialRecord } from "@/lib/types";

type MaterialHistoryModalProps = {
  material: MaterialRecord | null;
  history: MaterialHistoryEntry[];
  onClose: () => void;
};

export function MaterialHistoryModal({ material, history, onClose }: MaterialHistoryModalProps) {
  if (!material) return null;

  return (
    <div data-material-modal className="fixed inset-0 z-50 bg-black/80 p-4">
      <div className="mx-auto flex h-full w-full max-w-4xl items-center justify-center">
        <section className="max-h-[90vh] w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-500">Kardex</p>
              <h2 className="mt-2 text-2xl font-black text-white">{material.material}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {material.categoria} • estoque atual {material.estoque} • mínimo {material.estoqueMinimo}
              </p>
            </div>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300"
              data-demo-nav="true"
              onClick={onClose}
              type="button"
            >
              Fechar
            </button>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Resumo</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoBox label="Estoque atual" value={String(material.estoque)} />
                <InfoBox label="Estoque mínimo" value={String(material.estoqueMinimo)} />
                <InfoBox label="Utilizado" value={String(material.utilizado)} />
                <InfoBox label="Status" value={material.status} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Movimentações</h3>
              <div className="mt-4 max-h-[58vh] space-y-3 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-6 text-sm text-slate-500">
                    Nenhuma movimentação registrada ainda.
                  </p>
                ) : (
                  history.map((entry) => (
                    <article className="rounded-2xl border border-white/10 bg-zinc-950 p-4" key={entry.id}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {entry.type} • {entry.quantity}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {entry.date} • {entry.source}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                            entry.type === "Saída" ? "bg-red-500 text-white" : "bg-emerald-500 text-black"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-slate-300">
                        <Small label="Responsável" value={entry.responsible} />
                        <Small label="Material" value={entry.material} />
                        <Small label="Nota" value={entry.note || "—"} />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
