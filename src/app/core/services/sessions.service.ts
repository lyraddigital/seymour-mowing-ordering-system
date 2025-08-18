"server only";

import { cookies } from "next/headers";

import { cookieNames } from "@/app/configuration";
import { decrypt } from "@/app/core/lib/jwt";

export async function verifySession(): Promise<
  { username: string } | undefined
> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieNames.sessionCookie);

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
  cookieStore.delete(cookieNames.sessionCookie);
}
