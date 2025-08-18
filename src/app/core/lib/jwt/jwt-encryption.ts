import { JWTPayload, SignJWT, jwtVerify } from "jose";

import { JWT_SECRET_KEY } from "@/app/configuration";

const key = new TextEncoder().encode(JWT_SECRET_KEY);

export async function encrypt(
  payload: JWTPayload,
  durationInDays: number
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${durationInDays}day`)
    .sign(key);
}

export async function decrypt(
  decryptedValue: string
): Promise<JWTPayload | undefined> {
  try {
    const { payload } = await jwtVerify(decryptedValue, key, {
      algorithms: ["HS256"],
    });

    return payload;
  } catch {
    return undefined;
  }
}
