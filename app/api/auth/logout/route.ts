import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.delete("fieldpro_session");
  return response;
}
