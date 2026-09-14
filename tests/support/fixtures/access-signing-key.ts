import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTPayload,
} from "jose";

export async function createAccessSigningKey() {
  const pair = await generateKeyPair("RS256");
  const jwks = {
    keys: [
      { ...(await exportJWK(pair.publicKey)), kid: "test-key", alg: "RS256" },
    ],
  };
  const config = {
    issuer: "https://seymour-test.cloudflareaccess.com",
    audience: "a".repeat(64),
  };

  async function sign(overrides: JWTPayload = {}) {
    return new SignJWT({
      email: "  ADMIN@EXAMPLE.TEST ",
      iss: config.issuer,
      aud: config.audience,
      sub: "test-user",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      ...overrides,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .sign(pair.privateKey);
  }

  return { config, jwks, verificationKey: createLocalJWKSet(jwks), sign };
}
