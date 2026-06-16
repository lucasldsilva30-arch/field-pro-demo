"use client";

import { useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { createId, useErpData } from "@/hooks/use-erp-data";
import { findBestConectaCode } from "@/utils/conecta-matcher";
import { parseOperationMessage, type ParsedOperationMessage } from "@/utils/parser";
import type { ConectaCode, ProductionRecord, ProductionStatus } from "@/lib/types";

const exampleMessage = `SP: 45872
Cabo: CTO-12 / FO-08
Local: Rua das Palmeiras, 120 - Centro
Status: OK
Equipe: Equipe Norte
Materiais: 80m fibra, 2 conectores, 1 CTO`;

const statusOptions: ProductionStatus[] = ["OK", "Pendente", "Refazer"];

export default function OperacaoPage() {
  const { data, dataByCompany, empresaAtiva, addConectaCode, addProduction, updateProduction } = useErpData();
  const [message, setMessage] = useState(exampleMessage);
  const [parsed, setParsed] = useState<ParsedOperationMessage>(() => parseOperationMessage(exampleMessage));
  const [selectedCodeId, setSelectedCodeId] = useState(data.conectaCodes[0]?.id ?? "");
  const [status, setStatus] = useState<ProductionStatus>("OK");
  const [launchedConecta, setLaunchedConecta] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({ description: "", code: "", points: "1", value: "0" });

  const selectedCode = data.conectaCodes.find((code) => code.id === selectedCodeId) ?? data.conectaCodes[0];
  const suggestedCode = useMemo(() => findBestConectaCode(parsed, data.conectaCodes), [data.conectaCodes, parsed]);
  const preview = useMemo(() => JSON.stringify(parsed, null, 2), [parsed]);

  const handleParse = () => {
    const nextParsed = parseOperationMessage(message);
    const matchedCode = findBestConectaCode(nextParsed, data.conectaCodes);

    setParsed(nextParsed);
    if (matchedCode) {
      setSelectedCodeId(matchedCode.id);
    }
    setFeedback(null);
  };

  const handleSaveProduction = async () => {
    const nextParsed = parseOperationMessage(message);
    const code = selectedCode ?? findBestConectaCode(nextParsed, data.conectaCodes);

    if (!code) {
      setFeedback("Cadastre ou selecione um código Conecta antes de salvar.");
      return;
    }

    const record: ProductionRecord = {
      id: createId("prod"),
      empresa: empresaAtiva,
      date: new Date().toISOString().slice(0, 10),
      sp: nextParsed.sp ?? "",
      cabo: nextParsed.cabo ?? "",
      local: nextParsed.local ?? "",
      status,
      equipe: nextParsed.equipe ?? "Sem equipe",
      materiais: nextParsed.materiais,
      conectaCodeId: code.id,
      conectaCode: code.code,
      points: code.points,
      value: code.value,
      launchedConecta,
      rawMessage: nextParsed.raw,
    };

    addProduction(record);
    setParsed(nextParsed);

    await fetch("/api/operacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: nextParsed }),
    }).catch(() => null);

    setFeedback("Produção salva localmente e enviada para integração quando disponível.");
  };

  const handleAddCode = () => {
    const code: ConectaCode = {
      id: createId("code"),
      description: newCode.description,
      code: newCode.code,
      points: Number(newCode.points) || 0,
      value: Number(newCode.value) || 0,
    };

    if (!code.description || !code.code) {
      setFeedback("Preencha descrição e código do Conecta.");
      return;
    }

    addConectaCode(code);
    setSelectedCodeId(code.id);
    setNewCode({ description: "", code: "", points: "1", value: "0" });
  };

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
        conectaCode: text(row.conectaCode) || text(row.Código) || code?.code || "",
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
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Operação</h1>
          <p className="mt-2 text-slate-400">
            Cole a mensagem da equipe, cruze com o Conecta e gere controle de produção.
          </p>
        </div>

        <ModuleSpreadsheetActions
          description="Exporta e importa somente a produção operacional da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="operacao"
          moduleLabel="Operação"
          onImportRows={handleImportProduction}
          rows={dataByCompany.production.map((record) => ({
            ...record,
            materiais: record.materiais.join(", "),
          }))}
        />

        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
            <label className="text-sm font-semibold text-slate-300" htmlFor="operation-message">
              Mensagem do WhatsApp
            </label>
            <textarea
              className="mt-3 min-h-72 w-full resize-y rounded-xl border border-white/10 bg-black p-4 text-sm leading-6 text-slate-100 outline-none transition focus:border-yellow-500/60"
              id="operation-message"
              onChange={(event) => setMessage(event.target.value)}
              value={message}
            />

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <select
                className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setSelectedCodeId(event.target.value)}
                value={selectedCode?.id ?? ""}
              >
                {data.conectaCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code} - {code.description}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setStatus(event.target.value as ProductionStatus)}
                value={status}
              >
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-3 py-3 text-sm">
                <input
                  checked={launchedConecta}
                  onChange={(event) => setLaunchedConecta(event.target.checked)}
                  type="checkbox"
                />
                Lançado no Conecta
              </label>
            </div>

            {suggestedCode ? (
              <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Sugestão automática Conecta: <strong>{suggestedCode.code}</strong> — {suggestedCode.description}
              </p>
            ) : (
              <p className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                Nenhum código Conecta sugerido ainda. Cadastre palavras-chave na descrição do código.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-lg bg-white/10 px-4 py-3 text-sm font-bold" onClick={handleParse} type="button">
                Gerar JSON
              </button>
              <button
                className="rounded-lg bg-gradient-to-r from-yellow-300 to-yellow-700 px-4 py-3 text-sm font-extrabold text-black"
                onClick={handleSaveProduction}
                type="button"
              >
                Salvar Produção
              </button>
            </div>

            {feedback && <p className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-slate-200">{feedback}</p>}
          </section>

          <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
            <h2 className="text-lg font-bold">Preview Estruturado</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-black p-4 text-sm leading-6 text-emerald-300">
              {preview}
            </pre>
          </section>
        </div>

        <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
          <h2 className="text-lg font-bold">Tabela de Códigos Conecta</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_100px_120px_auto]">
            <input
              className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
              onChange={(event) => setNewCode((current) => ({ ...current, description: event.target.value }))}
              placeholder="Descrição"
              value={newCode.description}
            />
            <input
              className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
              onChange={(event) => setNewCode((current) => ({ ...current, code: event.target.value }))}
              placeholder="Código"
              value={newCode.code}
            />
            <input
              className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
              onChange={(event) => setNewCode((current) => ({ ...current, points: event.target.value }))}
              placeholder="Pontos"
              type="number"
              value={newCode.points}
            />
            <input
              className="rounded-lg border border-white/10 bg-black px-3 py-3 text-sm"
              onChange={(event) => setNewCode((current) => ({ ...current, value: event.target.value }))}
              placeholder="Valor"
              type="number"
              value={newCode.value}
            />
            <button className="rounded-lg bg-yellow-500 px-4 py-3 text-sm font-extrabold text-black" onClick={handleAddCode}>
              Cadastrar
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
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
                    <td className="px-4 py-3 text-slate-400">R$ {code.value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
          <h2 className="text-lg font-bold">Controle de Produção</h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3">SP</th>
                  <th className="px-4 py-3">Equipe</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Conecta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dataByCompany.production.map((record) => (
                  <tr key={record.id}>
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
      </section>
    </ErpShell>
  );
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitMaterials(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeProductionStatus(value: string): ProductionStatus {
  const normalized = value.toLowerCase();
  if (normalized.includes("ref")) return "Refazer";
  if (normalized.includes("pend")) return "Pendente";
  return "OK";
}
