"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { createId, useErpData } from "@/hooks/use-erp-data";
import { findBestConectaCode } from "@/utils/conecta-matcher";
import { parseOperationMessage, type ParsedOperationMessage } from "@/utils/parser";
import type { ProductionRecord, ProductionStatus, WhatsAppMessageRecord } from "@/lib/types";

const exampleMessage = `SP: 45872
Cabo: CTO-12 / FO-08
Local: Rua das Palmeiras, 120 - Centro
Status: OK
Equipe: Equipe Norte
Materiais: 80m fibra, 2 conectores, 1 CTO`;

const statusOptions: ProductionStatus[] = ["OK", "Pendente", "Refazer"];

export default function WhatsAppPage() {
  const { data, dataByCompany, empresaAtiva, addProduction, addWhatsAppMessage } = useErpData();
  const [message, setMessage] = useState(exampleMessage);
  const [parsed, setParsed] = useState<ParsedOperationMessage>(() => parseOperationMessage(exampleMessage));
  const [previewText, setPreviewText] = useState(() => JSON.stringify(parseOperationMessage(exampleMessage), null, 2));
  const [selectedCodeId, setSelectedCodeId] = useState(data.conectaCodes[0]?.id ?? "");
  const [status, setStatus] = useState<ProductionStatus>("OK");
  const [launchedConecta, setLaunchedConecta] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCode = data.conectaCodes.find((code) => code.id === selectedCodeId) ?? data.conectaCodes[0];
  const suggestedCode = useMemo(() => findBestConectaCode(parsed, data.conectaCodes), [data.conectaCodes, parsed]);
  const previewDraft = useMemo(() => parsePreviewText(previewText, parsed), [parsed, previewText]);
  const previewIsValid = previewDraft !== null;
  const previewWarning = !previewIsValid || previewDraft.confidence < 0.9;

  const handleSaveMessage = useCallback(() => {
    const nextParsed = parsePreviewText(previewText, parsed);

    if (!nextParsed) {
      setFeedback("O preview está inválido. Corrija o JSON antes de salvar.");
      return;
    }

    const code = selectedCode ?? findBestConectaCode(nextParsed, data.conectaCodes);

    if (!code) {
      setFeedback("Cadastre ou selecione um código Conecta antes de salvar a mensagem.");
      return;
    }

    const whatsappMessage: WhatsAppMessageRecord = {
      id: createId("wa"),
      empresa: empresaAtiva,
      recebidoEm: new Date().toISOString(),
      remetente: "Equipe operacional",
      mensagem: nextParsed.raw,
      sp: nextParsed.sp ?? "",
      cabo: nextParsed.cabo ?? "",
      local: nextParsed.local ?? "",
      status,
      equipe: nextParsed.equipe ?? "Sem equipe",
      materiais: nextParsed.materiais,
      confidence: nextParsed.confidence,
      launchedConecta,
    };

    const production: ProductionRecord = {
      id: createId("prod-wa"),
      empresa: empresaAtiva,
      date: new Date().toISOString().slice(0, 10),
      sp: whatsappMessage.sp,
      cabo: whatsappMessage.cabo,
      local: whatsappMessage.local,
      status: whatsappMessage.status,
      equipe: whatsappMessage.equipe,
      materiais: whatsappMessage.materiais,
      conectaCodeId: code.id,
      conectaCode: code.code,
      points: code.points,
      value: code.value,
      launchedConecta,
      rawMessage: whatsappMessage.mensagem,
    };

    addWhatsAppMessage(whatsappMessage);
    addProduction(production);
    setParsed(nextParsed);
    setPreviewText(JSON.stringify(nextParsed, null, 2));
    setFeedback("Mensagem processada e enviada para o fluxo de produção da empresa ativa.");
  }, [addProduction, addWhatsAppMessage, empresaAtiva, launchedConecta, data.conectaCodes, parsed, previewText, selectedCode, status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        handleSaveMessage();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSaveMessage]);

  function handleParse() {
    const nextParsed = parseOperationMessage(message);
    const matchedCode = findBestConectaCode(nextParsed, data.conectaCodes);

    setParsed(nextParsed);
    setPreviewText(JSON.stringify(nextParsed, null, 2));
    if (matchedCode) {
      setSelectedCodeId(matchedCode.id);
    }
    setFeedback(null);
  }

  function handleImportMessages(rows: SpreadsheetRow[]) {
    rows.forEach((row, index) => {
      const raw = String(row.mensagem ?? row.mensagemOriginal ?? row.raw ?? JSON.stringify(row));
      const parsedRow = parseOperationMessage(raw);
      const code = findBestConectaCode(parsedRow, data.conectaCodes) ?? data.conectaCodes[0];

      if (!code) {
        return;
      }

      addWhatsAppMessage({
        id: createId("wa-import"),
        empresa: empresaAtiva,
        recebidoEm: String(row.recebidoEm ?? new Date().toISOString()),
        remetente: String(row.remetente ?? row.origem ?? `Importado ${index + 1}`),
        mensagem: raw,
        sp: parsedRow.sp ?? "",
        cabo: parsedRow.cabo ?? "",
        local: parsedRow.local ?? "",
        status: normalizeProductionStatus(parsedRow.status ?? "OK"),
        equipe: parsedRow.equipe ?? "Sem equipe",
        materiais: parsedRow.materiais,
        confidence: parsedRow.confidence,
        launchedConecta: String(row.launchedConecta ?? row.conecta ?? "").toLowerCase().includes("true"),
      });

      addProduction({
        id: createId("prod-wa-import"),
        empresa: empresaAtiva,
        date: String(row.date ?? row.data ?? new Date().toISOString().slice(0, 10)),
        sp: parsedRow.sp ?? `WA-${index + 1}`,
        cabo: parsedRow.cabo ?? "",
        local: parsedRow.local ?? "",
        status: normalizeProductionStatus(parsedRow.status ?? "OK"),
        equipe: parsedRow.equipe ?? "Sem equipe",
        materiais: parsedRow.materiais,
        conectaCodeId: code.id,
        conectaCode: code.code,
        points: code.points,
        value: code.value,
        launchedConecta: String(row.launchedConecta ?? row.conecta ?? "").toLowerCase().includes("true"),
        rawMessage: raw,
      });
    });

    setFeedback(`${rows.length} mensagens importadas para ${empresaAtiva}.`);
  }

  return (
    <ErpShell active="whatsapp">
      <section className="grid gap-6">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">WhatsApp</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Leitura de mensagens da equipe</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            Aqui fica só o fluxo de mensagens: leitura, parse automático, sugestão do Conecta e envio para a produção.
          </p>
        </header>

        <ModuleSpreadsheetActions
          description="Exporta e importa somente mensagens de WhatsApp da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="whatsapp"
          moduleLabel="WhatsApp"
          onImportRows={handleImportMessages}
          rows={dataByCompany.whatsappMessages}
        />

        <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
          <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <label className="text-sm font-semibold text-slate-300" htmlFor="message-input">
              Mensagem recebida
            </label>
            <textarea
              className="mt-3 min-h-48 w-full rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-slate-100 outline-none transition focus:border-emerald-500/60"
              id="message-input"
              onChange={(event) => setMessage(event.target.value)}
              value={message}
            />

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <select
                className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm"
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
                className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm"
                onChange={(event) => setStatus(event.target.value as ProductionStatus)}
                value={status}
              >
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-3 text-sm">
                <input
                  checked={launchedConecta}
                  onChange={(event) => setLaunchedConecta(event.target.checked)}
                  type="checkbox"
                />
                Lançado no Conecta
              </label>
            </div>

            {suggestedCode ? (
              <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Sugestão automática Conecta: <strong>{suggestedCode.code}</strong> — {suggestedCode.description}
              </p>
            ) : (
              <p className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                Nenhum código Conecta sugerido ainda. Cadastre palavras-chave na descrição do código.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold" onClick={handleParse} type="button">
                Gerar JSON
              </button>
              <button
                className="rounded-xl bg-gradient-to-r from-emerald-300 to-emerald-600 px-4 py-3 text-sm font-extrabold text-black"
                onClick={handleSaveMessage}
                type="button"
              >
                Salvar mensagem
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">Atalho: Ctrl + Enter para salvar a mensagem.</p>

            {feedback ? <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-200">{feedback}</p> : null}
          </section>

          <section
            className={`rounded-2xl border p-6 ${
              previewWarning ? "border-red-500/40 bg-red-500/5" : "border-white/10 bg-zinc-950"
            }`}
          >
            <div className="flex items-center gap-2">
              {previewWarning ? <WarningIcon className="text-red-400" /> : <SuccessIcon className="text-emerald-400" />}
              <h2 className="text-lg font-bold">Preview estruturado</h2>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Edite o JSON antes de salvar. Se a confiança ficar abaixo de 90%, a revisão manual será destacada.
            </p>
            <textarea
              className={`mt-4 min-h-80 w-full rounded-2xl border bg-black p-4 font-mono text-sm leading-6 text-emerald-300 outline-none transition ${
                previewWarning ? "border-red-500/60 focus:border-red-400" : "border-white/10 focus:border-emerald-500/60"
              }`}
              onChange={(event) => setPreviewText(event.target.value)}
              spellCheck={false}
              value={previewText}
            />
            {!previewIsValid ? (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                JSON inválido. Corrija a estrutura do preview antes de salvar.
              </p>
            ) : previewWarning ? (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                Confiança abaixo de 90%. Verifique o conteúdo manualmente.
              </p>
            ) : null}
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-black p-6">
          <h2 className="text-lg font-bold">Mensagens recentes</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Recebido em</th>
                  <th className="px-4 py-3">Remetente</th>
                  <th className="px-4 py-3">Equipe</th>
                  <th className="px-4 py-3">SP</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Confiança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dataByCompany.whatsappMessages.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-300">{formatDateTime(item.recebidoEm)}</td>
                    <td className="px-4 py-3 text-slate-300">{item.remetente}</td>
                    <td className="px-4 py-3 text-slate-300">{item.equipe}</td>
                    <td className="px-4 py-3 font-bold text-yellow-300">{item.sp}</td>
                    <td className="px-4 py-3">
                      <StatusBadge launched={item.launchedConecta} />
                    </td>
                    <td className="px-4 py-3 text-slate-300">{Math.round(item.confidence * 100)}%</td>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function normalizeProductionStatus(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("ref")) return "Refazer";
  if (normalized.includes("pend")) return "Pendente";
  return "OK";
}

function parsePreviewText(previewText: string, fallback: ParsedOperationMessage) {
  try {
    const parsed = JSON.parse(previewText) as Partial<ParsedOperationMessage>;

    if (!parsed || Array.isArray(parsed)) {
      throw new Error("Preview inválido");
    }

    return {
      sp: typeof parsed.sp === "string" ? parsed.sp : fallback.sp,
      cabo: typeof parsed.cabo === "string" ? parsed.cabo : fallback.cabo,
      local: typeof parsed.local === "string" ? parsed.local : fallback.local,
      status: typeof parsed.status === "string" ? parsed.status : fallback.status,
      equipe: typeof parsed.equipe === "string" ? parsed.equipe : fallback.equipe,
      materiais: Array.isArray(parsed.materiais) ? parsed.materiais.map((item) => String(item)).filter(Boolean) : fallback.materiais,
      raw: typeof parsed.raw === "string" ? parsed.raw : fallback.raw,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : Number(fallback.confidence ?? 0),
      missingFields: Array.isArray(parsed.missingFields)
        ? (parsed.missingFields.filter((field): field is ParsedOperationMessage["missingFields"][number] =>
            ["sp", "cabo", "local", "status", "equipe", "materiais"].includes(String(field)),
          ) as ParsedOperationMessage["missingFields"])
        : fallback.missingFields,
    } satisfies ParsedOperationMessage;
  } catch {
    return null;
  }
}

function StatusBadge({ launched }: { launched: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
        launched ? "bg-emerald-500 text-black" : "bg-yellow-400 text-black"
      }`}
    >
      <span className={`size-1.5 rounded-full ${launched ? "bg-black" : "bg-black/70"}`} />
      {launched ? "Processado" : "Pendente"}
    </span>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`h-5 w-5 ${className ?? ""}`} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3.5 2.8 19a1.3 1.3 0 0 0 1.1 2h16.2a1.3 1.3 0 0 0 1.1-2L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 8v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`h-5 w-5 ${className ?? ""}`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}
