"use client";

import { useEffect, useMemo, useState } from "react";
import { parseMoney } from "@/lib/currency";
import { useFinanceStore, type FinanceFormState } from "@/stores/finance";
import { ErpShell } from "@/components/erp-shell";
import { DatePickerField } from "@/components/date-picker-field";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { createId, useErpData } from "@/hooks/use-erp-data";
import { calculateFinanceTotals, formatCurrency } from "@/lib/calculator";
import { formatDateBr } from "@/lib/date";
import type { FinanceEntry } from "@/lib/types";

const emptyForm = (): FinanceFormState => ({
  date: getCurrentDate(),
  dueDate: "",
  description: "",
  type: "Entrada",
  category: "",
  amount: "",
  paid: true,
});

export default function FinanceiroPage() {
  const { dataByCompany, empresaAtiva, addFinanceEntry, updateFinanceEntry, deleteFinanceEntry } = useErpData();
  const [selectedPeriodDate, setSelectedPeriodDate] = useState<string>(getCurrentPeriodDate());
  const [summaryFocus, setSummaryFocus] = useState<"all" | "entries" | "expenses" | "pending">("all");

  // State from Zustand store
  const {
    mode,
    setMode,
    newForm,
    setNewForm,
    newFormErrors,
    setNewFormErrors,
    editingEntry,
    setEditingEntry,
    editForm,
    setEditForm,
    editFormErrors,
    setEditFormErrors,
    feedback,
    feedbackType,
    setFeedback,
    clearFeedback,
    resetNewForm,
    resetEditForm,
  } = useFinanceStore();

  const selectedPeriod = selectedPeriodDate.slice(0, 7);

  useEffect(() => {
    if (!feedback) return;
    if (feedbackType !== "success") return;

    const id = setTimeout(() => {
      clearFeedback();
    }, 3500);

    return () => clearTimeout(id);
  }, [feedback, feedbackType, clearFeedback]);

  const filteredFinance = useMemo(
    () => dataByCompany.finance.filter((entry) => matchesPeriod(entry.date, selectedPeriod) || matchesPeriod(entry.dueDate, selectedPeriod)),
    [dataByCompany.finance, selectedPeriod],
  );

  const filteredEntries = useMemo(
    () => filteredFinance.filter((entry) => entry.type === "Entrada"),
    [filteredFinance],
  );
  const filteredExpenses = useMemo(
    () => filteredFinance.filter((entry) => entry.type.toLowerCase().includes("sa")),
    [filteredFinance],
  );
  const pendingExpenses = useMemo(() => filteredExpenses.filter((entry) => !entry.paid), [filteredExpenses]);
  const pendingCount = useMemo(() => filteredExpenses.filter((e) => !e.paid).length, [filteredExpenses]);
  const totals = useMemo(() => calculateFinanceTotals(filteredFinance), [filteredFinance]);
  const categorySummary = useMemo(() => {
    const grouped = filteredExpenses.reduce<Record<string, { total: number; count: number }>>((acc, entry) => {
      const key = entry.category || "Sem categoria";
      const current = acc[key] ?? { total: 0, count: 0 };
      acc[key] = {
        total: current.total + entry.amount,
        count: current.count + 1,
      };
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  const isAPagarAlert = totals.totalAPagar > 0;
  const visibleEntries = useMemo(() => {
    if (summaryFocus === "expenses" || summaryFocus === "pending") return [];
    return filteredEntries;
  }, [filteredEntries, summaryFocus]);
  const visibleExpenses = useMemo(() => {
    if (summaryFocus === "entries") return [];
    if (summaryFocus === "pending") return pendingExpenses;
    return filteredExpenses;
  }, [filteredExpenses, pendingExpenses, summaryFocus]);

  function handleAddEntry() {
    const amount = parseMoney(newForm.amount);
    const errors: Partial<Record<keyof FinanceFormState, string>> = {};

    if (!newForm.description.trim()) errors.description = "Descrição é obrigatória.";
    if (!newForm.category.trim()) errors.category = "Categoria é obrigatória.";
    if (!amount) errors.amount = "Informe um valor monetário válido.";
    if (newForm.type.toLowerCase().includes("sa") && !newForm.dueDate)
      errors.dueDate = "Data de vencimento é obrigatória para saídas.";

    setNewFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFeedback(Object.values(errors)[0] ?? "Revise os campos.", "error");
      return;
    }

    addFinanceEntry({
      id: createId("fin"),
      empresa: empresaAtiva,
      date: newForm.date || getCurrentDate(),
      dueDate: newForm.dueDate || undefined,
      description: newForm.description.trim(),
      type: newForm.type,
      category: newForm.category.trim(),
      amount,
      paid: newForm.type === "Entrada" ? true : newForm.paid,
    });

    resetNewForm(emptyForm());
    setFeedback("Lançamento financeiro adicionado.", "success");
  }

  function handleEditEntry(entry: FinanceEntry) {
    setEditingEntry(entry);
    setMode("editar");
    setEditForm({
      date: entry.date,
      dueDate: entry.dueDate ?? "",
      description: entry.description,
      type: entry.type,
      category: entry.category,
      amount: String(entry.amount).replace(".", ","),
      paid: entry.paid,
    });
  }

  function handleSaveEdit() {
    if (!editingEntry) return;

    const amount = parseMoney(editForm.amount);
    const errors: Partial<Record<keyof FinanceFormState, string>> = {};

    if (!editForm.description.trim()) errors.description = "Descrição é obrigatória.";
    if (!editForm.category.trim()) errors.category = "Categoria é obrigatória.";
    if (!amount) errors.amount = "Informe um valor monetário válido.";
    if (editForm.type.toLowerCase().includes("sa") && !editForm.dueDate)
      errors.dueDate = "Data de vencimento é obrigatória para saídas.";

    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFeedback(Object.values(errors)[0] ?? "Revise os campos.", "error");
      return;
    }

    updateFinanceEntry({
      ...editingEntry,
      date: editForm.date || editingEntry.date,
      dueDate: editForm.dueDate || undefined,
      description: editForm.description.trim(),
      type: editForm.type,
      category: editForm.category.trim(),
      amount,
      paid: editForm.type === "Entrada" ? true : editForm.paid,
    });

    setEditingEntry(null);
    resetEditForm(emptyForm());
    setMode("novo");
    setFeedback("Lançamento atualizado.", "success");
  }

  function handleCancelEdit() {
    setEditingEntry(null);
    resetEditForm(emptyForm());
    setMode("novo");
    clearFeedback();
  }

  function handleDeleteEntry(entryId: string) {
    deleteFinanceEntry(entryId);
    if (editingEntry?.id === entryId) {
      handleCancelEdit();
    }
    setFeedback("Lançamento removido.", "success");
  }

  function handleImportFinance(rows: SpreadsheetRow[]) {
    rows.forEach((row, index) => {
      const amount = parseMoney(row.amount ?? row.valor ?? row.Valor);
      if (!amount) {
        return;
      }

      addFinanceEntry({
        id: createId("fin-import"),
        empresa: empresaAtiva,
        date: text(row.date ?? row.data) || getCurrentDate(),
        dueDate: text(row.dueDate ?? row.vencimento ?? row["Data de Vencimento"]) || undefined,
        description: text(row.description ?? row.descricao ?? row["Descrição"]) || `Importado ${index + 1}`,
        type: normalizeFinanceType(text(row.type ?? row.tipo ?? row.Tipo)),
        category: text(row.category ?? row.categoria ?? row.Categoria) || "Importado",
        amount,
        paid: String(row.paid ?? row.pago ?? row.Pago ?? "true").toLowerCase() !== "false",
      });
    });
  }

  return (
    <ErpShell active="financeiro">
      <section className="grid gap-6 font-sans">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">Financeiro</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Caixa, despesas e previsões</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Esta tela mostra entradas, saídas, saldo, contas a pagar e análise por categoria.
            </p>
          </div>

          <div className="w-full max-w-[260px] self-start rounded-xl border border-white/10 bg-zinc-950 p-2.5 shadow-2xl shadow-black/20 lg:self-end">
            <DatePickerField
              className="w-full"
              label="Período"
              onChange={setSelectedPeriodDate}
              value={selectedPeriodDate}
            />
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InteractiveMetricCard
            active={summaryFocus === "entries"}
            alert={false}
            helper="receitas do período"
            label="Entradas"
            onClick={() => setSummaryFocus("entries")}
            tone="positive"
            value={formatCurrency(totals.totalEntradas)}
          />
          <InteractiveMetricCard
            active={summaryFocus === "expenses"}
            alert={false}
            helper="despesas do período"
            label="Saídas"
            onClick={() => setSummaryFocus("expenses")}
            tone="danger"
            value={formatCurrency(totals.totalSaidas)}
          />
          <InteractiveMetricCard
            active={summaryFocus === "all"}
            alert={false}
            helper="saldo calculado"
            label="Saldo Atual"
            onClick={() => setSummaryFocus("all")}
            tone="warning"
            value={formatCurrency(totals.saldoAtual)}
          />
          <InteractiveMetricCard
            active={summaryFocus === "pending"}
            helper="contas pendentes"
            label="Falta Pagar"
            onClick={() => setSummaryFocus("pending")}
            tone="danger"
            value={formatCurrency(totals.totalAPagar)}
            alert={isAPagarAlert}
            pendingCount={pendingCount}
          />
        </section>

        <ModuleSpreadsheetActions
          description="Exporta e importa somente entradas e saídas da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="financeiro"
          moduleLabel="Financeiro"
          onImportRows={handleImportFinance}
          rows={dataByCompany.finance}
        />

        <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">Lançamentos</p>
              <h2 className="mt-2 text-lg font-bold">{mode === "novo" ? "Novo Lançamento" : "Editar Lançamento"}</h2>
            </div>

            <div className="flex gap-2 self-start">
              <button
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  mode === "novo" ? "bg-yellow-500 text-black" : "border border-white/10 bg-white/5 text-slate-200"
                }`}
                onClick={() => {
                  setMode("novo");
                  setEditingEntry(null);
                  setEditForm(emptyForm());
                }}
                type="button"
              >
                Novo Lançamento
              </button>
              <button
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  mode === "editar" ? "bg-yellow-500 text-black" : "border border-white/10 bg-white/5 text-slate-200"
                }`}
                onClick={() => setMode("editar")}
                type="button"
              >
                Editar Lançamento
              </button>
            </div>
          </div>

          <div className="mt-5">
            {mode === "novo" ? (
              <FinanceForm
                form={newForm}
                onChange={setNewForm}
                onSubmit={handleAddEntry}
                submitLabel="Adicionar"
                errors={newFormErrors}
              />
            ) : (
              <div className="space-y-4">
                {editingEntry ? (
                  <FinanceForm
                    form={editForm}
                    onChange={setEditForm}
                    onSubmit={handleSaveEdit}
                    submitLabel="Salvar edição"
                    errors={editFormErrors}
                  />
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-black p-5 text-sm text-slate-400">
                    Selecione um lançamento na tabela para editar.
                  </div>
                )}

                {editingEntry ? (
                  <div className="flex justify-end">
                    <button
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5"
                      onClick={handleCancelEdit}
                      type="button"
                    >
                      Cancelar edição
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {feedback ? (
            <p
              role="status"
              className={`mt-4 rounded-xl p-3 text-sm ${
                feedbackType === "success" ? "bg-emerald-900/20 text-emerald-200" : "bg-red-900/20 text-red-200"
              }`}
            >
              {feedback}
            </p>
          ) : null}
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <LedgerTable
            entries={visibleEntries}
            onDelete={handleDeleteEntry}
            onEdit={handleEditEntry}
            onTogglePaid={updateFinanceEntry}
            title="Entradas"
          />
          <LedgerTable
            entries={visibleExpenses}
            onDelete={handleDeleteEntry}
            onEdit={handleEditEntry}
            onTogglePaid={updateFinanceEntry}
            title="Saídas e contas a pagar"
          />
        </div>

        <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5 md:p-6">
          <h2 className="text-lg font-bold">Resumo por categoria</h2>
          <p className="mt-1 text-sm text-slate-400">Visão rápida de onde o dinheiro está sendo consumido no período.</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Qtd.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {categorySummary.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                      Nenhuma despesa no período selecionado.
                    </td>
                  </tr>
                ) : (
                  categorySummary.map((item) => (
                    <tr key={item.category}>
                      <td className="px-4 py-3 font-semibold text-white">{item.category}</td>
                      <td className="px-4 py-3 text-slate-300">{item.count}</td>
                      <td className="px-4 py-3 text-right font-bold text-yellow-200">{formatCurrency(item.total)}</td>
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

function FinanceForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
  errors = {},
}: {
  form: FinanceFormState;
  onChange: (next: FinanceFormState | ((current: FinanceFormState) => FinanceFormState)) => void;
  onSubmit: () => void;
  submitLabel: string;
  errors?: Partial<Record<keyof FinanceFormState, string>>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[180px_minmax(0,1.8fr)_170px_190px_160px_180px_120px_auto]">
      <div className="space-y-2">
        <span className="text-sm font-semibold text-slate-300">Data</span>
        <DatePickerField label="" onChange={(value) => onChange((current) => ({ ...current, date: value }))} value={form.date} />
      </div>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-300">Descrição</span>
        <input
          className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
          placeholder="Descreva o lançamento"
          value={form.description}
        />
        {errors?.description ? <p className="mt-1 text-xs text-red-300">{errors.description}</p> : null}
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-300">Tipo</span>
        <select
          className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/60"
          onChange={(event) => onChange((current) => ({ ...current, type: event.target.value as FinanceEntry["type"] }))}
          value={form.type}
        >
          <option>Entrada</option>
          <option>Saída</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-300">Categoria</span>
        <input
          className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
          onChange={(event) => onChange((current) => ({ ...current, category: event.target.value }))}
          placeholder="Ex: Caixa, equipe, internet"
          value={form.category}
        />
        {errors?.category ? <p className="mt-1 text-xs text-red-300">{errors.category}</p> : null}
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-300">Valor</span>
        <input
          className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
          onChange={(event) => onChange((current) => ({ ...current, amount: event.target.value }))}
          placeholder="0,00"
          type="text"
          inputMode="decimal"
          value={form.amount}
        />
        {errors?.amount ? <p className="mt-1 text-xs text-red-300">{errors.amount}</p> : null}
      </label>
      <div className="space-y-2">
        <span className="text-sm font-semibold text-slate-300">Vencimento</span>
        <DatePickerField label="" onChange={(value) => onChange((current) => ({ ...current, dueDate: value }))} value={form.dueDate} />
        {errors?.dueDate ? <p className="mt-1 text-xs text-red-300">{errors.dueDate}</p> : null}
      </div>
      <label className="flex items-end">
        <span className="flex h-[48px] w-full items-center gap-2 rounded-xl border border-white/10 bg-black px-3 text-sm text-slate-200">
          <input
            checked={form.paid}
            onChange={(event) => onChange((current) => ({ ...current, paid: event.target.checked }))}
            type="checkbox"
          />
          Pago
        </span>
      </label>
      <button
        className="h-[48px] rounded-xl bg-yellow-500 px-4 text-sm font-extrabold text-black transition hover:bg-yellow-400"
        onClick={onSubmit}
        type="button"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function LedgerTable({
  entries,
  onTogglePaid,
  onEdit,
  onDelete,
  title,
}: {
  entries: FinanceEntry[];
  onTogglePaid: (entry: FinanceEntry) => void;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (id: string) => void;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[740px] text-left text-xs xl:text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-3 py-3">Data</th>
              <th className="px-3 py-3">Descrição</th>
              <th className="px-3 py-3">Categoria</th>
              <th className="px-3 py-3">Vencimento</th>
              <th className="px-3 py-3">Valor</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {entries.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-slate-500" colSpan={7}>
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-3 py-3 text-slate-300">{formatDate(entry.date)}</td>
                  <td className="px-3 py-3 font-semibold text-white">{entry.description}</td>
                  <td className="px-3 py-3 text-slate-300">{entry.category}</td>
                  <td className="px-3 py-3 text-slate-300">{formatDate(entry.dueDate || entry.date)}</td>
                  <td className="px-3 py-3 text-slate-300">{formatCurrency(entry.amount)}</td>
                  <td className="px-3 py-3">
                    <button
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        entry.paid ? "bg-emerald-500/10 text-emerald-300" : "bg-yellow-500/10 text-yellow-300"
                      }`}
                      onClick={() => onTogglePaid({ ...entry, paid: !entry.paid })}
                      type="button"
                    >
                      {entry.paid ? "Pago" : "Pendente"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <IconActionButton tone="edit" onClick={() => onEdit(entry)} title="Editar" />
                      <IconActionButton tone="delete" onClick={() => onDelete(entry.id)} title="Excluir" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function IconActionButton({
  tone,
  onClick,
  title,
}: {
  tone: "edit" | "delete";
  onClick: () => void;
  title: string;
}) {
  const styles =
    tone === "edit"
      ? "bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 border border-blue-500/20"
      : "bg-red-500/10 text-red-200 hover:bg-red-500/20 border border-red-500/20";

  return (
    <button className={`grid size-9 place-items-center rounded-lg transition ${styles}`} onClick={onClick} title={title} type="button">
      <ActionGlyph tone={tone} />
    </button>
  );
}

function ActionGlyph({ tone }: { tone: "edit" | "delete" }) {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
      {tone === "edit" ? (
        <>
          <path d="M4 20h4l11-11a2 2 0 0 0-3-3L5 17v3Z" />
          <path d="m13.5 6.5 4 4" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M6 7l1 12h10l1-12" />
          <path d="M9 7V4h6v3" />
        </>
      )}
    </svg>
  );
}

function InteractiveMetricCard({
  helper,
  label,
  value,
  onClick,
  alert,
  pendingCount,
  tone,
  active,
}: {
  helper: string;
  label: string;
  value: string;
  onClick: () => void;
  alert: boolean;
  pendingCount?: number;
  tone: "positive" | "warning" | "danger";
  active: boolean;
}) {
  const alertStyles = alert ? "border-red-500 bg-red-500/10" : "border-yellow-950/70 bg-zinc-950";
  const toneText = tone === "positive" ? "text-emerald-400" : tone === "warning" ? "text-yellow-400" : "text-red-400";

  return (
    <button
      className={`relative rounded-xl border p-6 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:-translate-y-0.5 hover:border-yellow-500/60 ${
        active ? "ring-2 ring-yellow-500/50" : ""
      } ${alertStyles}`}
      onClick={onClick}
      type="button"
    >
      {pendingCount && pendingCount > 0 ? (
        <span
          aria-hidden
          className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-sm animate-pulse"
        >
          {pendingCount}
        </span>
      ) : null}
      <p className="text-sm text-slate-400">{label}</p>
      <strong className={`mt-6 block text-3xl tracking-tight ${alert ? "text-red-400" : "text-white"}`}>{value}</strong>
      <p className={`mt-2 text-sm ${toneText}`}>{helper}</p>
    </button>
  );
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function matchesPeriod(date: string | undefined, period: string) {
  if (!date) return false;
  return date.startsWith(period);
}

function normalizeFinanceType(value: string): FinanceEntry["type"] {
  return (value.toLowerCase().includes("sa") ? "Saída" : "Entrada") as FinanceEntry["type"];
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? formatDateBr(value) : new Intl.DateTimeFormat("pt-BR").format(date);
}

function getCurrentPeriodDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}
