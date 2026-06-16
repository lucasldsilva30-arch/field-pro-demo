"use client";

import { ErpShell } from "@/components/erp-shell";
import { useErpTheme } from "@/hooks/use-erp-theme";

const colorOptions = [
  { label: "Dourado Ayronex", value: "#f5b900" },
  { label: "Azul Dashboard", value: "#2563eb" },
  { label: "Verde ProduÃ§Ã£o", value: "#22c55e" },
  { label: "Laranja OperaÃ§Ã£o", value: "#f97316" },
];

export default function ConfiguracoesPage() {
  const { theme, setTheme, resetTheme } = useErpTheme();

  return (
    <ErpShell active="configuracoes">
      <section className="space-y-6">
        <header className="rounded-3xl border border-white/10 bg-[#06111f] p-6 shadow-2xl shadow-black/30">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] erp-accent-text">ConfiguraÃ§Ãµes</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">PersonalizaÃ§Ã£o do ERP</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Ajustes simples para a cliente mudar a cor principal e o tamanho das letras do sistema.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <h2 className="text-xl font-black text-white">AparÃªncia</h2>
            <p className="mt-2 text-sm text-slate-400">Escolha uma cor pronta ou selecione uma cor personalizada.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {colorOptions.map((option) => (
                <button
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:bg-white/5 ${
                    theme.accent === option.value ? "border-[var(--erp-accent)] bg-white/5" : "border-white/10"
                  }`}
                  key={option.value}
                  onClick={() => setTheme({ ...theme, accent: option.value })}
                  type="button"
                >
                  <span className="size-8 rounded-xl border border-white/10" style={{ backgroundColor: option.value }} />
                  <span className="text-sm font-bold text-slate-100">{option.label}</span>
                </button>
              ))}
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-bold text-slate-300">Cor personalizada</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-black p-3">
                <input
                  className="h-11 w-16 cursor-pointer rounded-xl border-0 bg-transparent"
                  onChange={(event) => setTheme({ ...theme, accent: event.target.value })}
                  type="color"
                  value={theme.accent}
                />
                <span className="font-mono text-sm text-slate-300">{theme.accent}</span>
              </div>
            </label>

            <label className="mt-6 block">
              <span className="text-sm font-bold text-slate-300">Tamanho das letras</span>
              <input
                className="mt-4 w-full accent-yellow-500"
                max="1.18"
                min="0.9"
                onChange={(event) => setTheme({ ...theme, fontScale: Number(event.target.value) })}
                step="0.02"
                type="range"
                value={theme.fontScale}
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Menor</span>
                <span>{Math.round(theme.fontScale * 100)}%</span>
                <span>Maior</span>
              </div>
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-2xl bg-[var(--erp-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110"
                onClick={() => setTheme(theme)}
                type="button"
              >
                Salvar aparÃªncia
              </button>
              <button
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5"
                onClick={resetTheme}
                type="button"
              >
                Restaurar padrÃ£o
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#06111f] p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] erp-accent-text">PrÃ©via</p>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-[var(--erp-accent)] text-xl font-black text-black">A</div>
                <div>
                  <p className="text-lg font-black text-white">FIELD PRO</p>
                  <p className="text-xs tracking-[0.2em] text-slate-500">OPERATIONS SUITE</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <PreviewMetric label="ProduÃ§Ã£o" value="3,75 pontos" />
                <PreviewMetric label="Faturamento" value="R$ 80.400,00" />
                <PreviewMetric label="Despesas" value="R$ 315.200,00" />
                <PreviewMetric label="Saldo previsto" value="R$ 265.200,00" accent />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Esses ajustes ficam salvos neste navegador e aparecem em todas as abas do ERP.
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

