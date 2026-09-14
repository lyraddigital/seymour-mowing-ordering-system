import type { AccessConfig } from "../types/access-config";
import type { AccessRuntimeSettings } from "../types/access-runtime-settings";
import { AccessConfigurationError } from "../errors/access-configuration-error";

export function validateAccessConfig(
  settings: Pick<AccessRuntimeSettings, "ACCESS_TEAM_DOMAIN" | "ACCESS_AUD">,
): AccessConfig {
  const issuer = settings.ACCESS_TEAM_DOMAIN ?? "";
  const audience = settings.ACCESS_AUD ?? "";

  if (!issuer || !audience || /replace|placeholder/i.test(issuer + audience)) {
    throw new AccessConfigurationError(
      "Set ACCESS_TEAM_DOMAIN and ACCESS_AUD before release.",
    );
  }

  let issuerUrl: URL;

  try {
    issuerUrl = new URL(issuer);
  } catch {
    throw new AccessConfigurationError(
      "ACCESS_TEAM_DOMAIN must be an HTTPS Cloudflare Access team origin.",
    );
  }

  const validTeamDomain =
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?[.]cloudflareaccess[.]com$/.test(
      issuerUrl.hostname,
    );

  if (
    issuerUrl.protocol !== "https:" ||
    issuerUrl.origin !== issuer ||
    issuerUrl.port ||
    !validTeamDomain
  ) {
    throw new AccessConfigurationError(
      "ACCESS_TEAM_DOMAIN must be an HTTPS Cloudflare Access team origin without a path.",
    );
  }

  if (!/^[a-f0-9]{64}$/.test(audience)) {
    throw new AccessConfigurationError(
      "ACCESS_AUD must be the application's 64-character hexadecimal audience tag.",
    );
  }

  return { issuer, audience };
}
