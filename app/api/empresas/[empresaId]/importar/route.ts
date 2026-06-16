import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type SpreadsheetRow = {
  nome?: unknown;
  telefone?: unknown;
  plano?: unknown;
  status?: unknown;
  [key: string]: unknown;
};

type RouteContext = {
  params: Promise<{
    empresaId: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { empresaId } = await context.params;

    if (!empresaId) {
      return NextResponse.json({ error: "ID da empresa é obrigatório." }, { status: 400 });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        dados: {
          orderBy: { criadoEm: "desc" },
        },
      },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 400 });
    }

    const dados = empresa.dados as Array<{
      id: string;
      nome: string;
      telefone: string | null;
      plano: string | null;
      status: string | null;
      criadoEm: Date;
      dadosOriginais: unknown;
    }>;

    return NextResponse.json({
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj,
        status: empresa.status,
      },
      dados: dados.map((item) => ({
        id: item.id,
        nome: item.nome,
        telefone: item.telefone,
        plano: item.plano,
        status: item.status,
        criadoEm: item.criadoEm,
        ...(isPlainObject(item.dadosOriginais) ? item.dadosOriginais : {}),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao buscar dados da empresa.";

    return NextResponse.json(
      {
        error: "Erro interno ao buscar dados da empresa.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    const rows = (await req.json()) as SpreadsheetRow[];

    if (!empresaId) {
      return NextResponse.json({ error: "ID da empresa é obrigatório." }, { status: 400 });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Envie um array com pelo menos uma linha da planilha." }, { status: 400 });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true, nome: true },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 400 });
    }

    const data = rows.map((row) => ({
      nome: toText(row.nome),
      telefone: optionalText(row.telefone),
      plano: optionalText(row.plano),
      status: optionalText(row.status),
      empresaId: empresa.id,
      dadosOriginais: toPrismaJson(row),
    }));

    const invalidRows = data.filter((row) => !row.nome);

    if (invalidRows.length > 0) {
      return NextResponse.json(
        { error: "Todas as linhas importadas precisam ter o campo nome preenchido." },
        { status: 400 },
      );
    }

    /*
      Isolamento multi-empresa:
      O empresaId vem exclusivamente da URL protegida da rota e é validado no banco antes do insert.
      Cada linha recebe automaticamente esse empresaId, então nenhum dado importado pode cair em outra empresa.
    */
    const result = await prisma.dadoPlanilha.createMany({
      data: data as Prisma.DadoPlanilhaCreateManyInput[],
      skipDuplicates: false,
    });

    return NextResponse.json({
      success: true,
      empresaId: empresa.id,
      empresaNome: empresa.nome,
      insertedRows: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao importar planilha.";

    return NextResponse.json(
      {
        error: "Erro interno ao importar planilha.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function optionalText(value: unknown) {
  const text = toText(value);
  return text || null;
}

function toPrismaJson(row: SpreadsheetRow) {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
