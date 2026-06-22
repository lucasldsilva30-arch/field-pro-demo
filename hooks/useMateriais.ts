"use client";

import { useCallback, useMemo } from "react";
import { createId, useErpData } from "@/hooks/use-erp-data";
import type { MaterialMovement, MaterialRecord, MaterialStatus } from "@/lib/types";

export type MaterialDraft = {
  material: string;
  categoria: string;
  unidade: string;
  estoque: string;
  estoqueMinimo: string;
  utilizado: string;
  local: string;
  responsavel: string;
  status: MaterialStatus;
  observacoes: string;
};

export type MaterialSummary = {
  totalItens: number;
  totalUtilizado: number;
  lowStockCount: number;
  emptyStockCount: number;
  movementCount: number;
};

export type MaterialReading = {
  id: string;
  materialKey: string;
  material: string;
  totalQuantity: number;
  pendingQuantity: number;
  count: number;
  lastDate: string;
  responsible: string;
  processed: boolean;
  materialId?: string;
};

export type EnrichedMaterial = MaterialRecord & {
  currentStock: number;
  isLowStock: boolean;
  deficit: number;
};

export type MaterialHistoryEntry = MaterialMovement;

export function useMateriais() {
  const { dataByCompany, empresaAtiva, addMaterial, updateMaterial, deleteMaterial, addMaterialMovement } = useErpData();

  const materials = useMemo<EnrichedMaterial[]>(
    () =>
      dataByCompany.materials
        .map((material) => {
          const currentStock = Math.max(material.estoque, 0);
          const isLowStock = currentStock <= material.estoqueMinimo;

          return {
            ...material,
            currentStock,
            isLowStock,
            deficit: currentStock - material.estoqueMinimo,
            status: resolveMaterialStatus(currentStock, material.estoqueMinimo, material.status),
          };
        })
        .sort((a, b) => Number(b.isLowStock) - Number(a.isLowStock) || a.material.localeCompare(b.material)),
    [dataByCompany.materials],
  );

  const summary = useMemo<MaterialSummary>(
    () => ({
      totalItens: materials.reduce((sum, item) => sum + item.currentStock, 0),
      totalUtilizado: materials.reduce((sum, item) => sum + item.utilizado, 0),
      lowStockCount: materials.filter((item) => item.isLowStock).length,
      emptyStockCount: materials.filter((item) => item.currentStock <= 0).length,
      movementCount: dataByCompany.materialMovements.length,
    }),
    [dataByCompany.materialMovements.length, materials],
  );

  const readings = useMemo<MaterialReading[]>(() => {
    const grouped = new Map<string, { material: string; totalQuantity: number; count: number; lastDate: string; responsible: string }>();
    const confirmed = new Map<string, number>();

    dataByCompany.materialMovements
      .filter((movement) => movement.type === "Saída" && movement.source === "Leitura automática")
      .forEach((movement) => {
        const key = normalizeMaterialName(movement.material);
        confirmed.set(key, (confirmed.get(key) ?? 0) + movement.quantity);
      });

    dataByCompany.production.forEach((production) => {
      production.materiais.forEach((rawMaterial) => {
        const material = text(rawMaterial);
        if (!material) return;

        const key = normalizeMaterialName(material);
        const current = grouped.get(key) ?? {
          material,
          totalQuantity: 0,
          count: 0,
          lastDate: production.date,
          responsible: production.equipe || "Equipe não informada",
        };

        grouped.set(key, {
          material: current.material,
          totalQuantity: current.totalQuantity + parseMaterialQuantity(material),
          count: current.count + 1,
          lastDate: production.date > current.lastDate ? production.date : current.lastDate,
          responsible: production.equipe || current.responsible,
        });
      });
    });

    return Array.from(grouped.entries())
      .map(([materialKey, item]) => {
        const confirmedQuantity = confirmed.get(materialKey) ?? 0;
        const pendingQuantity = Math.max(item.totalQuantity - confirmedQuantity, 0);
        const material = materials.find((entry) => normalizeMaterialName(entry.material) === materialKey);

        return {
          id: material?.id ?? materialKey,
          materialKey,
          material: item.material,
          totalQuantity: item.totalQuantity,
          pendingQuantity,
          count: item.count,
          lastDate: item.lastDate,
          responsible: item.responsible,
          processed: pendingQuantity <= 0,
          materialId: material?.id,
        };
      })
      .filter((item) => item.pendingQuantity > 0)
      .sort((a, b) => b.pendingQuantity - a.pendingQuantity || a.material.localeCompare(b.material));
  }, [dataByCompany.materialMovements, dataByCompany.production, materials]);

  const historyByMaterialId = useCallback(
    (materialId: string) =>
      dataByCompany.materialMovements
        .filter((movement) => movement.materialId === materialId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [dataByCompany.materialMovements],
  );

  const historyByMaterialName = useCallback(
    (materialName: string) => {
      const key = normalizeMaterialName(materialName);
      return dataByCompany.materialMovements
        .filter((movement) => normalizeMaterialName(movement.material) === key)
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    [dataByCompany.materialMovements],
  );

  const confirmUsage = useCallback(
    (reading: MaterialReading) => {
      const matchingMaterial = materials.find((material) => normalizeMaterialName(material.material) === reading.materialKey);
      const currentDate = new Date().toISOString().slice(0, 10);
      const quantity = Math.max(reading.pendingQuantity, 0);

      if (quantity <= 0) {
        return;
      }

      if (matchingMaterial) {
        const nextStock = Math.max(matchingMaterial.currentStock - quantity, 0);
        const nextUsed = matchingMaterial.utilizado + quantity;
        const nextMaterial: MaterialRecord = {
          ...matchingMaterial,
          estoque: nextStock,
          utilizado: nextUsed,
          status: resolveMaterialStatus(nextStock, matchingMaterial.estoqueMinimo, matchingMaterial.status),
        };

        updateMaterial(nextMaterial);
        addMaterialMovement({
          id: createId("mov"),
          empresa: empresaAtiva,
          materialId: matchingMaterial.id,
          material: matchingMaterial.material,
          date: currentDate,
          quantity,
          type: "Saída",
          responsible: reading.responsible,
          source: "Leitura automática",
          note: "Baixa confirmada a partir da operação.",
        });
        return;
      }

      const nextMaterial: MaterialRecord = {
        id: createId("mat-auto"),
        empresa: empresaAtiva,
        material: reading.material,
        categoria: "Autogerado",
        unidade: "un",
        estoque: 0,
        estoqueMinimo: quantity,
        utilizado: quantity,
        local: "Leitura automática",
        responsavel: reading.responsible,
        status: "Sem estoque",
        observacoes: "Material criado automaticamente a partir da baixa de produção.",
      };

      addMaterial(nextMaterial);
      addMaterialMovement({
        id: createId("mov"),
        empresa: empresaAtiva,
        materialId: nextMaterial.id,
        material: nextMaterial.material,
        date: currentDate,
        quantity,
        type: "Saída",
        responsible: reading.responsible,
        source: "Leitura automática",
        note: "Material criado automaticamente ao confirmar o uso.",
      });
    },
    [addMaterial, addMaterialMovement, empresaAtiva, materials, updateMaterial],
  );

  const upsertMaterial = useCallback(
    (draft: MaterialDraft, editingId?: string | null) => {
      const estoque = parseNumber(draft.estoque);
      const estoqueMinimo = parseNumber(draft.estoqueMinimo);
      const utilizado = parseNumber(draft.utilizado);
      const normalizedStatus = resolveMaterialStatus(estoque, estoqueMinimo, draft.status);

      const material: MaterialRecord = {
        id: editingId ?? createId("mat"),
        empresa: empresaAtiva,
        material: draft.material.trim(),
        categoria: draft.categoria.trim(),
        unidade: draft.unidade.trim() || "un",
        estoque,
        estoqueMinimo,
        utilizado,
        local: draft.local.trim(),
        responsavel: draft.responsavel.trim(),
        status: normalizedStatus,
        observacoes: draft.observacoes.trim(),
      };

      if (editingId) {
        updateMaterial(material);
      } else {
        addMaterial(material);
      }

      return material;
    },
    [addMaterial, empresaAtiva, updateMaterial],
  );

  return {
    empresaAtiva,
    materials,
    summary,
    readings,
    historyByMaterialId,
    historyByMaterialName,
    confirmUsage,
    upsertMaterial,
    deleteMaterial,
  };
}

function resolveMaterialStatus(estoque: number, estoqueMinimo: number, currentStatus: MaterialStatus): MaterialStatus {
  if (estoque <= 0) return "Sem estoque";
  if (estoque <= estoqueMinimo) return "Baixo estoque";
  if (currentStatus === "Manutencao") return currentStatus;
  return "Disponivel";
}

function normalizeMaterialName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function parseMaterialQuantity(material: string) {
  const match = material.trim().match(/^(\d+(?:[.,]\d+)?)\s*/);
  if (!match) return 1;

  const quantity = Number(match[1].replace(",", "."));
  return Number.isFinite(quantity) ? quantity : 1;
}

function parseNumber(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}
