import { beforeEach, expect, it, vi } from "vitest";

import { AccessAuthenticationError } from "../../../../../../app/server/auth/access/errors/access-authentication-error";
import { AccessConfigurationError } from "../../../../../../app/server/auth/access/errors/access-configuration-error";
import { getAccessIdentity } from "../../../../../../app/server/auth/access/services/get-access-identity.server";

const accessSettings = {
  ACCESS_TEAM_DOMAIN: "https://seymour-test.cloudflareaccess.com",
  ACCESS_AUD: "a".repeat(64),
};

const verifyToken = vi.fn();

beforeEach(() => {
  verifyToken.mockReset();

  verifyToken.mockResolvedValue({
    email: " Admin@Example.Test ",
  });
});

it("normalizes only a verified deployed email", async () => {
  const request = new Request("https://seymour.test", {
    headers: {
      "Cf-Access-Jwt-Assertion": "verified-token",
    },
  });

  const identity = await getAccessIdentity(
    request,
    {
      APP_ENV: "staging",
      ...accessSettings,
    },
    verifyToken,
  );

  expect(identity).toEqual({
    email: "admin@example.test",
  });

  expect(verifyToken).toHaveBeenCalledOnce();
});

it.each(["staging", "production"])(
  "never uses the local fallback in %s",
  async (APP_ENV) => {
    const request = new Request(
      "https://seymour.test/?email=admin@example.test",
      {
        headers: {
          "Cf-Access-Authenticated-User-Email": "admin@example.test",
          APP_ENV: "local",
          DEV_AUTH_EMAIL: "admin@example.test",
        },
      },
    );

    await expect(
      getAccessIdentity(
        request,
        {
          APP_ENV,
          DEV_AUTH_EMAIL: "developer@example.test",
          ...accessSettings,
        },
        verifyToken,
      ),
    ).rejects.toBeInstanceOf(AccessAuthenticationError);

    expect(verifyToken).not.toHaveBeenCalled();
  },
);

it("uses only the configured local identity", async () => {
  const request = new Request("https://seymour.test", {
    headers: {
      "Cf-Access-Authenticated-User-Email": "attacker@example.test",
    },
  });

  const identity = await getAccessIdentity(
    request,
    {
      APP_ENV: "local",
      DEV_AUTH_EMAIL: " Developer@Example.Test ",
    },
    verifyToken,
  );

  expect(identity).toEqual({
    email: "developer@example.test",
  });

  expect(verifyToken).not.toHaveBeenCalled();
});

it("rejects missing local identity and unknown environments", async () => {
  const invalidSettings = [
    {
      APP_ENV: "local",
    },
    {
      APP_ENV: "local",
      DEV_AUTH_EMAIL: " ",
    },
    {
      APP_ENV: "unknown",
      DEV_AUTH_EMAIL: "developer@example.test",
    },
  ];

  for (const settings of invalidSettings) {
    await expect(
      getAccessIdentity(
        new Request("https://seymour.test"),
        settings,
        verifyToken,
      ),
    ).rejects.toBeInstanceOf(AccessConfigurationError);
  }

  expect(verifyToken).not.toHaveBeenCalled();
});
