import { expect, it } from "vitest";

import { getRouteErrorPresentation } from "../../../app/ui/errors/get-route-error-presentation";

const routeError = (status: number, code?: string) => ({
  status,
  statusText: "",
  internal: false,
  data: { code },
});

it("distinguishes provisioning, inactive and permission-denied 403 errors", () => {
  expect(
    getRouteErrorPresentation(routeError(403, "USER_NOT_PROVISIONED")).title,
  ).toBe("Account not configured");
  expect(
    getRouteErrorPresentation(routeError(403, "USER_INACTIVE")).title,
  ).toBe("Account unavailable");
  expect(
    getRouteErrorPresentation(routeError(403, "PERMISSION_DENIED")).title,
  ).toBe("Permission denied");
  expect(getRouteErrorPresentation(routeError(403)).title).toBe(
    "Permission denied",
  );
});

it("keeps validation, not found and infrastructure errors distinct without exposing details", () => {
  expect(getRouteErrorPresentation(routeError(422)).title).toBe(
    "Check your request",
  );
  expect(getRouteErrorPresentation(routeError(404)).title).toBe(
    "Page not found",
  );
  expect(
    getRouteErrorPresentation(new Error("internal private DB record")),
  ).toEqual(getRouteErrorPresentation(routeError(500)));
  expect(
    getRouteErrorPresentation(new Error("internal private DB record")).message,
  ).not.toContain("private");
});
