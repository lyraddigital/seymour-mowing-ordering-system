import { AccessAuthenticationError } from "../app/server/auth/access/errors/access-authentication-error";
import { AccessConfigurationError } from "../app/server/auth/access/errors/access-configuration-error";
import { AccessUnavailableError } from "../app/server/auth/access/errors/access-unavailable-error";

export function requestErrorResponse(error: unknown): Response {
  if (error instanceof AccessConfigurationError) {
    return Response.json(
      {
        code: "ACCESS_CONFIG_INVALID",
        message:
          "Seymour authentication is not configured. Contact the administrator.",
      },
      { status: 503 },
    );
  }

  if (error instanceof AccessAuthenticationError) {
    return Response.json(
      {
        code: "ACCESS_AUTHENTICATION_REQUIRED",
        message: "Cloudflare Access authentication is required.",
      },
      { status: 401 },
    );
  }

  if (error instanceof AccessUnavailableError) {
    return Response.json(
      {
        code: "ACCESS_UNAVAILABLE",
        message:
          "Authentication is temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    );
  }

  return Response.json(
    {
      code: "INFRASTRUCTURE_FAILURE",
      message:
        "Seymour could not complete this request. Please try again later.",
    },
    { status: 500 },
  );
}
