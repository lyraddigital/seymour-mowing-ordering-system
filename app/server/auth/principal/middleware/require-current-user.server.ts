import { data, type MiddlewareFunction } from "react-router";

import { accessIdentityContext } from "../../context/access-identity-context";
import { currentUserContext } from "../../context/current-user-context";
import { runtimeContext } from "../../context/runtime-context";
import { UserInactiveError } from "../errors/user-inactive-error";
import { UserNotProvisionedError } from "../errors/user-not-provisioned-error";
import { resolveCurrentUser } from "../services/resolve-current-user.server";

export const requireCurrentUser: MiddlewareFunction<Response> = async (
  { context },
  next,
) => {
  const { env } = context.get(runtimeContext);
  const identity = context.get(accessIdentityContext);

  try {
    const user = await resolveCurrentUser(env.DB, identity.email);
    context.set(currentUserContext, user);
  } catch (error) {
    if (error instanceof UserNotProvisionedError) {
      throw data({ code: "USER_NOT_PROVISIONED" }, { status: 403 });
    }

    if (error instanceof UserInactiveError) {
      throw data({ code: "USER_INACTIVE" }, { status: 403 });
    }

    throw error;
  }

  return next();
};
