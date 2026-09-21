import { expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";

import AppShell from "../../../../../app/ui/layouts/app-shell/app-shell";
import { internalUser } from "../../../../support/fixtures/internal-user";

it.each(["/payments", "/invoices", "/customers", "/jobs"])(
  "links Payments and marks only the current navigation item active at %s",
  (path) => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[path]}>
        <AppShell currentUser={internalUser()}>Content</AppShell>
      </MemoryRouter>,
    );
    expect(html).toMatch(/<a[^>]*href="\/payments"[^>]*>Payments<\/a>/);
    const activeLinks = html.match(/<a[^>]*aria-current="page"[^>]*>/g);
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks![0]).toContain(`href="${path}"`);
    expect(html).not.toContain("Coming soon");
    expect(html).toContain("Mowing &amp; Maintenance");
    expect(html).toContain("Logo placeholder");
    expect(html).not.toContain("brand-mark");
    expect(html).not.toContain("Settings");
    expect(html).not.toContain("Log out");
    expect(html).toContain(internalUser().email);
  },
);
