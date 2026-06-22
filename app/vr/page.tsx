"use client";

import { useEffect, useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { createId, useErpData } from "@/hooks/use-erp-data";
import { calcularVR, formatCurrency } from "@/lib/calculator";
import type { Employee, VrRecord } from "@/lib/types";

type FuncionariosResponse = {
  employees?: Employee[];
};

type VrFormState = {
  funcionarioId: string;
  funcionario: string;
  equipe: string;
  diasTrabalhados: string;
  sabados: string;
  valorDia: string;
  valorSabado: string;
};

const DEFAULT_VR_DAY = 32.63;
const DEFAULT_VR_SATURDAY = 45;

const employeeVrPresetByTeam: Record<string, { valorDia: number; valorSabado: number }> = {
  "EQUIPE ALPHA": { valorDia: 32.63, valorSabado: 45 },
  "EQUIPE BETA": { valorDia: 32.63, valorSabado: 45 },
  "EQUIPE GAMMA": { valorDia: 32.63, valorSabado: 45 },
  "EQUIPE DEMO": { valorDia: 32.63, valorSabado: 45 },
  GESTÃO: { valorDia: 32.63, valorSabado: 45 },
};

export default function VrPage() {
  const { dataByCompany, empresaAtiva, addVrRecord, updateVrRecord, deleteVrRecord } = useErpData();
  const [sheetEmployees, setSheetEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focus, setFocus] = useState<"all" | "dias" | "sabados" | "valor">("all");
  const [editingRecord, setEditingRecord] = useState<VrRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState<VrFormState>({
    funcionarioId: "",
    funcionario: "",
    equipe: "",
    diasTrabalhados: "22",
    sabados: "0",
    valorDia: formatMoney(DEFAULT_VR_DAY),
    valorSabado: formatMoney(DEFAULT_VR_SATURDAY),
  });

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      try {
        const response = await fetch("/api/funcionarios", { cache: "no-store" });
        const payload = (await response.json()) as FuncionariosResponse;

        if (active && Array.isArray(payload.employees)) {
          setSheetEmployees(payload.employees);
        }
      } catch {
        if (active) {
          setSheetEmployees([]);
        }
      }
    }

    loadEmployees();

    return () => {
      active = false;
    };
  }, []);

  const employeesForVr = useMemo(() => {
    const source = sheetEmployees.length > 0 ? sheetEmployees : dataByCompany.employees;

    return source
      .filter((employee) => employee.empresa === empresaAtiva && employee.situacao === "ATIVO")
      .sort((a, b) => a.funcionario.localeCompare(b.funcionario));
  }, [dataByCompany.employees, empresaAtiva, sheetEmployees]);

  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return employeesForVr.slice(0, 12);

    return employeesForVr.filter((employee) =>
      [employee.funcionario, employee.equipe, employee.cargo, employee.re].join(" ").toLowerCase().includes(normalized),
    );
  }, [employeesForVr, query]);

  const totalVr = useMemo(() => dataByCompany.vr.reduce((sum, record) => sum + record.amount, 0), [dataByCompany.vr]);
  const totalDias = useMemo(() => dataByCompany.vr.reduce((sum, record) => sum + record.diasTrabalhados, 0), [dataByCompany.vr]);
  const totalSabados = useMemo(() => dataByCompany.vr.reduce((sum, record) => sum + record.sabados, 0), [dataByCompany.vr]);
  const averageAmount = useMemo(() => {
    if (dataByCompany.vr.length === 0) return 0;
    return totalVr / dataByCompany.vr.length;
  }, [dataByCompany.vr.length, totalVr]);
  const preview = useMemo(
    () =>
      calculateVrAmount(
        Number(form.diasTrabalhados) || 0,
        Number(form.sabados) || 0,
        parseMoney(form.valorDia),
        parseMoney(form.valorSabado),
      ),
    [form.diasTrabalhados, form.sabados, form.valorDia, form.valorSabado],
  );
  const visibleRecords = useMemo(() => {
    if (focus === "dias") return dataByCompany.vr.filter((record) => record.diasTrabalhados > 0);
    if (focus === "sabados") return dataByCompany.vr.filter((record) => record.sabados > 0);
    if (focus === "valor") return dataByCompany.vr.filter((record) => record.amount >= averageAmount);
    return dataByCompany.vr;
  }, [averageAmount, dataByCompany.vr, focus]);

  function handleSelectEmployee(employee: Employee) {
    const preset = getEmployeeVrPreset(employee);

    setQuery(employee.funcionario);
    setIsOpen(false);
    setForm((current) => ({
      ...current,
      funcionarioId: employee.id,
      funcionario: employee.funcionario,
      equipe: employee.equipe || current.equipe,
      valorDia: formatMoney(preset.valorDia),
      valorSabado: formatMoney(preset.valorSabado),
    }));
  }

  function handleAddVr() {
    const funcionario = form.funcionario.trim();
    const equipe = form.equipe.trim();
    const diasTrabalhados = Number(form.diasTrabalhados) || 0;
    const sabados = Number(form.sabados) || 0;
    const valorDia = parseMoney(form.valorDia);
    const valorSabado = parseMoney(form.valorSabado);

    if (!funcionario || !equipe) {
      setFeedback("Selecione um funcionário e uma equipe antes de lançar o VR.");
      return;
    }

    if (!Number.isFinite(valorDia) || !Number.isFinite(valorSabado) || valorDia <= 0 || valorSabado <= 0) {
      setFeedback("Os valores de R$ Dia e R$ Sábado precisam ser válidos.");
      return;
    }

    const record: VrRecord = {
      id: createId("vr"),
      empresa: empresaAtiva,
      funcionario,
      equipe,
      diasTrabalhados,
      sabados,
      valorDia,
      valorSabado,
      amount: calculateVrAmount(diasTrabalhados, sabados, valorDia, valorSabado),
    };

    addVrRecord(record);
    setQuery("");
    setFeedback("VR lançado com sucesso.");
    setForm(resetForm());
  }

  function handleImportVr(rows: SpreadsheetRow[]) {
    rows.forEach((row, index) => {
      const diasTrabalhados = parseNumber(row.diasTrabalhados ?? row.Dias ?? row.dias ?? 0);
      const sabados = parseNumber(row.sabados ?? row["Sábados"] ?? 0);
      const valorDia = parseMoney(row.valorDia ?? row["R$ Dia"] ?? row.vrDia ?? DEFAULT_VR_DAY);
      const valorSabado = parseMoney(row.valorSabado ?? row["R$ Sábado"] ?? DEFAULT_VR_SATURDAY);

      if (!valorDia || !valorSabado) return;

      addVrRecord({
        id: createId("vr-import"),
        empresa: empresaAtiva,
        funcionario: text(row.funcionario ?? row["Funcionário"] ?? `Funcionário ${index + 1}`),
        equipe: text(row.equipe ?? row.Equipe ?? "Sem equipe"),
        diasTrabalhados,
        sabados,
        valorDia,
        valorSabado,
        amount: calculateVrAmount(diasTrabalhados, sabados, valorDia, valorSabado),
      });
    });
  }

  function handleEditRecord(record: VrRecord) {
    setEditingRecord(record);
    setForm({
      funcionarioId: "",
      funcionario: record.funcionario,
      equipe: record.equipe,
      diasTrabalhados: String(record.diasTrabalhados),
      sabados: String(record.sabados),
      valorDia: formatMoney(record.valorDia),
      valorSabado: formatMoney(record.valorSabado),
    });
  }

  function handleSaveEdit() {
    if (!editingRecord) return;

    const funcionario = form.funcionario.trim();
    const equipe = form.equipe.trim();
    const diasTrabalhados = Number(form.diasTrabalhados) || 0;
    const sabados = Number(form.sabados) || 0;
    const valorDia = parseMoney(form.valorDia);
    const valorSabado = parseMoney(form.valorSabado);

    if (!funcionario || !equipe || !valorDia || !valorSabado) {
      setFeedback("Revise os campos do VR antes de salvar.");
      return;
    }

    updateVrRecord({
      ...editingRecord,
      funcionario,
      equipe,
      diasTrabalhados,
      sabados,
      valorDia,
      valorSabado,
      amount: calculateVrAmount(diasTrabalhados, sabados, valorDia, valorSabado),
    });

    setEditingRecord(null);
    setFeedback("VR atualizado com sucesso.");
    setForm(resetForm());
  }

  function handleDeleteRecord(recordId: string) {
    deleteVrRecord(recordId);
    if (editingRecord?.id === recordId) {
      setEditingRecord(null);
    }
    setFeedback("VR removido da lista.");
  }

  return (
    <ErpShell active="vr">
      <section className="grid gap-6">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">VR</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Controle dedicado de VR</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            O VR saiu do financeiro e agora fica em um módulo próprio, com cálculo por dias e sábados.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <VrSummaryCard active={focus === "all"} helper="lançamentos desta empresa" label="Total de VR" onClick={() => setFocus("all")} tone="positive" value={formatCurrency(totalVr)} />
          <VrSummaryCard active={focus === "dias"} helper="dias somados" label="Dias" onClick={() => setFocus("dias")} tone="warning" value={String(totalDias)} />
          <VrSummaryCard active={focus === "sabados"} helper="sábados somados" label="Sábados" onClick={() => setFocus("sabados")} tone="warning" value={String(totalSabados)} />
          <VrSummaryCard active={focus === "valor"} helper="prévia do lançamento" label="R$ do lançamento" onClick={() => setFocus("valor")} tone="positive" value={formatCurrency(preview)} />
        </div>

        <ModuleSpreadsheetActions
          description="Exporta e importa somente a base de VR da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="vr"
          moduleLabel="VR"
          onImportRows={handleImportVr}
          rows={dataByCompany.vr}
        />

        <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">{editingRecord ? "Editar VR" : "Adicionar VR"}</h2>
              <p className="mt-1 text-sm text-slate-400">Selecione um funcionário e os campos são preenchidos automaticamente.</p>
            </div>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              onClick={() => {
                setEditingRecord(null);
                setForm(resetForm());
              }}
              type="button"
            >
              Novo lançamento
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_1fr_110px_110px_140px_140px_auto] lg:items-end">
            <SearchableEmployeeSelect
              employees={filteredEmployees}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              onOpen={() => setIsOpen(true)}
              onSelect={handleSelectEmployee}
              query={query}
              setQuery={setQuery}
            />
            <TextField label="Equipe" onChange={(value) => setForm((current) => ({ ...current, equipe: value }))} value={form.equipe} />
            <TextField label="Dias" onChange={(value) => setForm((current) => ({ ...current, diasTrabalhados: value }))} type="number" value={form.diasTrabalhados} />
            <TextField label="Sábados" onChange={(value) => setForm((current) => ({ ...current, sabados: value }))} type="number" value={form.sabados} />
            <TextField label="R$ Dia" onChange={(value) => setForm((current) => ({ ...current, valorDia: value }))} value={form.valorDia} />
            <TextField label="R$ Sábado" onChange={(value) => setForm((current) => ({ ...current, valorSabado: value }))} value={form.valorSabado} />
            <button
              className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-extrabold text-black transition hover:bg-yellow-400"
              onClick={editingRecord ? handleSaveEdit : handleAddVr}
              type="button"
            >
              {editingRecord ? "Salvar edição" : "Adicionar VR"}
            </button>
          </div>

          {feedback ? <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-200">{feedback}</p> : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Lançamentos de VR</h2>
              <p className="mt-1 text-sm text-slate-400">Edite, exclua e filtre os registros para análise rápida.</p>
            </div>
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
              {employeesForVr.length} funcionários ativos
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todos", count: dataByCompany.vr.length },
              { key: "dias", label: "Com dias", count: dataByCompany.vr.filter((item) => item.diasTrabalhados > 0).length },
              { key: "sabados", label: "Com sábados", count: dataByCompany.vr.filter((item) => item.sabados > 0).length },
              { key: "valor", label: "Acima da média", count: dataByCompany.vr.filter((item) => item.amount >= averageAmount).length },
            ].map((item) => {
              const selected = focus === item.key;

              return (
                <button
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    selected
                      ? "border-yellow-500 bg-yellow-500 text-black"
                      : "border-white/10 bg-black text-slate-300 hover:border-yellow-500/50 hover:text-yellow-300"
                  }`}
                  key={item.key}
                  onClick={() => setFocus(item.key as typeof focus)}
                  type="button"
                >
                  {item.label} • {item.count}
                </button>
              );
            })}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Funcionário</th>
                  <th className="px-4 py-3">Equipe</th>
                  <th className="px-4 py-3">Dias</th>
                  <th className="px-4 py-3">Sábados</th>
                  <th className="px-4 py-3">R$ Dia</th>
                  <th className="px-4 py-3">R$ Sábado</th>
                  <th className="px-4 py-3 text-right">R$ VR</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {visibleRecords.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                      Nenhum VR encontrado para este filtro em {empresaAtiva}.
                    </td>
                  </tr>
                ) : (
                  visibleRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-3 font-semibold text-white">{record.funcionario}</td>
                      <td className="px-4 py-3 text-slate-300">{record.equipe}</td>
                      <td className="px-4 py-3 text-slate-300">{record.diasTrabalhados}</td>
                      <td className="px-4 py-3 text-slate-300">{record.sabados}</td>
                      <td className="px-4 py-3 text-slate-300">{formatCurrency(record.valorDia)}</td>
                      <td className="px-4 py-3 text-slate-300">{formatCurrency(record.valorSabado)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-300">{formatCurrency(record.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-200 transition hover:bg-blue-500/20"
                            onClick={() => handleEditRecord(record)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
                            onClick={() => handleDeleteRecord(record.id)}
                            type="button"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
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

function VrSummaryCard({
  active,
  helper,
  label,
  onClick,
  tone,
  value,
}: {
  active: boolean;
  helper: string;
  label: string;
  onClick: () => void;
  tone: "positive" | "warning";
  value: string;
}) {
  return (
    <button
      className={`rounded-xl border p-5 text-left transition hover:-translate-y-0.5 hover:border-yellow-500/60 ${
        active ? "ring-2 ring-yellow-500/50" : ""
      } ${tone === "positive" ? "border-emerald-500/20 bg-emerald-500/10" : "border-yellow-950/70 bg-zinc-950"}`}
      onClick={onClick}
      type="button"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <strong className="mt-5 block text-[2rem] font-black tracking-tight text-white">{value}</strong>
      <p className={`mt-2 text-sm ${tone === "positive" ? "text-emerald-400" : "text-yellow-400"}`}>{helper}</p>
    </button>
  );
}

function SearchableEmployeeSelect({
  employees,
  isOpen,
  onClose,
  onOpen,
  onSelect,
  query,
  setQuery,
}: {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onSelect: (employee: Employee) => void;
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <div className="relative block">
      <span className="text-sm font-semibold text-slate-300">Funcionário</span>
      <input
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
        onChange={(event) => {
          setQuery(event.target.value);
          onOpen();
        }}
        onFocus={onOpen}
        onBlur={() => {
          window.setTimeout(onClose, 120);
        }}
        placeholder="Buscar funcionário..."
        value={query}
      />

      {isOpen && employees.length > 0 ? (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40">
          {employees.map((employee) => (
            <button
              className="flex w-full items-center justify-between gap-3 border-b border-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/5 last:border-b-0"
              key={employee.id}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(employee);
              }}
              type="button"
            >
              <span className="font-semibold text-white">{employee.funcionario}</span>
              <span className="text-xs text-slate-400">{employee.equipe || "Sem equipe"}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <input
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function getEmployeeVrPreset(employee: Employee) {
  const byTeam = employeeVrPresetByTeam[employee.equipe?.trim().toUpperCase()];
  const dayValue = parseMoney(employee.vrDia) || byTeam?.valorDia || DEFAULT_VR_DAY;
  const saturdayValue = byTeam?.valorSabado || DEFAULT_VR_SATURDAY;

  return {
    valorDia: dayValue,
    valorSabado: saturdayValue,
  };
}

function calculateVrAmount(diasTrabalhados: number, sabados: number, valorDia: number, valorSabado: number) {
  return calcularVR(diasTrabalhados, sabados, valorDia, valorSabado);
}

function resetForm(): VrFormState {
  return {
    funcionarioId: "",
    funcionario: "",
    equipe: "",
    diasTrabalhados: "22",
    sabados: "0",
    valorDia: formatMoney(DEFAULT_VR_DAY),
    valorSabado: formatMoney(DEFAULT_VR_SATURDAY),
  };
}

function formatMoney(value: number) {
  return Number.isFinite(value) ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";
}

function parseMoney(value: unknown) {
  const textValue = String(value ?? "").trim();

  if (!textValue) {
    return 0;
  }

  const parsed = Number(textValue.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumber(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}
