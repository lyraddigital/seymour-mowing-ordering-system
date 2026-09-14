import { normalizeAccountEmail } from "../../normalizers/normalize-account-email";
import type { CurrentUser } from "../types/current-user";
import { UserInactiveError } from "../errors/user-inactive-error";
import { UserNotProvisionedError } from "../errors/user-not-provisioned-error";
import { findUserByEmail } from "../queries/find-user-by-email.server";

export async function resolveCurrentUser(
  binding: Env["DB"],
  email: string,
): Promise<CurrentUser> {
  const normalizedEmail = normalizeAccountEmail(email);
  const user = await findUserByEmail(binding, normalizedEmail);

  if (!user) {
    throw new UserNotProvisionedError();
  }

  if (!user.isActive) {
    throw new UserInactiveError();
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
