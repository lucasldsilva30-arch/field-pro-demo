"use client";

import { ErpShell } from "@/components/erp-shell";

const colorOptions = [
  { label: "Dourado institucional", value: "#f5b900" },
  { label: "Azul corporativo", value: "#2563eb" },
  { label: "Verde operacional", value: "#22c55e" },
  { label: "Laranja destaque", value: "#f97316" },
];

export default function ConfiguracoesPage() {
  return (
    <ErpShell active="configuracoes">
      <section className="space-y-6">
        <header className="rounded-3xl border border-white/10 bg-[#06111f] p-6 shadow-2xl shadow-black/30">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] erp-accent-text">Configuracoes</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Painel visual em modo demonstracao</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            A aba de configuracoes continua visivel para navegacao, mas sem permitir alteracoes de cor, fonte ou layout.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <h2 className="text-xl font-black text-white">Aparencia</h2>
            <p className="mt-2 text-sm text-slate-400">
              Os controles abaixo foram mantidos somente como referencia visual e estao desativados nesta demo.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {colorOptions.map((option) => (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 p-4 opacity-60" key={option.value}>
                  <span className="size-8 rounded-xl border border-white/10" style={{ backgroundColor: option.value }} />
                  <span className="text-sm font-bold text-slate-100">{option.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4">
              <p className="text-sm font-bold text-slate-300">Cor personalizada</p>
              <div className="mt-3 flex items-center gap-3 opacity-60">
                <div className="h-11 w-16 rounded-xl border border-white/10 bg-[#f5b900]" />
                <span className="font-mono text-sm text-slate-300">#f5b900</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4">
              <p className="text-sm font-bold text-slate-300">Tamanho das letras</p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 w-1/2 rounded-full bg-yellow-500" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Menor</span>
                <span>100%</span>
                <span>Maior</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-2xl bg-[var(--erp-accent)] px-5 py-3 text-sm font-black text-black opacity-60"
                disabled
                type="button"
              >
                Salvar aparencia
              </button>
              <button
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 opacity-60"
                disabled
                type="button"
              >
                Restaurar padrao
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#06111f] p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] erp-accent-text">Previa</p>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-[var(--erp-accent)] text-xl font-black text-black">E</div>
                <div>
                  <p className="text-lg font-black text-white">FIELD PRO</p>
                  <p className="text-xs tracking-[0.2em] text-slate-500">OPERATIONS SUITE</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <PreviewMetric label="Producao" value="0,00 pontos" />
                <PreviewMetric label="Faturamento" value="R$ 0,00" />
                <PreviewMetric label="Despesas" value="R$ 0,00" />
                <PreviewMetric label="Saldo previsto" value="R$ 0,00" accent />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              O visual foi congelado para apresentacao e nao pode ser personalizado nesta versao.
            </p>
          </article>
        </section>
      </section>
    </ErpShell>
  );
}

function PreviewMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={accent ? "mt-1 font-black text-[var(--erp-accent)]" : "mt-1 font-black text-white"}>{value}</p>
    </div>
  );
}
