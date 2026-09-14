import { expect, it } from "vitest";

import { normalizeAccountEmail } from "../../../../../app/server/auth/normalizers/normalize-account-email";

it("trims surrounding whitespace and lowercases account identifiers", () => {
  expect(normalizeAccountEmail(" \t ADMIN@EXAMPLE.TEST\n")).toBe(
    "admin@example.test",
  );
});
