import type { CurrentUser } from "../../../../../../app/server/auth/principal/types/current-user";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";
import { draftInvoiceFixture } from "../../../../../support/fixtures/draft-invoice";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { invoiceItems } from "../../../../../../app/server/db/schema/invoice-items";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { InvoiceNotFoundError } from "../../../../../../app/server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../../../../../../app/server/features/invoices/errors/invoice-state-conflict-error";
import { createInvoiceItem } from "../../../../../../app/server/features/invoices/services/create-invoice-item.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { invoiceJobs } from "../../../../../../app/server/db/schema/invoice-jobs";
import { InvoiceJobSelectionError } from "../../../../../../app/server/features/invoices/errors/invoice-job-selection-error";
import { InvoiceItemValidationError } from "../../../../../../app/server/features/invoices/errors/invoice-item-validation-error";
let fixture: Awaited<ReturnType<typeof draftInvoiceFixture>>;
let itemId: string;
beforeEach(async () => {
  fixture = await draftInvoiceFixture();
  ({ id: itemId } = await createInvoiceItem(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    { jobId: fixture.jobId, description: "Original", amountCents: 1000 },
  ));
  await createDb(env.DB)
    .update(invoices)
    .set({ updatedAt: 1 })
    .where(eq(invoices.id, fixture.invoiceId));
});
function mutate(
  user: CurrentUser = fixture.admin,
  invoiceId: string = fixture.invoiceId,
) {
  return createInvoiceItem(env.DB, user, invoiceId, {
    jobId: fixture.jobId,
    description: " Changed ",
    amountCents: 1234,
  });
}
it("updates the parent timestamp after a successful mutation", async () => {
  await mutate();
  const row = await createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, fixture.invoiceId))
    .get();
  expect(row!.updatedAt).toBeGreaterThan(1);
});
it.each(["issued", "voided"] as const)(
  "rejects %s invoices without changing data",
  async (status) => {
    await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
      dueDate: "2026-10-01",
    });
    if (status === "voided")
      await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
    const db = createDb(env.DB);
    const before = await db.select().from(invoiceItems);
    const parent = await db.select().from(invoices);
    await expect(mutate()).rejects.toBeInstanceOf(InvoiceStateConflictError);
    expect(await db.select().from(invoiceItems)).toEqual(before);
    expect(await db.select().from(invoices)).toEqual(parent);
  },
);
it("requires management permission", async () => {
  await expect(
    mutate({ ...fixture.admin, role: "operator" }),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
it("rejects a missing invoice", async () => {
  await expect(mutate(fixture.admin, "missing")).rejects.toBeInstanceOf(
    InvoiceNotFoundError,
  );
});
it("rolls back the item write if updating the parent fails", async () => {
  const before = await createDb(env.DB).select().from(invoiceItems);
  await env.DB.exec(
    "CREATE TRIGGER fail_invoice_timestamp BEFORE UPDATE OF updated_at ON invoices BEGIN SELECT RAISE(ABORT, 'timestamp failure'); END",
  );
  try {
    await expect(mutate()).rejects.toThrow();
    expect(await createDb(env.DB).select().from(invoiceItems)).toEqual(before);
  } finally {
    await env.DB.exec("DROP TRIGGER fail_invoice_timestamp");
  }
});
it("adds a trimmed item with the correct invoice, job and integer cents", async () => {
  const result = await mutate();
  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.id, result.id))
      .get(),
  ).toMatchObject({
    invoiceId: fixture.invoiceId,
    jobId: fixture.jobId,
    description: "Changed",
    amountCents: 1234,
  });
  expect(result.id).not.toBe(itemId);
});
it.each(["missing", "unselected", "released"])(
  "rejects a %s job association without changing timestamp",
  async (kind) => {
    if (kind === "released")
      await createDb(env.DB)
        .update(invoiceJobs)
        .set({ releasedAt: 1 })
        .where(eq(invoiceJobs.invoiceId, fixture.invoiceId));
    const jobId =
      kind === "missing"
        ? "missing"
        : kind === "unselected"
          ? fixture.otherJobId
          : fixture.jobId;
    await expect(
      createInvoiceItem(env.DB, fixture.admin, fixture.invoiceId, {
        jobId,
        description: "Item",
        amountCents: 0,
      }),
    ).rejects.toBeInstanceOf(InvoiceJobSelectionError);
    expect(
      (await createDb(env.DB).select().from(invoices).get())!.updatedAt,
    ).toBe(1);
  },
);
function withInput(input: { description: string; amountCents: number }) {
  return createInvoiceItem(env.DB, fixture.admin, fixture.invoiceId, {
    jobId: fixture.jobId,
    ...input,
  });
}
it("accepts zero", async () => {
  const result = await withInput({ description: "Free", amountCents: 0 });
  expect(
    (await createDb(env.DB)
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.id, result.id))
      .get())!.amountCents,
  ).toBe(0);
});
it.each([
  -1,
  1.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.MAX_SAFE_INTEGER + 1,
])("rejects invalid cents %s", async (amountCents) => {
  await expect(
    withInput({ description: "Item", amountCents }),
  ).rejects.toBeInstanceOf(InvoiceItemValidationError);
});
it.each(["", "   ", "a".repeat(501)])(
  "rejects invalid description",
  async (description) => {
    await expect(
      withInput({ description, amountCents: 1 }),
    ).rejects.toBeInstanceOf(InvoiceItemValidationError);
  },
);
