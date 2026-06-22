import type { MaterialStatus } from "@/lib/types";

export type ParsedMaterialRow = {
  material: string;
  category: string;
  unit: string;
  stock: number;
  minimumStock: number;
  used: number;
  location: string;
  responsible: string;
  status: MaterialStatus;
  notes: string;
};

export function parseMaterialUsage(row: Record<string, unknown>): ParsedMaterialRow {
  return {
    material: text(row.material ?? row.Material ?? row["Nome do material"]),
    category: text(row.categoria ?? row.Categoria ?? row["Categoria"]),
    unit: text(row.unidade ?? row.Unidade ?? row["Unidade"]) || "un",
    stock: number(row.estoque ?? row.Estoque ?? row["Estoque"]),
    minimumStock: number(row.estoqueMinimo ?? row["Estoque mínimo"] ?? row["Estoque Minimo"]),
    used: number(row.utilizado ?? row.Utilizado ?? row["Utilizado"]),
    location: text(row.local ?? row.Local ?? row["Local"]),
    responsible: text(row.responsavel ?? row["Responsável"] ?? row["Responsavel"]),
    status: normalizeStatus(text(row.status ?? row.Status)),
    notes: text(row.observacoes ?? row["Observações"] ?? row["Observacoes"]),
  };
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function number(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: string): MaterialStatus {
  const normalized = value.toLowerCase();
  if (normalized.includes("baixo")) return "Baixo estoque";
  if (normalized.includes("sem")) return "Sem estoque";
  if (normalized.includes("man")) return "Manutencao";
  return "Disponivel";
}
