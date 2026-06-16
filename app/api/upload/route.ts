import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const GOOGLE_SCRIPT_TIMEOUT_MS = 25000;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      return NextResponse.json(
        { error: "Formato inválido. Envie um arquivo .xlsx ou .xls." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Arquivo muito grande. O limite é 10 MB." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json(
        { error: "A planilha não possui abas para importar." },
        { status: 400 },
      );
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      return NextResponse.json(
        { error: "Configuração GOOGLE_SCRIPT_URL ausente na Vercel." },
        { status: 500 },
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "A planilha está vazia." }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GOOGLE_SCRIPT_TIMEOUT_MS);

    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify(rows),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const details = await response.text().catch(() => response.statusText);
      throw new Error(`Erro no Google Script: ${details || response.statusText}`);
    }

    await response.json().catch(() => null);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Erro detalhado:", error);
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tempo limite excedido ao enviar para o Google Sheets."
        : error instanceof Error
          ? error.message
          : "Erro interno.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
