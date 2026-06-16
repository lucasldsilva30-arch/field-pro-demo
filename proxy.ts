import { NextResponse } from "next/server";

export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/operacao/:path*", "/indicadores/:path*", "/funcionarios/:path*", "/financeiro/:path*", "/configuracoes/:path*", "/seguranca/:path*", "/login"],
};
