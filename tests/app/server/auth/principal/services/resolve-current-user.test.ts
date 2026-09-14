import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";

import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { users } from "../../../../../../app/server/db/schema/users";
import { UserInactiveError } from "../../../../../../app/server/auth/principal/errors/user-inactive-error";
import { UserNotProvisionedError } from "../../../../../../app/server/auth/principal/errors/user-not-provisioned-error";
import { resolveCurrentUser } from "../../../../../../app/server/auth/principal/services/resolve-current-user.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

beforeEach(async () => {
  await createDb(env.DB).delete(users);
});

it("resolves a normalized email to a minimal active principal", async () => {
  const user = internalUser();
  await createDb(env.DB).insert(users).values(user);
  expect(await resolveCurrentUser(env.DB, "  ADMIN@EXAMPLE.TEST ")).toEqual({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  });
});

it("rejects missing users with a distinct application error", async () => {
  await expect(
    resolveCurrentUser(env.DB, "missing@example.test"),
  ).rejects.toBeInstanceOf(UserNotProvisionedError);
});

it("rejects inactive users with a distinct application error", async () => {
  await createDb(env.DB)
    .insert(users)
    .values({ ...internalUser(), isActive: false });
  await expect(
    resolveCurrentUser(env.DB, "admin@example.test"),
  ).rejects.toBeInstanceOf(UserInactiveError);
});
