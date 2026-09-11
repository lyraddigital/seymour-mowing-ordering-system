import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Login from "../app/routes/login";
import { loader } from "../app/routes/index";

describe("login entry point", () => {
  it("redirects the application root to login", () => {
    const response = loader();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login");
  });

  it("renders the branded shell on the server without collecting credentials", () => {
    const html = renderToStaticMarkup(<Login />);
    expect(html).toContain("Seymour");
    expect(html).toContain('id="login-heading">Log in</h1>');
    expect(html).not.toMatch(/<(form|input|button)\b/);
  });
});
