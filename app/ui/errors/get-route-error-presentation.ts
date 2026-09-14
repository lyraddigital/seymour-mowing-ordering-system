import { isRouteErrorResponse } from "react-router";

export function getRouteErrorPresentation(error: unknown) {
  if (!isRouteErrorResponse(error)) {
    return {
      title: "Something went wrong",
      message:
        "Seymour could not complete this request. Please try again later.",
    };
  }

  const code =
    typeof error.data === "object" && error.data !== null
      ? error.data.code
      : undefined;

  if (error.status === 403 && code === "USER_NOT_PROVISIONED") {
    return {
      title: "Account not configured",
      message:
        "Your Google account is authenticated, but it is not configured for Seymour. Contact the Seymour administrator if you believe this is an error.",
    };
  }

  if (error.status === 403 && code === "USER_INACTIVE") {
    return {
      title: "Account unavailable",
      message:
        "Your Seymour access is currently unavailable. Contact the Seymour administrator if you believe this is an error.",
    };
  }

  if (error.status === 403) {
    return {
      title: "Permission denied",
      message: "You do not have permission to perform this action.",
    };
  }

  if (error.status === 400 || error.status === 422) {
    return {
      title: "Check your request",
      message:
        "Some information could not be accepted. Check your input and try again.",
    };
  }

  if (error.status === 404) {
    return {
      title: "Page not found",
      message: "The requested page could not be found.",
    };
  }

  return {
    title: "Something went wrong",
    message: "Seymour could not complete this request. Please try again later.",
  };
}
