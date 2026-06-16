import { NextRequest, NextResponse } from "next/server";
import { parseOperationMessage, type ParsedOperationMessage } from "@/utils/parser";

export const runtime = "nodejs";

type OperationPayload = {
  message?: string;
  data?: ParsedOperationMessage;
};

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as OperationPayload;
    const parsed = payload.data ?? (payload.message ? parseOperationMessage(payload.message) : null);

    if (!parsed) {
      return NextResponse.json(
        { error: "Informe a mensagem ou o JSON estruturado da operação." },
        { status: 400 },
      );
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      return NextResponse.json(
        { error: "Configuração GOOGLE_SCRIPT_URL ausente na Vercel." },
        { status: 500 },
      );
    }

    const row = [
      new Date().toISOString(),
      parsed.sp ?? "",
      parsed.cabo ?? "",
      parsed.local ?? "",
      parsed.status ?? "",
      parsed.equipe ?? "",
      parsed.materiais.join(", "),
      String(parsed.confidence),
      parsed.missingFields.join(", "),
      parsed.raw,
    ];

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify([row]),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => response.statusText);
      throw new Error(details || response.statusText);
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: unknown) {
    console.error("Erro ao salvar operação:", error);
    const message = error instanceof Error ? error.message : "Erro interno.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
