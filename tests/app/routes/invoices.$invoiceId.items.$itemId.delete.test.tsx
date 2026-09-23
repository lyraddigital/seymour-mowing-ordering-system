import { env } from "cloudflare:workers";
import { RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";
import { draftInvoiceFixture } from "../../support/fixtures/draft-invoice";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createInvoiceItem } from "../../../app/server/features/invoices/services/create-invoice-item.server";
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import { action } from "../../../app/routes/invoices.$invoiceId.items.$itemId.delete";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
let fixture: Awaited<ReturnType<typeof draftInvoiceFixture>>;
let context: RouterContextProvider;
let itemId: string;
beforeEach(async () => {
  fixture = await draftInvoiceFixture();
  context = new RouterContextProvider();
  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  ({ id: itemId } = await createInvoiceItem(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    { jobId: fixture.jobId, description: "Original", amountCents: 1000 },
  ));
});
function args(
  invoiceId: string = fixture.invoiceId,
  body = new URLSearchParams({
    jobId: fixture.jobId,
    description: "Updated",
    amount: "12.34",
  }),
) {
  return {
    context,
    params: { invoiceId, itemId },
    request: new Request("https://example.test/invoices", {
      method: "POST",
      body,
    }),
    url: new URL("https://example.test/invoices"),
    pattern: "/invoices",
  };
}
it("redirects successful POST to invoice details", async () => {
  const result = await action(args());
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(302);
  expect((result as Response).headers.get("Location")).toBe(
    `/invoices/${fixture.invoiceId}`,
  );
});
it("returns 403 without management permission", async () => {
  context.set(currentUserContext, { ...fixture.admin, role: "operator" });
  await expect(action(args())).rejects.toMatchObject({ status: 403 });
});
it("returns 404 for a missing invoice", async () => {
  await expect(action(args("missing"))).rejects.toMatchObject({ status: 404 });
});
it.each(["issued", "voided"] as const)(
  "returns 409 for %s invoices",
  async (status) => {
    await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
      dueDate: "2026-10-01",
    });
    if (status === "voided")
      await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
    await expect(action(args())).rejects.toMatchObject({ status: 409 });
  },
);
it("returns 404 for another invoice's item", async () => {
  const { id } = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [fixture.otherJobId],
  });
  await expect(action(args(id))).rejects.toMatchObject({ status: 404 });
});
it("returns 404 for a missing item", async () => {
  itemId = "missing";
  await expect(action(args())).rejects.toMatchObject({ status: 404 });
});
