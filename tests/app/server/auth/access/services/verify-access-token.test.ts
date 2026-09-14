import { beforeAll, expect, it } from "vitest";

import { AccessAuthenticationError } from "../../../../../../app/server/auth/access/errors/access-authentication-error";
import { AccessUnavailableError } from "../../../../../../app/server/auth/access/errors/access-unavailable-error";
import { verifyAccessToken } from "../../../../../../app/server/auth/access/services/verify-access-token.server";
import { createAccessSigningKey } from "../../../../../support/fixtures/access-signing-key";

let keys: Awaited<ReturnType<typeof createAccessSigningKey>>;
beforeAll(async () => {
  keys = await createAccessSigningKey();
});

it("verifies a signed token and returns only the required claims", async () => {
  const claims = await verifyAccessToken(
    await keys.sign(),
    keys.config,
    keys.verificationKey,
  );
  expect(claims).toEqual({ email: "  ADMIN@EXAMPLE.TEST " });
});

it("rejects an invalid signature", async () => {
  const otherKeys = await createAccessSigningKey();
  await expect(
    verifyAccessToken(
      await otherKeys.sign(),
      keys.config,
      keys.verificationKey,
    ),
  ).rejects.toBeInstanceOf(AccessAuthenticationError);
});

it.each([
  ["wrong issuer", { iss: "https://other.cloudflareaccess.com" }],
  ["wrong audience", { aud: "b".repeat(64) }],
  ["expired", { exp: 1 }],
  ["missing expiry", { exp: undefined }],
  ["missing email", { email: undefined }],
  ["empty email", { email: "  " }],
  ["missing subject", { sub: undefined }],
  ["missing issued-at", { iat: undefined }],
  ["not yet valid", { nbf: Math.floor(Date.now() / 1000) + 600 }],
])("rejects %s claims", async (_name, overrides) => {
  await expect(
    verifyAccessToken(
      await keys.sign(overrides),
      keys.config,
      keys.verificationKey,
    ),
  ).rejects.toBeInstanceOf(AccessAuthenticationError);
});

it("rejects malformed JWTs", async () => {
  await expect(
    verifyAccessToken("not-a-jwt", keys.config, keys.verificationKey),
  ).rejects.toBeInstanceOf(AccessAuthenticationError);
});

it("distinguishes unavailable signing keys from invalid authentication", async () => {
  await expect(
    verifyAccessToken(await keys.sign(), keys.config, async () => {
      throw new Error("network failed");
    }),
  ).rejects.toBeInstanceOf(AccessUnavailableError);
});
