import { NextRequest, NextResponse } from "next/server";
import { isCompanyName } from "@/lib/companies";

export const runtime = "nodejs";

type ImportedRow = Record<string, string | number | boolean | null>;

type ImportPayload = {
  empresaId?: string;
  modulo?: string;
  sheetName?: string;
  rows?: ImportedRow[];
};

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ImportPayload;

    if (!isCompanyName(payload.empresaId)) {
      return NextResponse.json({ error: "Empresa inválida para importação." }, { status: 400 });
    }

    if (!Array.isArray(payload.rows) || payload.rows.length === 0) {
      return NextResponse.json({ error: "Nenhuma linha recebida para importar." }, { status: 400 });
    }

    const sanitizedRows = payload.rows.map((row) => ({
      empresa: payload.empresaId,
      ...sanitizeRow(row),
      importedAt: new Date().toISOString(),
      sourceSheet: payload.sheetName ?? "Planilha importada",
    }));

    const scriptUrl = process.env.GOOGLE_EMPRESAS_IMPORT_SCRIPT_URL ?? process.env.GOOGLE_SCRIPT_URL;

    if (scriptUrl) {
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          type: "empresa-import",
          empresaId: payload.empresaId,
          modulo: payload.modulo,
          sheetName: payload.sheetName,
          rows: sanitizedRows,
        }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => response.statusText);
        throw new Error(details || "Falha ao gravar os dados importados.");
      }
    }

    return NextResponse.json({
      success: true,
      persisted: Boolean(scriptUrl),
      empresaId: payload.empresaId,
      modulo: payload.modulo ?? "geral",
      savedRows: sanitizedRows.length,
      sample: sanitizedRows.slice(0, 3),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao importar planilha.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sanitizeRow(row: ImportedRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.trim(),
      typeof value === "string" ? value.trim() : value,
    ]),
  );
}
