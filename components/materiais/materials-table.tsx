"use client";

import type { EnrichedMaterial } from "@/hooks/useMateriais";
import type { MaterialStatus } from "@/lib/types";

type MaterialsTableProps = {
  materials: EnrichedMaterial[];
  onDelete: (id: string) => void;
  onEdit: (material: EnrichedMaterial) => void;
  onView: (material: EnrichedMaterial) => void;
};

export function MaterialsTable({ materials, onDelete, onEdit, onView }: MaterialsTableProps) {
  return (
    <section data-materials-table className="rounded-2xl border border-white/10 bg-black p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Materiais cadastrados</h2>
          <p className="mt-1 text-sm text-slate-400">Os itens abaixo mostram estoque atual, mínimo e alertas de conformidade.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-bold text-slate-300">{materials.length} itens</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Utilizado</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {materials.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  Nenhum material cadastrado para esta empresa.
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr className={material.isLowStock ? "bg-red-500/[0.03]" : "hover:bg-white/[0.02]"} key={material.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-white">{material.material}</p>
                        <p className="mt-1 text-xs text-slate-500">{material.responsavel || "Sem responsável"}</p>
                      </div>
                      {material.isLowStock ? (
                        <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                          Baixo mínimo
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{material.categoria}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {material.currentStock} {material.unidade}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {material.estoqueMinimo} {material.unidade}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {material.utilizado} {material.unidade}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{material.local}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={material.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <IconButton dataDemoNav label="Visualizar" tone="view" onClick={() => onView(material)} />
                      <IconButton label="Editar" tone="edit" onClick={() => onEdit(material)} />
                      <IconButton label="Excluir" tone="delete" onClick={() => onDelete(material.id)} />
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

function StatusBadge({ status }: { status: MaterialStatus }) {
  const styles: Record<MaterialStatus, string> = {
    Disponivel: "bg-emerald-500/10 text-emerald-300",
    "Baixo estoque": "bg-yellow-500/10 text-yellow-300",
    "Sem estoque": "bg-red-500/10 text-red-300",
    Manutencao: "bg-blue-500/10 text-blue-300",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>;
}

function IconButton({
  label,
  tone,
  dataDemoNav,
  onClick,
}: {
  label: string;
  tone: "view" | "edit" | "delete";
  dataDemoNav?: boolean;
  onClick: () => void;
}) {
  const styles = {
    view: "bg-slate-500/10 text-slate-300",
    edit: "bg-yellow-500/10 text-yellow-300",
    delete: "bg-red-500/10 text-red-300",
  };

  const icons = {
    view: "👁",
    edit: "✎",
    delete: "🗑",
  };

  return (
    <button
      className={`grid size-9 place-items-center rounded-lg transition hover:bg-white/10 ${styles[tone]}`}
      data-demo-nav={dataDemoNav ? "true" : undefined}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icons[tone]}
    </button>
  );
}
