export function toDateInputValue(value: string | undefined | null) {
  if (!value) {
    return "";
  }

  const parsed = parseDateLike(value);
  if (!parsed) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

export function fromDateInputValue(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function formatDateBr(value: string | undefined | null) {
  const parsed = parseDateLike(value);
  if (!parsed) {
    return value?.trim() || "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

export function parseDateLike(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const iso = new Date(normalized);
  if (!Number.isNaN(iso.getTime())) {
    return iso;
  }

  const parts = normalized.split(/[/-]/).map((part) => Number(part));
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [day, month, year] = parts;
    if (day > 0 && month > 0 && year > 0) {
      const parsed = new Date(year, month - 1, day);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  return null;
}
