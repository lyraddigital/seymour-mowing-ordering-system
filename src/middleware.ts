import { NextRequest, NextResponse } from "next/server";

import { pagePaths } from "@/app/core/configuration";
import { verifySession } from "@/app/core/services";

export default async function middleware(req: NextRequest) {
  const session = await verifySession();

  if (!session?.username) {
    return NextResponse.redirect(new URL(pagePaths.signIn, req.nextUrl));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/images|favicon.ico|sign-in).*)"],
};
