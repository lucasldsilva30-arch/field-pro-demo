"use client";

import { type DrilldownData } from "@/lib/indicators";

interface DetailsModalProps {
  data: DrilldownData | null;
  onClose: () => void;
}

export function DetailsModal({ data, onClose }: DetailsModalProps) {
  if (!data) return null;

  const getTitle = () => {
    switch (data.type) {
      case "producaodia":
        return "Produção do Dia";
      case "faturamento":
        return "Faturamento";
      case "apagar":
        return "A Pagar";
      case "vr":
        return "VR Previsto";
      default:
        return "Detalhes";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl border border-yellow-950/70 bg-zinc-950 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 transition hover:text-white"
            aria-label="Fechar"
            data-demo-nav="true"
          >
            ×
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-yellow-950/50 bg-black p-4">
          <p className="text-sm text-slate-400">Total de registros</p>
          <p className="mt-1 text-3xl font-bold text-yellow-400">{data.records.length}</p>
          {data.monthPrevious ? <p className="mt-2 text-xs text-slate-500">Mês anterior: {data.monthPrevious} registros</p> : null}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">Registros:</h3>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {data.records.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-slate-500">Nenhum registro encontrado.</p>
            ) : (
              data.records.map((record, idx) => {
                const isFinance = typeof record.amount === "number" || typeof record.category === "string" || typeof record.description === "string";
                const isVr = typeof record.funcionario === "string" || typeof record.diasTrabalhados === "number";

                return (
                  <div key={record.id || idx} className="rounded-lg border border-white/10 bg-black p-3 text-sm">
                    {isFinance ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">{record.description || "Lançamento"}</span>
                          <span className={record.paid ? "text-emerald-300" : "text-red-300"}>{record.paid ? "Pago" : "Pendente"}</span>
                        </div>
                        <p className="text-xs text-slate-500">{record.category || "Sem categoria"}</p>
                        <p className="text-xs text-slate-500">{record.date || record.id}</p>
                      </div>
                    ) : isVr ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">{record.funcionario || "VR"}</span>
                          <span className="text-yellow-400">{record.amount || 0}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {record.equipe || "Equipe não informada"} • {record.diasTrabalhados || 0} dias • {record.sabados || 0} sábados
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">{record.equipe || "N/A"}</span>
                          <span className="text-yellow-400">{record.points || 0} pontos</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{record.date || "Data não informada"}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-yellow-500 px-4 py-2 font-bold text-black transition hover:bg-yellow-400"
          data-demo-nav="true"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
