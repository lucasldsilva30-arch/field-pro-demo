import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/operacao", "/indicadores", "/funcionarios", "/financeiro", "/configuracoes", "/seguranca"];

export function proxy(req: NextRequest) {
  const isProtected = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));
  const isLoggedIn = req.cookies.get("fieldpro_session")?.value === "active";

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.nextUrl.pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/operacao/:path*", "/indicadores/:path*", "/funcionarios/:path*", "/financeiro/:path*", "/configuracoes/:path*", "/seguranca/:path*", "/login"],
};
