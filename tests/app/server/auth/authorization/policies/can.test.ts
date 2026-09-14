import { expect, it } from "vitest";

import { can } from "../../../../../../app/server/auth/authorization/policies/can";
import type { Permission } from "../../../../../../app/server/auth/authorization/types/permission";
import type { UserRole } from "../../../../../../app/server/auth/authorization/types/user-role";

const allPermissions = {
  "customers.read": true,
  "customers.manage": true,
  "jobs.read": true,
  "jobs.manage": true,
  "invoices.read": true,
  "invoices.manage": true,
  "payments.read": true,
  "payments.manage": true,
  "users.manage": true,
} satisfies Record<Permission, true>;

it("gives admins every defined permission", () => {
  for (const permission of Object.keys(allPermissions) as Permission[]) {
    expect(can({ role: "admin" }, permission)).toBe(true);
  }
});

it("gives operators exactly the intended grants", () => {
  const allowed = [
    "customers.read",
    "customers.manage",
    "jobs.read",
    "jobs.manage",
    "invoices.read",
    "payments.read",
  ];
  for (const permission of Object.keys(allPermissions) as Permission[]) {
    expect(can({ role: "operator" }, permission)).toBe(
      allowed.includes(permission),
    );
  }
});

it("denies unknown permission and role values at runtime", () => {
  expect(can({ role: "admin" }, "unknown" as Permission)).toBe(false);
  expect(can({ role: "__proto__" as UserRole }, "users.manage")).toBe(false);
});
