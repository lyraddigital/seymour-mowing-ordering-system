import {
  createRemoteJWKSet,
  errors,
  jwtVerify,
  type JWTVerifyGetKey,
} from "jose";

import type { AccessConfig } from "../types/access-config";
import type { AccessTokenClaims } from "../types/access-token-claims";
import { AccessAuthenticationError } from "../errors/access-authentication-error";
import { AccessUnavailableError } from "../errors/access-unavailable-error";

const keySets = new Map<string, JWTVerifyGetKey>();

export async function verifyAccessToken(
  token: string,
  config: AccessConfig,
  verificationKey?: JWTVerifyGetKey,
): Promise<AccessTokenClaims> {
  let key = verificationKey ?? keySets.get(config.issuer);

  if (!key) {
    key = createRemoteJWKSet(new URL(config.issuer + "/cdn-cgi/access/certs"));
    keySets.set(config.issuer, key);
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "email", "sub"],
    });

    const email = payload.email;
    const subject = payload.sub;
    const issuedAt = payload.iat;
    const hasValidEmail = typeof email === "string" && email.trim().length > 0;
    const hasValidSubject = typeof subject === "string" && subject.length > 0;
    const hasValidIssuedAt =
      typeof issuedAt === "number" && Number.isFinite(issuedAt);

    if (!hasValidEmail || !hasValidSubject || !hasValidIssuedAt) {
      throw new AccessAuthenticationError();
    }

    return { email };
  } catch (error) {
    if (
      error instanceof AccessAuthenticationError ||
      error instanceof errors.JWTInvalid ||
      error instanceof errors.JWSInvalid ||
      error instanceof errors.JWTClaimValidationFailed ||
      error instanceof errors.JWTExpired ||
      error instanceof errors.JWSSignatureVerificationFailed ||
      error instanceof errors.JOSEAlgNotAllowed ||
      error instanceof errors.JWKSNoMatchingKey
    ) {
      throw new AccessAuthenticationError();
    }

    throw new AccessUnavailableError();
  }
}
