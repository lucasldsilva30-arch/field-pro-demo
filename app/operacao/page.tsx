"use client";

import { useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { createId, useErpData } from "@/hooks/use-erp-data";
import { formatCurrency } from "@/lib/calculator";
import { findBestConectaCode } from "@/utils/conecta-matcher";
import type { ConectaCode, ProductionRecord, ProductionStatus } from "@/lib/types";

const statusOptions: ProductionStatus[] = ["OK", "Pendente", "Refazer"];
type OperacaoTab = "producao" | "catalogo";
type ProductionFilter = "all" | ProductionStatus | "launched" | "not-launched";

export default function OperacaoPage() {
  const { data, dataByCompany, empresaAtiva, addConectaCode, addProduction, updateProduction } = useErpData();
  const [activeTab, setActiveTab] = useState<OperacaoTab>("producao");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filter, setFilter] = useState<ProductionFilter>("all");
  const [form, setForm] = useState({
    sp: "",
    cabo: "",
    local: "",
    status: "OK" as ProductionStatus,
    equipe: "",
    materiais: "",
    selectedCodeId: data.conectaCodes[0]?.id ?? "",
    launchedConecta: false,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({ description: "", code: "", points: "1", value: "0" });

  const selectedCode = data.conectaCodes.find((code) => code.id === form.selectedCodeId) ?? data.conectaCodes[0];
  const suggestedCode = useMemo(() => {
    const fakeParsed = {
      sp: form.sp || null,
      cabo: form.cabo || null,
      local: form.local || null,
      status: form.status || null,
      equipe: form.equipe || null,
      materiais: form.materiais.split(",").map((item) => item.trim()).filter(Boolean),
      raw: [form.sp, form.cabo, form.local, form.equipe, form.materiais].filter(Boolean).join(" "),
      confidence: 0,
      missingFields: [] as string[],
    };

    return findBestConectaCode(fakeParsed as never, data.conectaCodes);
  }, [data.conectaCodes, form]);

  const filteredProduction = useMemo(() => {
    return dataByCompany.production.filter((record) => {
      if (filter === "all") return true;
      if (filter === "launched") return record.launchedConecta;
      if (filter === "not-launched") return !record.launchedConecta;
      return record.status === filter;
    });
  }, [dataByCompany.production, filter]);

  const productionStats = useMemo(
    () => ({
      all: dataByCompany.production.length,
      ok: dataByCompany.production.filter((record) => record.status === "OK").length,
      pending: dataByCompany.production.filter((record) => record.status === "Pendente").length,
      refazer: dataByCompany.production.filter((record) => record.status === "Refazer").length,
      launched: dataByCompany.production.filter((record) => record.launchedConecta).length,
      notLaunched: dataByCompany.production.filter((record) => !record.launchedConecta).length,
    }),
    [dataByCompany.production],
  );

  function handleSaveProduction() {
    const code = selectedCode ?? suggestedCode;

    if (!code) {
      setFeedback("Cadastre ou selecione um código Conecta antes de salvar.");
      return;
    }

    const record: ProductionRecord = {
      id: createId("prod"),
      empresa: empresaAtiva,
      date: new Date().toISOString().slice(0, 10),
      sp: form.sp.trim(),
      cabo: form.cabo.trim(),
      local: form.local.trim(),
      status: form.status,
      equipe: form.equipe.trim() || "Sem equipe",
      materiais: splitMaterials(form.materiais),
      conectaCodeId: code.id,
      conectaCode: code.code,
      points: code.points,
      value: code.value,
      launchedConecta: form.launchedConecta,
      rawMessage: [form.sp, form.cabo, form.local, form.status, form.equipe, form.materiais].filter(Boolean).join(" | "),
    };

    addProduction(record);
    setFeedback("Produção salva localmente com sucesso.");
    setForm(resetProductionForm(code.id));
    setSelectedRows([]);
  }

  function handleBatchLaunch() {
    const rowsToLaunch = filteredProduction.filter((record) => selectedRows.includes(record.id));

    rowsToLaunch.forEach((record) => {
      updateProduction({ ...record, launchedConecta: true });
    });

    setSelectedRows([]);
    setFeedback(rowsToLaunch.length > 0 ? `${rowsToLaunch.length} produções lançadas no Conecta.` : "Selecione ao menos uma produção.");
  }

  function handleAddCode() {
    const code: ConectaCode = {
      id: createId("code"),
      description: newCode.description.trim(),
      code: newCode.code.trim(),
      points: Number(newCode.points) || 0,
      value: Number(newCode.value) || 0,
    };

    if (!code.description || !code.code) {
      setFeedback("Preencha descrição e código do Conecta.");
      return;
    }

    addConectaCode(code);
    setForm((current) => ({ ...current, selectedCodeId: code.id }));
    setNewCode({ description: "", code: "", points: "1", value: "0" });
    setFeedback("Código Conecta cadastrado.");
  }

  function handleImportProduction(rows: SpreadsheetRow[]) {
    rows.forEach((row, index) => {
      const code = selectedCode ?? data.conectaCodes[0];
      const record: ProductionRecord = {
        id: createId("prod-import"),
        empresa: empresaAtiva,
        date: text(row.date) || text(row.data) || new Date().toISOString().slice(0, 10),
        sp: text(row.sp) || text(row.SP) || `IMPORT-${index + 1}`,
        cabo: text(row.cabo) || text(row.Cabo),
        local: text(row.local) || text(row.Local),
        status: normalizeProductionStatus(text(row.status) || text(row.Status)),
        equipe: text(row.equipe) || text(row.Equipe) || "Sem equipe",
        materiais: splitMaterials(text(row.materiais) || text(row.Materiais)),
        conectaCodeId: text(row.conectaCodeId) || code?.id || "",
        conectaCode: text(row.conectaCode) || text(row["Código"]) || code?.code || "",
        points: numberValue(row.points ?? row.pontos ?? code?.points ?? 0),
        value: numberValue(row.value ?? row.valor ?? code?.value ?? 0),
        launchedConecta: String(row.launchedConecta ?? row.conecta ?? "").toLowerCase().includes("true"),
        rawMessage: JSON.stringify(row),
      };

      addProduction(record);
    });

    setFeedback(`${rows.length} linhas importadas e exibidas no controle de produção.`);
  }

  return (
    <ErpShell active="operacao">
      <section className="grid gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">Produção</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Controle operacional</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Aqui ficam a produção, o catálogo Conecta e os lançamentos operacionais.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "producao" as OperacaoTab, label: "Produção" },
              { key: "catalogo" as OperacaoTab, label: "Catálogo Conecta" },
            ].map((tab) => {
              const selected = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                    selected
                      ? "border-yellow-500 bg-yellow-500 text-black"
                      : "border-white/10 bg-zinc-950 text-slate-300 hover:border-yellow-500/50 hover:text-yellow-300"
                  }`}
                  data-demo-nav="true"
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        <ModuleSpreadsheetActions
          description="Exporta e importa somente a produção operacional da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="operacao"
          moduleLabel="Produção"
          onImportRows={handleImportProduction}
          rows={dataByCompany.production.map((record) => ({
            ...record,
            materiais: record.materiais.join(", "),
          }))}
        />

        {activeTab === "producao" ? (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <ProductionStatCard active={filter === "all"} count={productionStats.all} label="Todos" onClick={() => setFilter("all")} />
              <ProductionStatCard active={filter === "OK"} count={productionStats.ok} label="OK" onClick={() => setFilter("OK")} />
              <ProductionStatCard active={filter === "Pendente"} count={productionStats.pending} label="Pendente" onClick={() => setFilter("Pendente")} />
              <ProductionStatCard active={filter === "Refazer"} count={productionStats.refazer} label="Refazer" onClick={() => setFilter("Refazer")} />
              <ProductionStatCard active={filter === "not-launched"} count={productionStats.notLaunched} label="Sem Conecta" onClick={() => setFilter("not-launched")} />
            </section>

            <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
              <div className="mb-5 border-b border-white/10 pb-4">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">Novo Registro de Produção</p>
                <h2 className="mt-2 text-xl font-black text-white">Cadastrar nova produção</h2>
                <p className="mt-1 text-sm text-slate-400">Preencha os campos abaixo e use o CTA principal para salvar.</p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_1fr_160px_160px_auto]">
                <Field label="SP" value={form.sp} onChange={(value) => setForm((current) => ({ ...current, sp: value }))} placeholder="Ex: 45872" />
                <Field label="Cabo" value={form.cabo} onChange={(value) => setForm((current) => ({ ...current, cabo: value }))} placeholder="Ex: CTO-12 / FO-08" />
                <Field label="Local" value={form.local} onChange={(value) => setForm((current) => ({ ...current, local: value }))} placeholder="Rua, bairro ou cidade" />
                <Field label="Equipe" value={form.equipe} onChange={(value) => setForm((current) => ({ ...current, equipe: value }))} placeholder="Nome da equipe" />
                <Field label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value as ProductionStatus }))} select>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Field>
                <Field label="Materiais" value={form.materiais} onChange={(value) => setForm((current) => ({ ...current, materiais: value }))} placeholder="Separados por vírgula" />
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-3 text-sm">
                  <input
                    checked={form.launchedConecta}
                    onChange={(event) => setForm((current) => ({ ...current, launchedConecta: event.target.checked }))}
                    type="checkbox"
                  />
                  Lançado no Conecta
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <select
                  className="rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm"
                  onChange={(event) => setForm((current) => ({ ...current, selectedCodeId: event.target.value }))}
                  value={form.selectedCodeId}
                >
                  {data.conectaCodes.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.code} - {code.description}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                  onClick={() => setFeedback("Formulário pronto para a produção manual.")}
                  type="button"
                >
                  Revisar
                </button>
                <button
                  className="rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-700 px-5 py-3.5 text-sm font-extrabold text-black shadow-lg shadow-yellow-950/30 transition hover:from-yellow-200 hover:to-yellow-600"
                  onClick={handleSaveProduction}
                  type="button"
                >
                  Salvar produção
                </button>
                <p className="text-sm text-slate-400">
                  Sugestão: <span className="font-bold text-slate-200">{suggestedCode ? suggestedCode.code : "sem sugestão"}</span>
                </p>
              </div>

              {feedback ? <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-200">{feedback}</p> : null}
            </section>

            <section className="rounded-2xl border border-white/10 bg-black p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Produções da empresa ativa</h2>
                  <p className="mt-1 text-sm text-slate-400">Selecione uma ou várias linhas para lançar em massa no Conecta.</p>
                </div>
                <button
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedRows.length === 0}
                  onClick={handleBatchLaunch}
                  type="button"
                >
                  Lançar Selecionados
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">
                        <input
                          checked={filteredProduction.length > 0 && selectedRows.length === filteredProduction.length}
                          onChange={(event) => {
                            setSelectedRows(event.target.checked ? filteredProduction.map((record) => record.id) : []);
                          }}
                          type="checkbox"
                        />
                      </th>
                      <th className="px-4 py-3">SP</th>
                      <th className="px-4 py-3">Equipe</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Conecta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredProduction.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3">
                          <input
                            checked={selectedRows.includes(record.id)}
                            onChange={(event) => {
                              setSelectedRows((current) =>
                                event.target.checked ? [...current, record.id] : current.filter((id) => id !== record.id),
                              );
                            }}
                            type="checkbox"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-yellow-300">{record.sp}</td>
                        <td className="px-4 py-3">{record.equipe}</td>
                        <td className="px-4 py-3">{record.status}</td>
                        <td className="px-4 py-3">{record.conectaCode}</td>
                        <td className="px-4 py-3">
                          <input
                            checked={record.launchedConecta}
                            onChange={(event) => updateProduction({ ...record, launchedConecta: event.target.checked })}
                            type="checkbox"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_100px_120px_auto]">
              <input
                className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setNewCode((current) => ({ ...current, description: event.target.value }))}
                placeholder="Descrição"
                value={newCode.description}
              />
              <input
                className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setNewCode((current) => ({ ...current, code: event.target.value }))}
                placeholder="Código"
                value={newCode.code}
              />
              <input
                className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setNewCode((current) => ({ ...current, points: event.target.value }))}
                placeholder="Pontos"
                type="number"
                value={newCode.points}
              />
              <input
                className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setNewCode((current) => ({ ...current, value: event.target.value }))}
                placeholder="Valor"
                type="number"
                value={newCode.value}
              />
              <button className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-extrabold text-black" onClick={handleAddCode} type="button">
                Cadastrar
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Pontos</th>
                    <th className="px-4 py-3">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.conectaCodes.map((code) => (
                    <tr key={code.id}>
                      <td className="px-4 py-3 font-bold text-yellow-300">{code.code}</td>
                      <td className="px-4 py-3 text-slate-300">{code.description}</td>
                      <td className="px-4 py-3 text-slate-400">{code.points}</td>
                      <td className="px-4 py-3 text-slate-400">{formatCurrency(code.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </ErpShell>
  );
}

function ProductionStatCard({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-500/60 sm:p-5 ${
        active ? "ring-2 ring-yellow-500/50" : ""
      } border-white/10 bg-zinc-950`}
      onClick={onClick}
      type="button"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-[11px]">{label}</p>
      <strong className="mt-4 block text-2xl font-black tracking-tight text-white sm:mt-5 sm:text-[2rem]">{count}</strong>
      <p className="mt-2 text-xs text-yellow-400 sm:text-sm">Clique para filtrar</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  select = false,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  select?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      {select ? (
        <select
          className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/60"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {children}
        </select>
      ) : (
        <input
          className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      )}
    </label>
  );
}

function splitMaterials(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProductionStatus(value: string): ProductionStatus {
  const normalized = value.toLowerCase();
  if (normalized.includes("ref")) return "Refazer";
  if (normalized.includes("pend")) return "Pendente";
  return "OK";
}

function resetProductionForm(selectedCodeId?: string): {
  sp: string;
  cabo: string;
  local: string;
  status: ProductionStatus;
  equipe: string;
  materiais: string;
  selectedCodeId: string;
  launchedConecta: boolean;
} {
  return {
    sp: "",
    cabo: "",
    local: "",
    status: "OK",
    equipe: "",
    materiais: "",
    selectedCodeId: selectedCodeId ?? "",
    launchedConecta: false,
  };
}
