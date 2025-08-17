import "server-only";

import { cookies } from "next/headers";

import {
  DEFAULT_SESSION_EXPIRY_DURATION_IN_DAYS,
  REMEMBER_ME_SESSION_EXPIRY_DURATION_IN_DAYS,
} from "@/app/configuration";
import { convertFromDaysToMilliseconds, encrypt } from "@/app/lib";

const cookieName = "smos-sesh";

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

export function verifySession() {
  try {
  } catch {}
}

export function deleteSession() {}
