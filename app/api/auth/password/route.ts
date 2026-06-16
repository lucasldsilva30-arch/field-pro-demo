import { NextRequest, NextResponse } from "next/server";
import { getCurrentPassword, saveCurrentPassword } from "@/lib/server-password";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "A nova senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
    }

    if (currentPassword !== getCurrentPassword()) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
    }

    saveCurrentPassword(newPassword);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível redefinir a senha." }, { status: 500 });
  }
}
