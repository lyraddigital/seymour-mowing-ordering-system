import "server-only";

import { cookies } from "next/headers";

import {
  DEFAULT_SESSION_EXPIRY_DURATION_IN_DAYS,
  REMEMBER_ME_SESSION_EXPIRY_DURATION_IN_DAYS,
} from "@/app/configuration";
import { convertFromDaysToMilliseconds } from "@/app/lib/util";
import { encrypt, decrypt } from "@/app/lib/jwt";

const cookieName = "smom-sesh";

export async function createSession(
  username: string,
  rememberMeFlag: string | undefined
) {
  const durationInDays =
    rememberMeFlag === "on"
      ? REMEMBER_ME_SESSION_EXPIRY_DURATION_IN_DAYS
      : DEFAULT_SESSION_EXPIRY_DURATION_IN_DAYS;
  const duration = convertFromDaysToMilliseconds(durationInDays);
  const expires = new Date(Date.now() + duration);
  const sessionCookieDetails = await encrypt(
    { username, expires },
    durationInDays
  );
  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionCookieDetails, {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
    expires,
  });
}

export async function verifySession(): Promise<
  { username: string } | undefined
> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName);

  if (!sessionCookie?.value) {
    return undefined;
  }

  const session = await decrypt(sessionCookie.value);

  if (!session?.username) {
    return undefined;
  }

  return { username: session.username as string };
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}
