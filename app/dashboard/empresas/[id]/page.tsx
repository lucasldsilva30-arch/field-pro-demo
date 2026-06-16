"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import * as XLSX from "xlsx";

type ImportStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

type SpreadsheetRow = Record<string, string | number | boolean | null>;

type ExportResponse = {
  empresa?: {
    id: string;
    nome: string;
    cnpj?: string | null;
    status?: string;
  };
  dados?: SpreadsheetRow[];
  error?: string;
};

export default function EmpresaDadosPage() {
  const params = useParams<{ id: string }>();
  const empresaId = params.id;
  const [status, setStatus] = useState<ImportStatus>({ type: "idle", message: "" });
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [lastRowsCount, setLastRowsCount] = useState(0);

  async function handleImport(file?: File) {
    if (!file) {
      return;
    }

    setIsImporting(true);
    setStatus({ type: "idle", message: "" });

    try {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        throw new Error("Arquivo inválido. Envie uma planilha .xlsx, .xls ou .csv.");
      }

      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("A planilha está vazia.");
      }

      const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(workbook.Sheets[sheetName], {
        defval: "",
        raw: false,
      });

      if (rows.length === 0) {
        throw new Error("Nenhuma linha encontrada para importar.");
      }

      const response = await fetch(`/api/empresas/${empresaId}/importar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
      const result = (await response.json()) as { error?: string; insertedRows?: number; empresaNome?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao importar planilha.");
      }

      setEmpresaNome(result.empresaNome ?? empresaNome);
      setLastRowsCount(result.insertedRows ?? rows.length);
      setStatus({ type: "success", message: `${result.insertedRows ?? rows.length} linhas importadas com sucesso.` });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Erro ao importar planilha." });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch(`/api/empresas/${empresaId}/importar`, { cache: "no-store" });
      const payload = (await response.json()) as ExportResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao buscar dados da empresa.");
      }

      const rows = payload.dados ?? [];
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ aviso: "Nenhum dado encontrado para exportar." }]);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
      XLSX.writeFile(workbook, "relatorio_empresa.xlsx", { compression: true });

      setEmpresaNome(payload.empresa?.nome ?? empresaNome);
      setStatus({ type: "success", message: `Relatório exportado com ${rows.length} linhas.` });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Erro ao exportar relatório." });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white lg:px-8">
      <section className="mx-auto grid max-w-6xl gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-yellow-950/70 bg-zinc-950 p-6 shadow-2xl shadow-black/40 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-yellow-500">Gestão de dados da empresa</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{empresaNome}</h1>
            <p className="mt-2 text-sm text-slate-400">ID: {empresaId}</p>
          </div>
          <Link
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-300"
            href="/dashboard"
          >
            Voltar ao dashboard
          </Link>
        </header>

        {status.message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-yellow-950/70 bg-zinc-950 p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-yellow-500">Card 1</p>
                <h2 className="mt-2 text-2xl font-black">Importar Dados via Planilha</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Suba uma planilha Excel ou CSV. O sistema lê no navegador e envia o JSON para o banco isolado desta empresa.
                </p>
              </div>
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">XLSX/CSV</span>
            </div>

            <label className="mt-6 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-yellow-500/40 bg-black p-6 text-center transition hover:border-yellow-400 hover:bg-yellow-500/10">
              <span className="grid size-14 place-items-center rounded-2xl bg-yellow-500 text-2xl font-black text-black">↑</span>
              <span className="mt-4 text-lg font-extrabold">Selecionar planilha</span>
              <span className="mt-2 max-w-sm text-sm text-slate-500">
                Clique aqui para escolher um arquivo .xlsx, .xls ou .csv.
              </span>
              <input
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                disabled={isImporting || isExporting}
                onChange={(event) => handleImport(event.target.files?.[0])}
                type="file"
              />
            </label>

            <button
              className="mt-5 w-full rounded-2xl bg-yellow-500 px-5 py-4 text-sm font-black text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isImporting || isExporting}
              type="button"
            >
              {isImporting ? "Processando planilha..." : lastRowsCount > 0 ? `${lastRowsCount} linhas importadas` : "Aguardando arquivo"}
            </button>
          </article>

          <article className="rounded-3xl border border-emerald-950/70 bg-zinc-950 p-6 shadow-2xl shadow-black/30">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">Card 2</p>
              <h2 className="mt-2 text-2xl font-black">Exportar Relatórios</h2>
              <p className="mt-2 text-sm text-slate-400">
                Baixe a base atual da empresa diretamente do banco em formato Excel.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black p-6">
              <p className="text-sm font-bold text-slate-300">Arquivo gerado</p>
              <p className="mt-2 text-2xl font-black text-emerald-300">relatorio_empresa.xlsx</p>
              <p className="mt-2 text-sm text-slate-500">
                O relatório usa somente os dados vinculados ao ID desta empresa.
              </p>
            </div>

            <button
              className="mt-5 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isExporting || isImporting}
              onClick={handleExport}
              type="button"
            >
              {isExporting ? "Gerando Excel..." : "Exportar Base de Dados"}
            </button>
          </article>
        </section>
      </section>
    </main>
  );
}
