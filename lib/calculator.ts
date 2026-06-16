export type Money = number;

export type FinancialInput = {
  productionCount: number;
  averageTicket: Money;
  variableCosts: Money;
  payableTotal: Money;
  openingBalance: Money;
};

export type FinancialSummary = {
  estimatedRevenue: Money;
  variableResult: Money;
  currentBalance: Money;
  payableTotal: Money;
};

export type LedgerEntry = {
  id: string;
  description: string;
  amount: Money;
  date: string;
  category: string;
};

import type { ErpData, FinanceEntry, ProductionRecord } from "./types";

export function calcularFaturamento(pontos: number, valor: Money): Money {
  return roundCurrency(safeNumber(pontos) * safeNumber(valor));
}

export function calcularFaturamentoProducao(records: ProductionRecord[]): Money {
  return roundCurrency(records.reduce((total, record) => total + record.points * record.value, 0));
}

export function calcularVR(diasTrabalhados: number, sabados: number, valorDia = 25, valorSabado = 35): Money {
  return roundCurrency(safeNumber(diasTrabalhados) * safeNumber(valorDia) + safeNumber(sabados) * safeNumber(valorSabado));
}

export function calcularSaldo(entradas: Money[], saidas: Money[]): Money {
  return roundCurrency(sum(entradas) - sum(saidas));
}

export function calcularResumoERP(data: ErpData) {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const productionDay = data.production.filter((item) => item.date === today);
  const productionMonth = data.production.filter((item) => item.date.startsWith(currentMonth));
  const entradas = data.finance.filter((entry) => entry.type === "Entrada");
  const saidas = data.finance.filter((entry) => entry.type === "Saída");
  const despesas = sum(saidas.map((entry) => entry.amount));
  const aPagar = sum(saidas.filter((entry) => !entry.paid).map((entry) => entry.amount));
  const saldo = calcularSaldo(
    entradas.map((entry) => entry.amount),
    saidas.filter((entry) => entry.paid).map((entry) => entry.amount),
  );
  const faturamentoEstimado = calcularFaturamentoProducao(productionMonth);
  const saldoFinalPrevisto = calcularSaldo(
    [...entradas.map((entry) => entry.amount), faturamentoEstimado],
    saidas.map((entry) => entry.amount),
  );

  return {
    productionDay,
    productionMonth,
    productionByTeam: groupProductionByTeam(productionMonth),
    pendingLaunches: productionMonth.filter((item) => !item.launchedConecta),
    faturamentoEstimado,
    despesas,
    aPagar,
    saldo,
    saldoFinalPrevisto,
    resultadoPrevisto: saldoFinalPrevisto >= 0 ? "positivo" : "negativo",
  };
}

export function calculateFinanceTotals(entries: FinanceEntry[]) {
  const entradas = entries.filter((entry) => entry.type === "Entrada");
  const saidas = entries.filter((entry) => entry.type === "Saída");
  const totalEntradas = sum(entradas.map((entry) => entry.amount));
  const totalSaidas = sum(saidas.map((entry) => entry.amount));
  const totalPago = sum(saidas.filter((entry) => entry.paid).map((entry) => entry.amount));
  const totalAPagar = sum(saidas.filter((entry) => !entry.paid).map((entry) => entry.amount));

  return {
    totalEntradas,
    totalSaidas,
    totalPago,
    totalAPagar,
    saldoAtual: calcularSaldo(entradas.map((entry) => entry.amount), [totalPago]),
    saldoPrevisto: calcularSaldo(entradas.map((entry) => entry.amount), saidas.map((entry) => entry.amount)),
  };
}

export function calculateFinancialSummary(input: FinancialInput): FinancialSummary {
  const estimatedRevenue = calcularFaturamento(input.productionCount, input.averageTicket);
  const variableResult = roundCurrency(estimatedRevenue - safeNumber(input.variableCosts));
  const currentBalance = calcularSaldo(
    [input.openingBalance, variableResult],
    [input.payableTotal],
  );

  return {
    estimatedRevenue,
    variableResult,
    currentBalance,
    payableTotal: roundCurrency(input.payableTotal),
  };
}

export function formatCurrency(value: Money) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(safeNumber(value));
}

export function sum(values: Money[]) {
  return roundCurrency(values.reduce((total, value) => total + safeNumber(value), 0));
}

function groupProductionByTeam(records: ProductionRecord[]) {
  return records.reduce<Record<string, { count: number; points: number; revenue: Money }>>((acc, record) => {
    const current = acc[record.equipe] ?? { count: 0, points: 0, revenue: 0 };

    acc[record.equipe] = {
      count: current.count + 1,
      points: roundCurrency(current.points + record.points),
      revenue: roundCurrency(current.revenue + record.points * record.value),
    };

    return acc;
  }, {});
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
