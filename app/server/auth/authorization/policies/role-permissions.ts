import type { Permission } from "../types/permission";
import type { UserRole } from "../types/user-role";

export const rolePermissions: Readonly<
  Record<UserRole, readonly Permission[]>
> = {
  admin: [
    "customers.read",
    "customers.manage",
    "jobs.read",
    "jobs.manage",
    "invoices.read",
    "invoices.manage",
    "payments.read",
    "payments.manage",
    "users.manage",
  ],
  operator: [
    "customers.read",
    "customers.manage",
    "jobs.read",
    "jobs.manage",
    "invoices.read",
    "payments.read",
  ],
};
