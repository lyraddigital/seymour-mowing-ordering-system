import { RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";

import { loader } from "../../../app/routes/jobs.history";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();
let context: RouterContextProvider;

function args() {
  return {
    context,
    request: new Request("https://example.test/jobs/history"),
    url: new URL("https://example.test/jobs/history"),
    params: {},
    pattern: "/jobs/history",
  };
}

beforeEach(() => {
  context = new RouterContextProvider();
  context.set(currentUserContext, user);
});

it("redirects the old History route to the Completed Jobs view", () => {
  const response = loader(args());

  expect(response).toMatchObject({ status: 302 });
  expect(response.headers.get("Location")).toBe("/jobs?status=completed");
});

it("preserves Jobs read authorization", () => {
  context.set(currentUserContext, {
    ...user,
    role: "unknown" as "admin",
  });

  expect(() => loader(args())).toThrow(
    expect.objectContaining({ status: 403 }),
  );
});

it("requires the authenticated user context", () => {
  context = new RouterContextProvider();

  expect(() => loader(args())).toThrow();
});
