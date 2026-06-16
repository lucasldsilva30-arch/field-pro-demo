"use client";

import { ErpShell } from "@/components/erp-shell";
import { MetricCard } from "@/components/metric-card";
import { ModuleSpreadsheetActions } from "@/components/module-spreadsheet-actions";
import { useErpData } from "@/hooks/use-erp-data";
import { calculateFinanceTotals, formatCurrency } from "@/lib/calculator";

export default function FinanceiroPage() {
  const { dataByCompany, empresaAtiva } = useErpData();
  const totals = calculateFinanceTotals(dataByCompany.finance);
  const totalVr = dataByCompany.vr.reduce((sum, record) => sum + record.amount, 0);

  return (
    <ErpShell active="financeiro">
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Financeiro</h1>
          <p className="mt-2 text-slate-400">
            Demonstracao visual do modulo financeiro, sem cadastro, edicao, VR ou redefinicao de valores.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Entradas" value={formatCurrency(totals.totalEntradas)} helper="sem lancamentos ativos" tone="positive" />
          <MetricCard label="Despesas" value={formatCurrency(totals.totalSaidas)} helper="sem despesas registradas" tone="danger" />
          <MetricCard label="Saldo Atual" value={formatCurrency(totals.saldoAtual)} helper="painel em modo leitura" tone="warning" />
          <MetricCard label="VR Previsto" value={formatCurrency(totalVr)} helper="controle desativado na demo" tone="warning" />
        </div>

        <ModuleSpreadsheetActions
          description="Nesta demonstracao o financeiro fica bloqueado para importacao, exportacao e novos lancamentos."
          empresa={empresaAtiva}
          moduleKey="financeiro"
          moduleLabel="Financeiro"
          rows={[...dataByCompany.finance, ...dataByCompany.vr]}
        />

        <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
          <h2 className="text-lg font-bold text-white">Resumo financeiro</h2>
          <p className="mt-2 text-sm text-slate-400">
            Os indicadores abaixo foram mantidos apenas para navegacao da interface.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SummaryBlock label="Contas a pagar" value={formatCurrency(totals.totalAPagar)} />
            <SummaryBlock label="Saldo previsto" value={formatCurrency(totals.saldoPrevisto)} />
            <SummaryBlock label="VR" value={formatCurrency(totalVr)} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <LedgerTable
            title="Entradas"
            emptyText="Nenhuma entrada exibida nesta demonstracao."
            headers={["Descricao", "Categoria", "Valor"]}
          />
          <LedgerTable
            title="Saidas e contas a pagar"
            emptyText="Nenhuma saida exibida nesta demonstracao."
            headers={["Descricao", "Categoria", "Valor"]}
          />
        </section>

        <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Controle de VR</h2>
              <p className="mt-1 text-sm text-slate-400">
                O modulo de VR foi mantido apenas como visualizacao e nao aceita inclusoes na demo.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-bold text-slate-300">
              Adicao de VR desativada
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Funcionario</th>
                  <th className="px-4 py-3">Equipe</th>
                  <th className="px-4 py-3">Dias</th>
                  <th className="px-4 py-3">Sabados</th>
                  <th className="px-4 py-3 text-right">R$ Dia</th>
                  <th className="px-4 py-3 text-right">R$ Sabado</th>
                  <th className="px-4 py-3 text-right">R$ VR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                    Nenhum VR lancado nesta demonstracao.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </ErpShell>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black px-4 py-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function LedgerTable({
  title,
  headers,
  emptyText,
}: {
  title: string;
  headers: string[];
  emptyText: string;
}) {
  return (
    <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              {headers.map((header) => (
                <th className="px-4 py-3" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={headers.length}>
                {emptyText}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
