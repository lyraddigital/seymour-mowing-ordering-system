import { JWTPayload, SignJWT, jwtVerify } from "jose";

const key = new TextEncoder().encode("fefe");

export async function encrypt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1day") // Change this later.
    .sign(key);
}
