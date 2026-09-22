import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { MemoryRouter, RouterContextProvider } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "../../../app/routes/dashboard";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { recordPayment } from "../../../app/server/features/payments/services/record-payment.server";
import { voidPayment } from "../../../app/server/features/payments/services/void-payment.server";
import DashboardPage from "../../../app/ui/features/dashboard/pages/dashboard-page/dashboard-page";
import AppShell from "../../../app/ui/layouts/app-shell/app-shell";
import { issuedInvoiceFixture } from "../../support/fixtures/issued-invoice";
import { draftInvoiceFixture } from "../../support/fixtures/draft-invoice";
let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
let context: RouterContextProvider;
const args = () => ({
  context,
  request: new Request("https://example.test/dashboard"),
  url: new URL("https://example.test/dashboard"),
  params: {},
  pattern: "/dashboard",
});
beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
  context = new RouterContextProvider();
  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
});
async function render() {
  const { dashboard } = await loader(args());
  // Fixed empty jobs for this presentation assertion; query date semantics are tested separately.
  dashboard.todaysJobs = {
    scheduled: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    remaining: 0,
    total: 0,
  };
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <AppShell currentUser={fixture.admin}>
        <DashboardPage dashboard={dashboard} />
      </AppShell>
    </MemoryRouter>,
  );
}
it.each(["admin", "operator"] as const)(
  "loads the approved metrics and populated sections for %s",
  async (role) => {
    context.set(currentUserContext, { ...fixture.admin, role });
    const payment = await recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents: 1200 },
    );
    const html = await render();
    const labels = [
      "Outstanding balance",
      "Overdue balance",
      "Invoices overdue",
      "Payments received this month",
    ];
    labels.forEach((label, index) => {
      expect(html).toContain(label);
      if (index)
        expect(html.indexOf(label)).toBeGreaterThan(
          html.indexOf(labels[index - 1]),
        );
    });
    expect(html).toContain("Needs attention");
    expect(html).toContain("Invoices that need your focus.");
    expect(html).toContain("$88.00");
    expect(html).toContain("Partially paid");
    expect(html).toContain("$12.00");
    expect(html).toContain(`href="/invoices/${fixture.invoiceId}"`);
    expect(html).toContain("Overdue information unavailable");
    expect(html).not.toContain("All caught up!");
    expect(html).toContain('src="/seymour-logo-800.png"');
    for (const absent of [
      "Customers overdue",
      "Settings",
      "Log out",
      "LOGO PLACEHOLDER",
      "<select",
      "<canvas",
    ])
      expect(html).not.toContain(absent);
    const main = html.slice(html.indexOf("<main"));
    expect(main).not.toContain(fixture.admin.email);
    expect(main).not.toContain("account-avatar");
    await voidPayment(env.DB, fixture.admin, fixture.invoiceId, payment.id);
    expect(await render()).toContain("Voided");
  },
);
it("keeps empty panels and renders no payment rows or false overdue zeros", async () => {
  fixture = await draftInvoiceFixture();
  const html = await render();
  for (const text of [
    "No unpaid invoices",
    "All invoices are paid in full. Great work!",
    "No recent payments",
    "Payments you receive will appear here.",
    "No jobs scheduled today",
    "Enjoy the day! New jobs will appear here when they&#x27;re scheduled.",
    "Invoice due dates required",
    "Overdue information unavailable",
  ])
    expect(html).toContain(text);
  expect(html).not.toContain("<tbody");
  expect(html).not.toContain("0 overdue");
  expect(html).not.toContain("All caught up!");
});
it("maps denied reads to 403", async () => {
  context.set(currentUserContext, {
    ...fixture.admin,
    role: "unknown" as "admin",
  });
  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
});
it("requires authenticated context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await expect(loader(args())).rejects.toThrow();
});
