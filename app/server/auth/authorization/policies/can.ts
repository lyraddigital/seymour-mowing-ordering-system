import type { CurrentUser } from "../../principal/types/current-user";
import type { Permission } from "../types/permission";
import { rolePermissions } from "./role-permissions";

export function can(
  user: Pick<CurrentUser, "role">,
  permission: Permission,
): boolean {
  if (!Object.hasOwn(rolePermissions, user.role)) {
    return false;
  }

  return rolePermissions[user.role].includes(permission);
}
