export function parseMoney(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const parsed = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatInputMoney(value: number | string) {
  const v = typeof value === "string" ? parseMoney(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v));
}
