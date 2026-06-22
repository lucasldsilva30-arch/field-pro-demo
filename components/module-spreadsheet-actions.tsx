"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import type { CompanyName } from "@/lib/types";

export type SpreadsheetRow = Record<string, unknown>;

type ModuleSpreadsheetActionsProps<T extends SpreadsheetRow> = {
  empresa: CompanyName;
  moduleKey: "dashboard" | "indicadores" | "funcionarios" | "operacao" | "financeiro" | "vr" | "materiais" | "whatsapp";
  moduleLabel: string;
  description?: string;
  rows: T[];
  onImportRows?: (rows: SpreadsheetRow[]) => void | Promise<void>;
};

type ActionStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

export function ModuleSpreadsheetActions<T extends SpreadsheetRow>({
  empresa,
  moduleKey,
  moduleLabel,
  description,
  rows,
  onImportRows,
}: ModuleSpreadsheetActionsProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<ActionStatus>({ type: "idle", message: "" });

  function handleExport() {
    setIsExporting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ aviso: `Sem dados em ${moduleLabel}` }]);

      XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(moduleLabel));
      XLSX.writeFile(workbook, `${slugify(empresa)}-${slugify(moduleLabel)}.xlsx`, { compression: true });
      setStatus({ type: "success", message: `Arquivo de ${moduleLabel} baixado somente com dados da ${empresa}.` });
    } catch {
      setStatus({ type: "error", message: "Não foi possível gerar a planilha desta aba." });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(file?: File) {
    if (!file) {
      return;
    }

    setIsImporting(true);
    setStatus({ type: "idle", message: "" });

    try {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        throw new Error("Envie um arquivo .xlsx, .xls ou .csv válido.");
      }

      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("A planilha enviada está vazia.");
      }

      const importedRows = XLSX.utils.sheet_to_json<SpreadsheetRow>(workbook.Sheets[firstSheetName], {
        defval: "",
        raw: false,
      });

      if (importedRows.length === 0) {
        throw new Error("Nenhuma linha encontrada para importar.");
      }

      const response = await fetch("/api/empresas/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa,
          modulo: moduleKey,
          sheetName: firstSheetName,
          rows: importedRows,
        }),
      });
      const result = (await response.json()) as { error?: string; savedRows?: number };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao salvar importação.");
      }

      await onImportRows?.(importedRows);

      setStatus({ type: "success", message: `${result.savedRows ?? importedRows.length} linhas importadas e exibidas em ${moduleLabel}.` });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Erro ao importar planilha." });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black p-4 shadow-xl shadow-black/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-yellow-500">Planilha da aba</p>
          <h2 className="mt-1 text-base font-extrabold text-white">{moduleLabel} • {empresa}</h2>
          <p className="mt-1 text-xs text-slate-400">
            {description ?? "Baixe ou suba planilhas sem misturar dados de outras empresas."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-extrabold text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isExporting}
            onClick={handleExport}
            type="button"
          >
            <ActionIcon type="download" />
            {isExporting ? "Baixando..." : "Baixar planilha"}
          </button>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-yellow-500 px-3.5 py-2.5 text-center text-xs font-extrabold text-black transition hover:bg-yellow-400">
            <ActionIcon type="upload" />
            {isImporting ? "Subindo..." : "Subir planilha"}
            <input
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              disabled={isImporting}
              onChange={(event) => handleImport(event.target.files?.[0])}
              type="file"
            />
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-bold text-slate-300">{rows.length} linhas</span>
        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 font-bold text-yellow-300">Empresa isolada</span>
      </div>

      {status.message ? (
        <p
          className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
            status.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </section>
  );
}

function ActionIcon({ type }: { type: "download" | "upload" }) {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {type === "download" ? (
        <>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </>
      ) : (
        <>
          <path d="M12 21V9" />
          <path d="m7 14 5-5 5 5" />
          <path d="M5 3h14" />
        </>
      )}
    </svg>
  );
}

function sanitizeSheetName(value: string) {
  return value.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Dados";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
