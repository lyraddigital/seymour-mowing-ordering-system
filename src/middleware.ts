import { NextRequest, NextResponse } from "next/server";

import { verifySession } from "@/app/services";

export default async function middleware(req: NextRequest) {
  const session = await verifySession();

  if (!session?.username) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/images|favicon.ico|sign-in).*)"],
};
