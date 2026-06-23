"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { useErpData } from "@/hooks/use-erp-data";
import { useErpTheme } from "@/hooks/use-erp-theme";
import { calcularResumoERP, formatCurrency } from "@/lib/calculator";
import { companies, filterErpDataByCompany } from "@/lib/companies";
import { buildChecklistCostItems, sumChecklistCosts, type ChecklistCostItem } from "@/lib/checklist-finance";
import type { CompanyName, ErpData } from "@/lib/types";

type CompanyPreviewRow = {
  name: CompanyName;
  productionCount: number;
  faturamento: number;
  custos: number;
  lucro: number;
};

type MonthlyComparison = {
  monthLabel: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
};

export default function PreviaFinanceiraPage() {
  const { data, dataByCompany, empresaAtiva } = useErpData();
  const { theme } = useErpTheme();
  const isLight = theme.mode === "light";
  const [showCostDetails, setShowCostDetails] = useState(false);

  const resumoAtivo = useMemo(() => calcularResumoERP(dataByCompany), [dataByCompany]);
  const costItemsAtivos = useMemo(() => buildChecklistCostItems(data, empresaAtiva), [data, empresaAtiva]);
  const custosOperacionais = useMemo(() => sumChecklistCosts(costItemsAtivos), [costItemsAtivos]);
  const faturamentoEstimado = useMemo(() => roundMoney(resumoAtivo.faturamentoEstimado), [resumoAtivo.faturamentoEstimado]);
  const lucroProjetado = useMemo(() => roundMoney(faturamentoEstimado - custosOperacionais), [custosOperacionais, faturamentoEstimado]);
  const comparativo = useMemo(() => buildCompanyPreviewRows(data), [data]);
  const monthlyComparison = useMemo(() => buildMonthlyComparison(dataByCompany), [dataByCompany]);

  const handleExportCsv = () => {
    const rows = [
      ["Empresa", "Faturamento", "Custo", "Lucro", "Status"],
      ...comparativo.map((row) => [
        row.name,
        formatCurrencyForCsv(row.faturamento),
        formatCurrencyForCsv(row.custos),
        formatCurrencyForCsv(row.lucro),
        row.lucro > 0 ? "Positivo" : row.lucro < 0 ? "Negativo" : "Neutro",
      ]),
    ];

    const csvContent = "\uFEFF" + rows.map((row) => row.map(escapeCsvCell).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `previa-financeira-${monthKey(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ErpShell active="previafinanceira">
      <section className="space-y-6 font-sans">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-yellow-500">Prévia financeira</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Faturamento, custos e lucro em tempo real</h1>
            <p className="mt-4 max-w-3xl text-sm text-slate-400">
              Visão consolidada do resultado previsto, calculada a partir dos checklists, custos operacionais e produção já registrada.
            </p>
          </div>

          <div className={`rounded-2xl px-4 py-3 text-sm shadow-2xl shadow-black/20 ${isLight ? "border border-slate-200 bg-white" : "border border-yellow-950/60 bg-zinc-950"}`}>
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>Empresa ativa</p>
            <p className={isLight ? "mt-1 text-lg font-bold text-slate-900" : "mt-1 text-lg font-bold text-yellow-300"}>{empresaAtiva}</p>
          </div>
        </header>

        <div className="flex justify-end">
          <button
            className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-bold text-[#E8C75A] transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/15 hover:text-[#F4DA87]"
            onClick={handleExportCsv}
            type="button"
          >
            Exportar planilha
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            accent="blue"
            helper="valor acumulado com base na produção"
            isLight={isLight}
            label="Faturamento estimado"
            value={formatCurrency(faturamentoEstimado)}
          />
          <SummaryCard
            accent="amber"
            helper="soma dos itens lançados nos checklists"
            isLight={isLight}
            label="Custos operacionais"
            value={formatCurrency(custosOperacionais)}
          />
          <SummaryCard
            accent={lucroProjetado > 0 ? "emerald" : lucroProjetado < 0 ? "rose" : "slate"}
            helper="faturamento - custo"
            isLight={isLight}
            label="Lucro projetado"
            value={formatCurrency(lucroProjetado)}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-black p-4 shadow-2xl shadow-black/30 md:p-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-500">Comparativo</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white">Resumo por empresa</h2>
                <p className="mt-2 text-sm text-slate-400">A matemática da tabela segue exatamente: Lucro = Faturamento - Custo.</p>
              </div>

              <button
                className="inline-flex items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-300 transition hover:bg-yellow-500/15"
                onClick={() => setShowCostDetails(true)}
                data-demo-nav="true"
                type="button"
              >
                Abrir Financeiro
              </button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-500">Mês a mês</p>
                    <h3 className="mt-1 text-base font-black text-white">Faturamento x lucro</h3>
                  </div>
                  <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[11px] font-black text-yellow-300">
                    {monthlyComparison.length} meses
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <svg className="h-56 w-full bg-black" viewBox="0 0 540 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.92" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.18" />
                      </linearGradient>
                      <linearGradient id="profitGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.92" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.18" />
                      </linearGradient>
                    </defs>

                    <line x1="24" x2="516" y1="184" y2="184" stroke="#1f2937" strokeWidth="1" />
                    <line x1="24" x2="516" y1="120" y2="120" stroke="#1f2937" strokeWidth="1" strokeDasharray="6 6" />
                    <line x1="24" x2="516" y1="56" y2="56" stroke="#1f2937" strokeWidth="1" strokeDasharray="6 6" />

                    {monthlyComparison.map((item, index) => {
                      const slotWidth = 492 / Math.max(monthlyComparison.length, 1);
                      const xStart = 24 + index * slotWidth;
                      const barWidth = Math.min(slotWidth / 2.6, 34);
                      const revenueHeight = scaleHeight(item.revenue, monthlyComparison, 132);
                      const profitHeight = scaleHeight(Math.abs(item.profit), monthlyComparison, 132);
                      const revenueX = xStart + slotWidth * 0.12;
                      const profitX = revenueX + barWidth + 10;

                      return (
                        <g key={item.monthLabel}>
                          <rect x={revenueX} y={184 - revenueHeight} width={barWidth} height={revenueHeight} rx="10" fill="url(#revenueGrad)" />
                          <rect x={profitX} y={184 - profitHeight} width={barWidth} height={profitHeight} rx="10" fill="url(#profitGrad)" />
                          <text className="fill-slate-300 text-[10px]" textAnchor="middle" x={xStart + slotWidth / 2} y="206">
                            {item.monthLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-400">
                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-blue-200">Azul: faturamento</span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">Verde: lucro</span>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-500">Margem executiva</p>
                <h3 className="mt-1 text-base font-black text-white">Comparação do período atual</h3>
                <div className="mt-4 space-y-3">
                  {monthlyComparison.map((item) => (
                    <div key={item.monthLabel} className="rounded-2xl border border-white/10 bg-black px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.monthLabel}</p>
                          <p className="mt-1 text-lg font-black text-white">{formatCurrency(item.revenue)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${item.profit >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                          {item.margin.toFixed(1)}% margem
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${item.profit >= 0 ? "bg-emerald-400" : "bg-red-400"}`}
                          style={{ width: `${Math.max(Math.min(Math.abs(item.margin), 100), 8)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Custo: {formatCurrency(item.cost)}</span>
                        <span>Lucro: {formatCurrency(item.profit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Empresa</th>
                    <th className="px-4 py-4 text-right">Faturamento</th>
                    <th className="px-4 py-4 text-right">Custo</th>
                    <th className="px-4 py-4 text-right">Lucro</th>
                    <th className="px-4 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-black">
                  {comparativo.map((row) => (
                    <tr className={row.name === empresaAtiva ? "bg-yellow-500/5" : ""} key={row.name}>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-bold text-white">{row.name}</p>
                          <p className="text-xs text-slate-500">{row.productionCount} checklists no período</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-200">{formatCurrency(row.faturamento)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-200">{formatCurrency(row.custos)}</td>
                      <td className={`px-4 py-4 text-right font-semibold ${row.lucro > 0 ? "text-emerald-300" : row.lucro < 0 ? "text-red-300" : "text-slate-400"}`}>
                        {formatCurrency(row.lucro)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            row.lucro > 0
                              ? "bg-emerald-500/10 text-emerald-300"
                              : row.lucro < 0
                                ? "bg-red-500/10 text-red-300"
                                : "bg-slate-500/10 text-slate-300"
                          }`}
                        >
                          {row.lucro > 0 ? "Positivo" : row.lucro < 0 ? "Negativo" : "Neutro"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#050505] p-5 shadow-2xl shadow-black/30">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-500">Leitura rápida</p>
              <h3 className="mt-2 text-lg font-black tracking-tight text-white">Resumo do período</h3>
              <div className="mt-4 space-y-3 text-sm">
                <StatLine isLight={isLight} label="Saldo atual" value={formatCurrency(resumoAtivo.saldo)} />
                <StatLine isLight={isLight} label="A pagar" value={formatCurrency(resumoAtivo.aPagar)} tone={resumoAtivo.aPagar > 0 ? "warning" : "neutral"} />
                <StatLine isLight={isLight} label="Produção do mês" value={`${resumoAtivo.productionMonth.length} registros`} />
                <StatLine isLight={isLight} label="Resultado previsto" value={resumoAtivo.resultadoPrevisto.toUpperCase()} tone={resumoAtivo.resultadoPrevisto === "positivo" ? "success" : "danger"} />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-yellow-500/15 bg-yellow-500/8 p-5 text-sm text-slate-200">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-400">Transparência</p>
              <p className="mt-2 leading-6 text-slate-300">
                Os itens de custo são exibidos em detalhe no modal, somando cada valor unitário sem aceitar valores nulos.
              </p>
            </div>
          </aside>
        </section>
      </section>

      {showCostDetails ? (
        <CostDetailsModal
          company={empresaAtiva}
          items={costItemsAtivos}
          onClose={() => setShowCostDetails(false)}
          isLight={isLight}
          total={custosOperacionais}
        />
      ) : null}
    </ErpShell>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  accent,
  isLight,
}: {
  label: string;
  value: string;
  helper: string;
  accent: "blue" | "amber" | "emerald" | "rose" | "slate";
  isLight: boolean;
}) {
  const accents = {
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-200",
    amber: "border-yellow-500/20 bg-yellow-500/10 text-yellow-200",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
    slate: "border-slate-500/20 bg-slate-500/10 text-slate-200",
  };

  return (
    <article className={`rounded-[1.5rem] p-5 shadow-2xl ${isLight ? "border border-slate-200 bg-white shadow-slate-200/60" : "border border-white/10 bg-black shadow-black/25"}`}>
      <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${accents[accent]}`}>
        {label}
      </div>
      <p className={isLight ? "mt-4 text-3xl font-black tracking-tight text-slate-900" : "mt-4 text-3xl font-black tracking-tight text-white"}>{value}</p>
      <p className={isLight ? "mt-2 text-sm text-slate-600" : "mt-2 text-sm text-slate-400"}>{helper}</p>
    </article>
  );
}

function StatLine({
  label,
  value,
  tone = "neutral",
  isLight,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "success" | "danger";
  isLight: boolean;
}) {
  const tones = {
    neutral: "text-slate-200",
    warning: "text-yellow-300",
    success: "text-emerald-300",
    danger: "text-red-300",
  };

  return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ${isLight ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-white/[0.03]"}`}>
      <span className={isLight ? "text-slate-600" : "text-slate-400"}>{label}</span>
      <strong className={`font-black ${tones[tone]}`}>{value}</strong>
    </div>
  );
}

function CostDetailsModal({
  company,
  items,
  onClose,
  total,
  isLight,
}: {
  company: CompanyName;
  items: ChecklistCostItem[];
  onClose: () => void;
  total: number;
  isLight: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={`max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[1.75rem] shadow-2xl ${isLight ? "border border-slate-200 bg-white shadow-slate-200/70" : "border border-white/10 bg-zinc-950 shadow-black/60"}`}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-500">Abrir Financeiro</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-white">Itens de custo de {company}</h3>
            <p className="mt-2 text-sm text-slate-400">EPIs e itens associados ao custo operacional dessa empresa.</p>
          </div>
          <button
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06]"
            onClick={onClose}
            data-demo-nav="true"
            type="button"
          >
            Fechar
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">EPI / Item</th>
                  <th className="px-4 py-4 text-right">Qtd.</th>
                  <th className="px-4 py-4 text-right">R$ Unit.</th>
                  <th className="px-4 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-black">
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={4}>
                      Nenhum item de checklist encontrado para esta empresa.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{item.nome}</p>
                        <p className="text-xs text-slate-500">{item.origem}</p>
                      </td>
                      <td className="px-4 py-4 text-right text-slate-200">{formatQuantity(item.quantidade)}</td>
                      <td className="px-4 py-4 text-right text-slate-200">{formatCurrency(item.valorUnitario)}</td>
                      <td className="px-4 py-4 text-right font-bold text-white">{formatCurrency(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-500">Resumo do custo</p>
              <p className="mt-3 text-3xl font-black text-white">{formatCurrency(total)}</p>
              <p className="mt-2 text-sm text-slate-400">Soma exata dos itens listados para a empresa ativa.</p>
            </div>

            <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/8 p-4 text-sm text-slate-200">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-400">Transição</p>
              <p className="mt-2 leading-6 text-slate-300">
                Se quiser, eu também posso fazer este botão abrir diretamente a tela financeira filtrada por empresa.
              </p>
              <Link
                className="mt-4 inline-flex rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-300 transition hover:bg-yellow-500/15"
                href="/financeiro"
              >
                Ir para Financeiro
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function buildCompanyPreviewRows(data: ErpData): CompanyPreviewRow[] {
  return companies.map((company) => {
    const companyData = filterErpDataByCompany(data, company);
    const resumo = calcularResumoERP(companyData);
    const faturamento = roundMoney(resumo.faturamentoEstimado);
    const custos = roundMoney(sumChecklistCosts(buildChecklistCostItems(data, company)));
    const lucro = roundMoney(faturamento - custos);

    return {
      name: company,
      productionCount: resumo.productionMonth.length,
      faturamento,
      custos,
      lucro,
    };
  });
}

function formatCurrencyForCsv(value: number) {
  return `R$ ${roundMoney(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function escapeCsvCell(value: string) {
  const safeValue = String(value ?? "");

  if (/[;"\n\r]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }

  return safeValue;
}

function buildMonthlyComparison(dataByCompany: ErpData): MonthlyComparison[] {
  const today = new Date();
  const currentMonth = monthKey(today);
  const previousMonth = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1));

  const currentRevenue = roundMoney(sumForMonth(dataByCompany.production, currentMonth, (record) => record.points * record.value));
  const previousRevenue = roundMoney(sumForMonth(dataByCompany.production, previousMonth, (record) => record.points * record.value));
  const currentCost = roundMoney(sumForMonth(dataByCompany.finance, currentMonth, (entry) => (entry.type.toLowerCase().includes("sa") ? entry.amount : 0)));
  const previousCost = roundMoney(sumForMonth(dataByCompany.finance, previousMonth, (entry) => (entry.type.toLowerCase().includes("sa") ? entry.amount : 0)));

  return [
    {
      monthLabel: formatMonthLabel(currentMonth),
      revenue: currentRevenue,
      cost: currentCost,
      profit: roundMoney(currentRevenue - currentCost),
      margin: currentRevenue > 0 ? roundMoney(((currentRevenue - currentCost) / currentRevenue) * 100) : 0,
    },
    {
      monthLabel: formatMonthLabel(previousMonth),
      revenue: previousRevenue,
      cost: previousCost,
      profit: roundMoney(previousRevenue - previousCost),
      margin: previousRevenue > 0 ? roundMoney(((previousRevenue - previousCost) / previousRevenue) * 100) : 0,
    },
  ];
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${monthNames[Number(month) - 1] ?? month}/${year.slice(2)}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function safeMoney(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function sumForMonth<T extends { date: string }>(records: T[], month: string, mapper: (record: T) => number) {
  return records
    .filter((record) => (record.date ?? "").slice(0, 7) === month)
    .reduce((sum, record) => sum + safeMoney(mapper(record)), 0);
}

function scaleHeight(value: number, series: MonthlyComparison[], maxHeight: number) {
  const maxValue = Math.max(...series.flatMap((item) => [item.revenue, Math.abs(item.profit)]), 1);
  return Math.max((value / maxValue) * maxHeight, 12);
}

function formatQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  });
}
