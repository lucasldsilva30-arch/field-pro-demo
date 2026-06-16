import type { ConectaCode } from "@/lib/types";
import type { ParsedOperationMessage } from "@/utils/parser";

export function findBestConectaCode(parsed: ParsedOperationMessage, codes: ConectaCode[]) {
  const searchText = normalizeText(
    [
      parsed.raw,
      parsed.sp,
      parsed.cabo,
      parsed.local,
      parsed.status,
      parsed.equipe,
      ...parsed.materiais,
    ].join(" "),
  );

  const rankedCodes = codes
    .map((code) => ({
      code,
      score: scoreCode(searchText, code),
    }))
    .sort((first, second) => second.score - first.score);

  return rankedCodes[0]?.score > 0 ? rankedCodes[0].code : null;
}

function scoreCode(searchText: string, code: ConectaCode) {
  const codeText = normalizeText(`${code.code} ${code.description}`);
  const tokens = codeText.split(" ").filter((token) => token.length >= 3);

  let score = 0;

  if (searchText.includes(normalizeText(code.code))) {
    score += 10;
  }

  tokens.forEach((token) => {
    if (searchText.includes(token)) {
      score += 2;
    }
  });

  return score;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim();
}
