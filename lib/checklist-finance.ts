import { filterErpDataByCompany } from "@/lib/companies";
import type { CompanyName, ErpData } from "@/lib/types";

export type ChecklistCostItem = {
  id: string;
  empresa: CompanyName;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
  origem: string;
};

type StoredChecklistItem = {
  empresa?: string;
  epi?: string;
  material?: string;
  nome?: string;
  quantidade?: number | string;
  valorUnitario?: number | string;
  total?: number | string;
  origem?: string;
};

const LOCAL_STORAGE_KEY = "fieldpro-checklist-preview";

export function buildChecklistCostItems(data: ErpData, empresa: CompanyName) {
  const storedItems = readStoredChecklistItems(empresa);
  if (storedItems.length > 0) {
    return storedItems;
  }

  const companyData = filterErpDataByCompany(data, empresa);
  const grouped = new Map<string, ChecklistCostItem>();

  companyData.production.forEach((record) => {
    record.materiais.forEach((rawItem, index) => {
      const parsed = parseChecklistText(rawItem);
      const itemName = parsed.nome;
      if (!itemName) {
        return;
      }

      const quantity = normalizeNumber(parsed.quantidade ?? 1);
      const value = normalizeNumber(0);
      const key = normalizeKey(itemName);
      const current = grouped.get(key);

      grouped.set(key, {
        id: current?.id ?? `checklist-${record.id}-${index}-${key}`,
        empresa,
        nome: itemName,
        quantidade: normalizeNumber((current?.quantidade ?? 0) + quantity),
        valorUnitario: value || current?.valorUnitario || 0,
        total: roundMoney((current?.total ?? 0) + quantity * value),
        origem: current?.origem ?? "Produção",
      });
    });
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      total: roundMoney(item.quantidade * item.valorUnitario),
    }))
    .sort((left, right) => right.total - left.total || left.nome.localeCompare(right.nome));
}

export function sumChecklistCosts(items: ChecklistCostItem[]) {
  return roundMoney(items.reduce((sum, item) => sum + safeMoney(item.total), 0));
}

function readStoredChecklistItems(empresa: CompanyName): ChecklistCostItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as StoredChecklistItem[] | Record<string, StoredChecklistItem[]>;
    const rows = Array.isArray(parsed) ? parsed : parsed[empresa] ?? [];

    return rows
      .map((row, index) => {
        const nome = text(row.epi ?? row.material ?? row.nome);
        const quantidade = normalizeNumber(row.quantidade ?? 1);
        const valorUnitario = normalizeNumber(row.valorUnitario ?? 0);
        const total = row.total !== undefined ? normalizeNumber(row.total) : roundMoney(quantidade * valorUnitario);

        return {
          id: `stored-${empresa}-${index}`,
          empresa,
          nome,
          quantidade,
          valorUnitario,
          total,
          origem: text(row.origem) || "Checklist",
        } satisfies ChecklistCostItem;
      })
      .filter((item) => item.nome.length > 0);
  } catch {
    return [];
  }
}

function parseChecklistText(value: string) {
  const trimmed = text(value);
  const quantityMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*[xX]?\s*(.*)$/);

  if (!quantityMatch) {
    return { nome: trimmed, quantidade: 1 };
  }

  const quantity = normalizeNumber(quantityMatch[1]);
  const rest = text(quantityMatch[2]) || trimmed;

  return {
    nome: rest,
    quantidade: quantity,
  };
}

function normalizeKey(value: string) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function normalizeNumber(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round((safeMoney(value) + Number.EPSILON) * 100) / 100;
}

function safeMoney(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}
