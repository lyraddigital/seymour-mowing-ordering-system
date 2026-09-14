import { normalizeAccountEmail } from "../../normalizers/normalize-account-email";
import type { AccessIdentity } from "../types/access-identity";
import type { AccessRuntimeSettings } from "../types/access-runtime-settings";
import { AccessAuthenticationError } from "../errors/access-authentication-error";
import { AccessConfigurationError } from "../errors/access-configuration-error";
import { validateAccessConfig } from "../config/validate-access-config.server";
import { verifyAccessToken } from "./verify-access-token.server";

export async function getAccessIdentity(
  request: Request,
  settings: AccessRuntimeSettings,
  verifyToken = verifyAccessToken,
): Promise<AccessIdentity> {
  if (settings.APP_ENV === "local") {
    const email = normalizeAccountEmail(settings.DEV_AUTH_EMAIL ?? "");

    if (!email) {
      throw new AccessConfigurationError(
        "Set DEV_AUTH_EMAIL for local development.",
      );
    }

    return { email };
  }

  if (settings.APP_ENV !== "staging" && settings.APP_ENV !== "production") {
    throw new AccessConfigurationError("Unknown runtime environment.");
  }

  const config = validateAccessConfig(settings);
  const token = request.headers.get("Cf-Access-Jwt-Assertion");

  if (!token) {
    throw new AccessAuthenticationError();
  }

  const claims = await verifyToken(token, config);
  const email = normalizeAccountEmail(claims.email);

  if (!email) {
    throw new AccessAuthenticationError();
  }

  return { email };
}
