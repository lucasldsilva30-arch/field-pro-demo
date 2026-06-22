"use client";

import { useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { AutomaticReadingsPanel } from "@/components/materiais/automatic-readings-panel";
import { MaterialFormPanel } from "@/components/materiais/material-form-panel";
import { MaterialHistoryModal } from "@/components/materiais/material-history-modal";
import { MaterialSummaryCard } from "@/components/materiais/material-summary-card";
import { MaterialsTable } from "@/components/materiais/materials-table";
import { useMateriais, type EnrichedMaterial, type MaterialDraft } from "@/hooks/useMateriais";
import { parseMaterialUsage } from "@/lib/materials";

type MaterialFilter = "all" | "low" | "empty" | "good";

const emptyDraft = (): MaterialDraft => ({
  material: "",
  categoria: "",
  unidade: "un",
  estoque: "0",
  estoqueMinimo: "0",
  utilizado: "0",
  local: "",
  responsavel: "",
  status: "Disponivel",
  observacoes: "",
});

export default function MateriaisPage() {
  const { empresaAtiva, materials, summary, readings, historyByMaterialId, confirmUsage, upsertMaterial, deleteMaterial } =
    useMateriais();
  const [filter, setFilter] = useState<MaterialFilter>("all");
  const [draft, setDraft] = useState<MaterialDraft>(() => emptyDraft());
  const [editingMaterial, setEditingMaterial] = useState<EnrichedMaterial | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredMaterials = useMemo(() => {
    if (filter === "low") return materials.filter((item) => item.isLowStock);
    if (filter === "empty") return materials.filter((item) => item.currentStock <= 0);
    if (filter === "good") return materials.filter((item) => !item.isLowStock && item.currentStock > 0);
    return materials;
  }, [filter, materials]);

  const selectedHistory = useMemo(() => {
    if (!selectedMaterialId) return [];
    return historyByMaterialId(selectedMaterialId);
  }, [historyByMaterialId, selectedMaterialId]);

  const selectedMaterial = useMemo(() => {
    if (!selectedMaterialId) return null;
    return materials.find((material) => material.id === selectedMaterialId) ?? null;
  }, [materials, selectedMaterialId]);

  function handleSubmit() {
    if (!draft.material.trim() || !draft.categoria.trim()) {
      setFeedback("Preencha material e categoria para salvar.");
      return;
    }

    const saved = upsertMaterial(draft, editingMaterial?.id);
    setEditingMaterial(null);
    setDraft(emptyDraft());
    setFeedback(editingMaterial ? "Material atualizado com sucesso." : "Material cadastrado com sucesso.");
    setSelectedMaterialId(saved.id);
  }

  function handleImportMaterials(rows: SpreadsheetRow[]) {
    rows.forEach((row, index) => {
      const parsed = parseMaterialUsage(row);

      upsertMaterial(
        {
          material: parsed.material || `Material ${index + 1}`,
          categoria: parsed.category || "Geral",
          unidade: parsed.unit || "un",
          estoque: String(parsed.stock),
          estoqueMinimo: String(parsed.minimumStock),
          utilizado: String(parsed.used),
          local: parsed.location || "Sem local",
          responsavel: parsed.responsible || "Sem responsável",
          status: parsed.status,
          observacoes: parsed.notes || "",
        },
        undefined,
      );
    });

    setFeedback(`${rows.length} linhas importadas e processadas na base de materiais.`);
  }

  function handleEditMaterial(material: EnrichedMaterial) {
    setEditingMaterial(material);
    setDraft({
      material: material.material,
      categoria: material.categoria,
      unidade: material.unidade,
      estoque: String(material.estoque),
      estoqueMinimo: String(material.estoqueMinimo),
      utilizado: String(material.utilizado),
      local: material.local,
      responsavel: material.responsavel,
      status: material.status,
      observacoes: material.observacoes,
    });
  }

  function handleDeleteMaterial(id: string) {
    deleteMaterial(id);
    if (selectedMaterialId === id) {
      setSelectedMaterialId(null);
    }
    if (editingMaterial?.id === id) {
      setEditingMaterial(null);
      setDraft(emptyDraft());
    }
    setFeedback("Material removido da lista.");
  }

  function handleViewMaterial(material: EnrichedMaterial) {
    setSelectedMaterialId(material.id);
  }

  function handleClear() {
    setEditingMaterial(null);
    setDraft(emptyDraft());
    setFeedback(null);
  }

  return (
    <ErpShell active="materiais">
      <section className="erp-materials-page grid gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">Controle de materiais</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Estoque inteligente e histórico por material</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              A leitura automática confirma baixas no estoque, atualiza o saldo em tempo real e mantém o kardex de cada item.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3">
            <p className="text-xs text-slate-500">Empresa ativa</p>
            <p className="mt-1 text-lg font-extrabold text-yellow-400">{empresaAtiva}</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MaterialSummaryCard active={filter === "all"} helper="saldo total em estoque" label="Itens em estoque" onClick={() => setFilter("all")} tone="blue" value={String(summary.totalItens)} />
          <MaterialSummaryCard active={filter === "good"} helper="itens em bom nível" label="Saudáveis" onClick={() => setFilter("good")} tone="green" value={String(materials.filter((item) => !item.isLowStock && item.currentStock > 0).length)} />
          <MaterialSummaryCard active={filter === "low"} helper="abaixo do mínimo" label="Baixo estoque" onClick={() => setFilter("low")} tone="yellow" value={String(summary.lowStockCount)} />
          <MaterialSummaryCard active={filter === "empty"} helper="estoque zerado" label="Sem estoque" onClick={() => setFilter("empty")} tone="red" value={String(summary.emptyStockCount)} />
        </section>

        <ModuleSpreadsheetActions
          description="Exporta e importa somente os materiais da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="materiais"
          moduleLabel="Materiais"
          onImportRows={handleImportMaterials}
          rows={materials.map((material) => ({
            empresa: material.empresa,
            material: material.material,
            categoria: material.categoria,
            unidade: material.unidade,
            estoque: material.estoque,
            estoqueMinimo: material.estoqueMinimo,
            utilizado: material.utilizado,
            local: material.local,
            responsavel: material.responsavel,
            status: material.status,
            observacoes: material.observacoes,
          }))}
        />

        <MaterialFormPanel
          draft={draft}
          editing={Boolean(editingMaterial)}
          onCancelEdit={handleClear}
          onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))}
          onClear={handleClear}
          onSubmit={handleSubmit}
        />

        {feedback ? (
          <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">{feedback}</p>
        ) : null}

        <AutomaticReadingsPanel onConfirmUsage={(reading) => confirmUsage(reading)} readings={readings} />

        <MaterialsTable materials={filteredMaterials} onDelete={handleDeleteMaterial} onEdit={handleEditMaterial} onView={handleViewMaterial} />
      </section>

      <MaterialHistoryModal history={selectedHistory} material={selectedMaterial} onClose={() => setSelectedMaterialId(null)} />
    </ErpShell>
  );
}
