import "server-only";

import { cookies } from "next/headers";

import { encrypt } from "@/app/lib";

const cookie = {
  name: "smos-sesh",
  options: { httpOnly: true, secure: true, path: "/" }, // , sameSite: "lax"
  duration: 24 * 60 * 60 * 1000,
};

export async function createSession(username: string) {
  const expires = new Date(Date.now() + cookie.duration);
  const sessionCookieDetails = await encrypt({ username, expires });
  const cookieStore = await cookies();

  cookieStore.set(cookie.name, sessionCookieDetails, {
    ...cookie.options,
    expires,
  });
}

export function verifySession() {
  try {
  } catch {}
}

export function deleteSession() {}
