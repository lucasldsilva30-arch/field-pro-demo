"use client";

import type { CompanyName } from "@/lib/types";

export type SpreadsheetRow = Record<string, unknown>;

type ModuleSpreadsheetActionsProps<T extends SpreadsheetRow> = {
  empresa: CompanyName;
  moduleKey: "dashboard" | "indicadores" | "funcionarios" | "operacao" | "financeiro";
  moduleLabel: string;
  description?: string;
  rows: T[];
  onImportRows?: (rows: SpreadsheetRow[]) => void | Promise<void>;
};

export function ModuleSpreadsheetActions<T extends SpreadsheetRow>({
  empresa,
  moduleLabel,
  description,
  rows,
}: ModuleSpreadsheetActionsProps<T>) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black p-4 shadow-xl shadow-black/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-yellow-500">Modo demonstracao</p>
          <h2 className="mt-1 text-base font-extrabold text-white">
            {moduleLabel} - {empresa}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {description ?? "Esta aba esta bloqueada para edicao, importacao e exportacao durante a demonstracao."}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs font-bold text-yellow-300">
          Visualizacao somente leitura
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-bold text-slate-300">
          {rows.length} itens visiveis
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-bold text-slate-300">
          Importacao desativada
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-bold text-slate-300">
          Exportacao desativada
        </span>
      </div>
    </section>
  );
}
