export type ParsedOperationMessage = {
  sp: string | null;
  cabo: string | null;
  local: string | null;
  status: string | null;
  equipe: string | null;
  materiais: string[];
  raw: string;
  confidence: number;
  missingFields: Array<keyof Omit<ParsedOperationMessage, "raw" | "confidence" | "missingFields">>;
};

type ParserField = keyof Omit<ParsedOperationMessage, "raw" | "confidence" | "missingFields" | "materiais">;

const patterns: Record<ParserField, RegExp[]> = {
  sp: [
    /\bSP\s*[:#-]?\s*([A-Z0-9.-]+)/i,
    /\b(?:solicita[cç][aã]o|ordem|os)\s*[:#-]?\s*([A-Z0-9.-]+)/i,
  ],
  cabo: [
    /\bCabo\s*[:#-]?\s*([A-Z0-9./ _-]+)/i,
    /\b(?:cto|fibra|fo)\s*[:#-]?\s*([A-Z0-9./ _-]+)/i,
  ],
  local: [
    /\bLocal\s*[:#-]?\s*([^\n\r]+)/i,
    /\bEndere[cç]o\s*[:#-]?\s*([^\n\r]+)/i,
    /\bRua\s+([^\n\r]+)/i,
  ],
  status: [
    /\bStatus\s*[:#-]?\s*([^\n\r]+)/i,
    /\bSitua[cç][aã]o\s*[:#-]?\s*([^\n\r]+)/i,
  ],
  equipe: [
    /\bEquipe\s*[:#-]?\s*([^\n\r]+)/i,
    /\bT[eé]cnico(?:s)?\s*[:#-]?\s*([^\n\r]+)/i,
  ],
};

const materialsPatterns = [
  /\bMateriais?\s*[:#-]?\s*([^\n\r]+)/i,
  /\bMaterial utilizado\s*[:#-]?\s*([^\n\r]+)/i,
  /\bItens?\s*[:#-]?\s*([^\n\r]+)/i,
];

export function parseOperationMessage(message: string): ParsedOperationMessage {
  const raw = normalizeInput(message);
  const parsed = {
    sp: findFirst(raw, patterns.sp),
    cabo: findFirst(raw, patterns.cabo),
    local: findFirst(raw, patterns.local),
    status: findFirst(raw, patterns.status),
    equipe: findFirst(raw, patterns.equipe),
    materiais: parseMaterials(findFirst(raw, materialsPatterns)),
    raw,
  };
  const missingFields = getMissingFields(parsed);
  const confidence = Number(((6 - missingFields.length) / 6).toFixed(2));

  return {
    ...parsed,
    confidence,
    missingFields,
  };
}

function normalizeInput(message: string) {
  return message
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findFirst(value: string, fieldPatterns: RegExp[]) {
  for (const pattern of fieldPatterns) {
    const match = value.match(pattern)?.[1]?.trim();

    if (match) {
      return cleanValue(match);
    }
  }

  return null;
}

function cleanValue(value: string) {
  return value.replace(/\s{2,}/g, " ").replace(/[;,.]$/g, "").trim();
}

function parseMaterials(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,;|+]/)
    .map((item) => cleanValue(item))
    .filter(Boolean);
}

function getMissingFields(
  parsed: Omit<ParsedOperationMessage, "confidence" | "missingFields">,
): ParsedOperationMessage["missingFields"] {
  const missingFields: ParsedOperationMessage["missingFields"] = [];

  if (!parsed.sp) missingFields.push("sp");
  if (!parsed.cabo) missingFields.push("cabo");
  if (!parsed.local) missingFields.push("local");
  if (!parsed.status) missingFields.push("status");
  if (!parsed.equipe) missingFields.push("equipe");
  if (parsed.materiais.length === 0) missingFields.push("materiais");

  return missingFields;
}
