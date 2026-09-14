import { unstable_readConfig as readConfig } from "wrangler";
import { validateAccessConfig } from "../../app/server/auth/access/config/validate-access-config.server.ts";

const environment = process.argv[2];

if (environment !== "staging" && environment !== "production") {
  console.error("Usage: npm run validate:access -- staging|production");
  process.exit(1);
}

try {
  const config = readConfig({ config: "wrangler.jsonc", env: environment });

  if (config.vars.APP_ENV !== environment) {
    throw new Error(
      "APP_ENV does not match the requested release environment.",
    );
  }

  validateAccessConfig({
    ACCESS_TEAM_DOMAIN:
      typeof config.vars.ACCESS_TEAM_DOMAIN === "string"
        ? config.vars.ACCESS_TEAM_DOMAIN
        : undefined,
    ACCESS_AUD:
      typeof config.vars.ACCESS_AUD === "string"
        ? config.vars.ACCESS_AUD
        : undefined,
  });

  console.log("Access configuration valid for " + environment + ".");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Invalid Access configuration.",
  );
  process.exitCode = 1;
}
