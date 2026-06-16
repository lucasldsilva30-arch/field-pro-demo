"use client";

import { useEffect, useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { MetricCard } from "@/components/metric-card";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { createId, useErpData } from "@/hooks/use-erp-data";
import { calcularVR, calculateFinanceTotals, formatCurrency } from "@/lib/calculator";
import type { Employee, FinanceEntry, VrRecord } from "@/lib/types";

type FuncionariosResponse = {
  employees?: Employee[];
};

export default function FinanceiroPage() {
  const { dataByCompany, empresaAtiva, addFinanceEntry, updateFinanceEntry, addVrRecord } = useErpData();
  const [sheetEmployees, setSheetEmployees] = useState<Employee[]>([]);
  const [entryForm, setEntryForm] = useState({
    description: "",
    type: "Entrada" as FinanceEntry["type"],
    category: "",
    amount: "",
    paid: true,
  });
  const [vrForm, setVrForm] = useState({
    funcionarioId: "",
    funcionario: "",
    equipe: "",
    diasTrabalhados: "22",
    sabados: "0",
    valorDia: "25",
    valorSabado: "35",
  });
  const totals = useMemo(() => calculateFinanceTotals(dataByCompany.finance), [dataByCompany.finance]);

  useEffect(() => {
    let ignore = false;

    async function loadEmployees() {
      try {
        const response = await fetch("/api/funcionarios", { cache: "no-store" });
        const payload = (await response.json()) as FuncionariosResponse;

        if (!ignore && Array.isArray(payload.employees)) {
          setSheetEmployees(payload.employees);
        }
      } catch {
        if (!ignore) {
          setSheetEmployees([]);
        }
      }
    }

    loadEmployees();

    return () => {
      ignore = true;
    };
  }, []);

  const employeesForVr = useMemo(() => {
    const source = sheetEmployees.length > 0 ? sheetEmployees : dataByCompany.employees;

    return source
      .filter((employee) => employee.empresa === empresaAtiva && employee.situacao === "ATIVO")
      .sort((a, b) => a.funcionario.localeCompare(b.funcionario));
  }, [dataByCompany.employees, empresaAtiva, sheetEmployees]);

  const vrPreview = calcularVR(
    Number(vrForm.diasTrabalhados) || 0,
    Number(vrForm.sabados) || 0,
    Number(vrForm.valorDia) || 0,
    Number(vrForm.valorSabado) || 0,
  );
  const totalVr = dataByCompany.vr.reduce((sum, record) => sum + record.amount, 0);
  const totalDias = dataByCompany.vr.reduce((sum, record) => sum + record.diasTrabalhados, 0);
  const totalSabados = dataByCompany.vr.reduce((sum, record) => sum + record.sabados, 0);

  const handleAddEntry = () => {
    const amount = Number(entryForm.amount);

    if (!entryForm.description || !entryForm.category || !Number.isFinite(amount)) {
      return;
    }

    addFinanceEntry({
      id: createId("fin"),
      empresa: empresaAtiva,
      date: new Date().toISOString().slice(0, 10),
      description: entryForm.description,
      type: entryForm.type,
      category: entryForm.category,
      amount,
      paid: entryForm.type === "Entrada" ? true : entryForm.paid,
    });
    setEntryForm({ description: "", type: "Entrada", category: "", amount: "", paid: true });
  };

  const handleSelectEmployee = (employeeId: string) => {
    const employee = employeesForVr.find((item) => item.id === employeeId);
    const valorDia = parseMoney(employee?.vrDia) || Number(vrForm.valorDia) || 25;

    setVrForm((current) => ({
      ...current,
      funcionarioId: employeeId,
      funcionario: employee?.funcionario ?? "",
      equipe: employee?.equipe ?? "",
      valorDia: String(valorDia),
    }));
  };

  const handleAddVr = () => {
    if (!vrForm.funcionario || !vrForm.equipe) {
      return;
    }

    const diasTrabalhados = Number(vrForm.diasTrabalhados) || 0;
    const sabados = Number(vrForm.sabados) || 0;
    const valorDia = Number(vrForm.valorDia) || 0;
    const valorSabado = Number(vrForm.valorSabado) || 0;
    const record: VrRecord = {
      id: createId("vr"),
      empresa: empresaAtiva,
      funcionario: vrForm.funcionario,
      equipe: vrForm.equipe,
      diasTrabalhados,
      sabados,
      valorDia,
      valorSabado,
      amount: calcularVR(diasTrabalhados, sabados, valorDia, valorSabado),
    };

    addVrRecord(record);
    setVrForm({
      funcionarioId: "",
      funcionario: "",
      equipe: "",
      diasTrabalhados: "22",
      sabados: "0",
      valorDia: "25",
      valorSabado: "35",
    });
  };

  function handleImportFinance(rows: SpreadsheetRow[]) {
    rows.forEach((row, index) => {
      const origem = String(row.origem ?? row.Origem ?? "").toLowerCase();

      if (origem.includes("vr") || row.funcionario || row.Funcionário) {
        const diasTrabalhados = numberValue(row.diasTrabalhados ?? row.Dias ?? row.dias ?? 0);
        const sabados = numberValue(row.sabados ?? row.Sábados ?? row.sabados ?? 0);
        const valorDia = numberValue(row.valorDia ?? row["R$ Dia"] ?? row.vrDia ?? 25);
        const valorSabado = numberValue(row.valorSabado ?? row["R$ Sábado"] ?? 35);

        addVrRecord({
          id: createId("vr-import"),
          empresa: empresaAtiva,
          funcionario: text(row.funcionario ?? row.Funcionário ?? `Funcionário ${index + 1}`),
          equipe: text(row.equipe ?? row.Equipe ?? "Sem equipe"),
          diasTrabalhados,
          sabados,
          valorDia,
          valorSabado,
          amount: calcularVR(diasTrabalhados, sabados, valorDia, valorSabado),
        });

        return;
      }

      addFinanceEntry({
        id: createId("fin-import"),
        empresa: empresaAtiva,
        date: text(row.date ?? row.data) || new Date().toISOString().slice(0, 10),
        description: text(row.description ?? row.descricao ?? row.Descrição) || `Importado ${index + 1}`,
        type: normalizeFinanceType(text(row.type ?? row.tipo ?? row.Tipo)),
        category: text(row.category ?? row.categoria ?? row.Categoria) || "Importado",
        amount: numberValue(row.amount ?? row.valor ?? row.Valor),
        paid: String(row.paid ?? row.pago ?? row.Pago ?? "true").toLowerCase() !== "false",
      });
    });
  }

  return (
    <ErpShell active="financeiro">
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Financeiro</h1>
          <p className="mt-2 text-slate-400">
            Controle de entradas, saídas, contas a pagar, saldo e VR por funcionário da {empresaAtiva}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Entradas" value={formatCurrency(totals.totalEntradas)} helper="receitas cadastradas" tone="positive" />
          <MetricCard label="Despesas" value={formatCurrency(totals.totalSaidas)} helper="saídas totais" tone="danger" />
          <MetricCard label="Saldo Atual" value={formatCurrency(totals.saldoAtual)} helper="pagas consideradas" tone="warning" />
          <MetricCard label="Falta Pagar" value={formatCurrency(totals.totalAPagar)} helper="contas pendentes" tone="danger" />
        </div>

        <ModuleSpreadsheetActions
          description="Exporta e importa somente entradas, saídas e VR da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="financeiro"
          moduleLabel="Financeiro"
          onImportRows={handleImportFinance}
          rows={[
            ...dataByCompany.finance.map((entry) => ({ origem: "Financeiro", ...entry })),
            ...dataByCompany.vr.map((record) => ({ origem: "VR", ...record })),
          ]}
        />

        <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
          <h2 className="text-lg font-bold">Cadastrar Entrada ou Saída</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_180px_140px_120px_auto]">
            <input
              className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
              onChange={(event) => setEntryForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Descrição"
              value={entryForm.description}
            />
            <select
              className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
              onChange={(event) => setEntryForm((current) => ({ ...current, type: event.target.value as FinanceEntry["type"] }))}
              value={entryForm.type}
            >
              <option>Entrada</option>
              <option>Saída</option>
            </select>
            <input
              className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
              onChange={(event) => setEntryForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="Categoria"
              value={entryForm.category}
            />
            <input
              className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
              onChange={(event) => setEntryForm((current) => ({ ...current, amount: event.target.value }))}
              placeholder="Valor"
              type="number"
              value={entryForm.amount}
            />
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-3 py-3 text-sm">
              <input
                checked={entryForm.paid}
                disabled={entryForm.type === "Entrada"}
                onChange={(event) => setEntryForm((current) => ({ ...current, paid: event.target.checked }))}
                type="checkbox"
              />
              Pago
            </label>
            <button className="rounded-lg bg-yellow-500 px-4 py-3 text-sm font-extrabold text-black" onClick={handleAddEntry}>
              Adicionar
            </button>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <LedgerTable
            entries={dataByCompany.finance.filter((entry) => entry.type === "Entrada")}
            onTogglePaid={updateFinanceEntry}
            title="Entradas"
          />
          <LedgerTable
            entries={dataByCompany.finance.filter((entry) => entry.type === "Saída")}
            onTogglePaid={updateFinanceEntry}
            title="Saídas e Contas a Pagar"
          />
        </div>

        <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Controle de VR</h2>
              <p className="mt-1 text-sm text-slate-400">
                Funcionários carregados das planilhas e filtrados pela empresa ativa.
              </p>
            </div>
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
              {employeesForVr.length} funcionários ativos
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <VrSummaryCard label="R$ do lançamento" value={formatCurrency(vrPreview)} helper="prévia antes de adicionar" highlight />
            <VrSummaryCard label="Dias" value={vrForm.diasTrabalhados} helper={`Total lançado: ${totalDias}`} />
            <VrSummaryCard label="Sábados" value={vrForm.sabados} helper={`Total lançado: ${totalSabados}`} />
            <VrSummaryCard label="R$ VR total" value={formatCurrency(totalVr)} helper="somado nesta empresa" />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr_110px_110px_130px_130px_auto] lg:items-end">
            <Field label="Funcionário">
              <select
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => handleSelectEmployee(event.target.value)}
                value={vrForm.funcionarioId}
              >
                <option value="">Selecione o funcionário</option>
                {employeesForVr.map((employee) => (
                  <option key={`${employee.empresa}-${employee.id}-${employee.funcionario}`} value={employee.id}>
                    {employee.funcionario}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Equipe">
              <input
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setVrForm((current) => ({ ...current, equipe: event.target.value }))}
                placeholder="Equipe"
                value={vrForm.equipe}
              />
            </Field>
            <Field label="Dias">
              <input
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setVrForm((current) => ({ ...current, diasTrabalhados: event.target.value }))}
                placeholder="Dias"
                type="number"
                value={vrForm.diasTrabalhados}
              />
            </Field>
            <Field label="Sábados">
              <input
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setVrForm((current) => ({ ...current, sabados: event.target.value }))}
                placeholder="Sábados"
                type="number"
                value={vrForm.sabados}
              />
            </Field>
            <Field label="R$ por dia">
              <input
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setVrForm((current) => ({ ...current, valorDia: event.target.value }))}
                placeholder="R$ dia"
                type="number"
                value={vrForm.valorDia}
              />
            </Field>
            <Field label="R$ por sábado">
              <input
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setVrForm((current) => ({ ...current, valorSabado: event.target.value }))}
                placeholder="R$ sábado"
                type="number"
                value={vrForm.valorSabado}
              />
            </Field>
            <button className="rounded-lg bg-yellow-500 px-4 py-3 text-sm font-extrabold text-black" onClick={handleAddVr}>
              Adicionar VR
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Funcionário</th>
                  <th className="px-4 py-3">Equipe</th>
                  <th className="px-4 py-3">Dias</th>
                  <th className="px-4 py-3">Sábados</th>
                  <th className="px-4 py-3 text-right">R$ Dia</th>
                  <th className="px-4 py-3 text-right">R$ Sábado</th>
                  <th className="px-4 py-3 text-right">R$ VR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dataByCompany.vr.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                      Nenhum VR lançado para {empresaAtiva}.
                    </td>
                  </tr>
                ) : (
                  dataByCompany.vr.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-3 font-semibold text-slate-100">{record.funcionario || record.equipe}</td>
                      <td className="px-4 py-3 text-slate-400">{record.equipe}</td>
                      <td className="px-4 py-3 text-slate-400">{record.diasTrabalhados}</td>
                      <td className="px-4 py-3 text-slate-400">{record.sabados}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(record.valorDia ?? 25)}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(record.valorSabado ?? 35)}</td>
                      <td className="px-4 py-3 text-right font-bold text-yellow-300">{formatCurrency(record.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </ErpShell>
  );
}

function LedgerTable({
  title,
  entries,
  onTogglePaid,
}: {
  title: string;
  entries: FinanceEntry[];
  onTogglePaid: (entry: FinanceEntry) => void;
}) {
  return (
    <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 font-semibold text-slate-100">{entry.description}</td>
                <td className="px-4 py-3 text-slate-400">{entry.category}</td>
                <td className="px-4 py-3 text-slate-400">
                  {entry.type === "Entrada" ? (
                    "Recebido"
                  ) : (
                    <label className="inline-flex items-center gap-2">
                      <input checked={entry.paid} onChange={(event) => onTogglePaid({ ...entry, paid: event.target.checked })} type="checkbox" />
                      {entry.paid ? "Pago" : "A pagar"}
                    </label>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold text-yellow-300">{formatCurrency(entry.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VrSummaryCard({ label, value, helper, highlight = false }: { label: string; value: string; helper: string; highlight?: boolean }) {
  return (
    <article className={`rounded-2xl border p-4 ${highlight ? "border-yellow-500/50 bg-yellow-500/10" : "border-white/10 bg-black"}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <strong className={`mt-2 block text-2xl ${highlight ? "text-yellow-300" : "text-white"}`}>{value}</strong>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function parseMoney(value?: string) {
  const normalized = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : 0;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeFinanceType(value: string): FinanceEntry["type"] {
  return value.toLowerCase().includes("sa") || value.toLowerCase().includes("desp") ? "Saída" : "Entrada";
}
