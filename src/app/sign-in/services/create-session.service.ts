import "server-only";

import { cookies } from "next/headers";

import {
  cookieNames,
  DEFAULT_SESSION_EXPIRY_DURATION_IN_DAYS,
  REMEMBER_ME_SESSION_EXPIRY_DURATION_IN_DAYS,
} from "@/app/configuration";
import { convertFromDaysToMilliseconds } from "@/app/core/lib/util";
import { encrypt } from "@/app/core/lib/jwt";

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
  cookieStore.set(cookieNames.sessionCookie, sessionCookieDetails, {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
    expires,
  });
}
