import { expect, it } from "vitest";

import { AccessConfigurationError } from "../../../../../../app/server/auth/access/errors/access-configuration-error";
import { validateAccessConfig } from "../../../../../../app/server/auth/access/config/validate-access-config.server";

const settings = {
  ACCESS_TEAM_DOMAIN: "https://seymour-test.cloudflareaccess.com",
  ACCESS_AUD: "a".repeat(64),
};

it("returns a validated issuer and application audience", () => {
  expect(validateAccessConfig(settings)).toEqual({
    issuer: settings.ACCESS_TEAM_DOMAIN,
    audience: settings.ACCESS_AUD,
  });
});

it.each([
  undefined,
  "",
  "https://REPLACE-ME.cloudflareaccess.com",
  "http://team.cloudflareaccess.com",
  "https://evil.test",
  "https://team.cloudflareaccess.com/path",
  "https://team.cloudflareaccess.com:444",
  "https://team.cloudflareaccess.com/",
  "https://user@team.cloudflareaccess.com",
  "not-a-url",
])("rejects an invalid issuer %s", (issuer) => {
  expect(() =>
    validateAccessConfig({ ...settings, ACCESS_TEAM_DOMAIN: issuer }),
  ).toThrow(AccessConfigurationError);
});

it.each([undefined, "", "REPLACE_WITH_ACCESS_AUD", "not-an-audience"])(
  "rejects invalid audience %s",
  (audience) => {
    expect(() =>
      validateAccessConfig({ ...settings, ACCESS_AUD: audience }),
    ).toThrow(AccessConfigurationError);
  },
);
