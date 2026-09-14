import { createRequestHandler, RouterContextProvider } from "react-router";

import { getAccessIdentity } from "../app/server/auth/access/services/get-access-identity.server";
import { accessIdentityContext } from "../app/server/auth/context/access-identity-context";
import { runtimeContext } from "../app/server/auth/context/runtime-context";
import { requestErrorResponse } from "./request-error-response.server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    let response: Response;

    try {
      const identity = await getAccessIdentity(request, env);
      const context = new RouterContextProvider();

      context.set(runtimeContext, { env, ctx });
      context.set(accessIdentityContext, identity);

      response = await requestHandler(request, context);
    } catch (error) {
      response = requestErrorResponse(error);
    }

    response.headers.set("Cache-Control", "private, no-store");

    return response;
  },
} satisfies ExportedHandler<Env>;
