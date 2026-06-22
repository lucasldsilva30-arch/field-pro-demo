import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, records: [] });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "A demonstração é somente leitura." },
    { status: 403 },
  );
}
