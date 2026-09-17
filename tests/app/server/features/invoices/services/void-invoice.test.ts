import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { invoiceItems } from "../../../../../../app/server/db/schema/invoice-items";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { InvoiceNotFoundError } from "../../../../../../app/server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../../../../../../app/server/features/invoices/errors/invoice-state-conflict-error";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let jobId: string;

beforeEach(async () => {
  const db = createDb(env.DB);

  await db.delete(invoiceItems);
  await db.delete(invoices);
  await db.delete(jobItems);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);

  await db.insert(users).values(admin);

  await db.insert(customers).values({
    id: "customer",
    name: "John Smith",
    createdAt: 1,
    updatedAt: 1,
  });

  ({ id: jobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front & Back Lawn Mow",
    description: "Mow lawns",
    scheduledDate: "2026-09-17",
  }));
});

async function getInvoice(invoiceId: string) {
  return createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();
}

it("voids an issued invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await issueInvoice(env.DB, admin, invoiceId);

  const result = await voidInvoice(env.DB, admin, invoiceId);

  expect(result).toEqual({
    id: invoiceId,
    invoiceNumber: "INV-000001",
  });

  expect(await getInvoice(invoiceId)).toMatchObject({
    id: invoiceId,
    invoiceNumber: "INV-000001",
    status: "voided",
  });

  expect((await getInvoice(invoiceId))?.voidedAt).toEqual(expect.any(Number));
});

it("preserves the invoice number when voided", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  const issued = await issueInvoice(env.DB, admin, invoiceId);

  await voidInvoice(env.DB, admin, invoiceId);

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: issued.invoiceNumber,
    status: "voided",
  });
});

it("preserves issuedAt when voided", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await issueInvoice(env.DB, admin, invoiceId);

  const before = await getInvoice(invoiceId);

  await voidInvoice(env.DB, admin, invoiceId);

  const after = await getInvoice(invoiceId);

  expect(after?.issuedAt).toBe(before?.issuedAt);
  expect(after?.issuedAt).not.toBeNull();
});

it("does not change invoice items when voided", async () => {
  await createJobItem(env.DB, admin, jobId, {
    description: "Front lawn",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, jobId, {
    description: "Back lawn",
    amountCents: 3500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await issueInvoice(env.DB, admin, invoiceId);

  const before = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  await voidInvoice(env.DB, admin, invoiceId);

  const after = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(after).toEqual(before);
});

it("rejects voiding a draft invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await expect(voidInvoice(env.DB, admin, invoiceId)).rejects.toBeInstanceOf(
    InvoiceStateConflictError,
  );

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: null,
    status: "draft",
    issuedAt: null,
    voidedAt: null,
  });
});

it("rejects voiding an already voided invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await issueInvoice(env.DB, admin, invoiceId);

  await voidInvoice(env.DB, admin, invoiceId);

  await expect(voidInvoice(env.DB, admin, invoiceId)).rejects.toBeInstanceOf(
    InvoiceStateConflictError,
  );

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: "INV-000001",
    status: "voided",
  });
});

it("rejects a missing invoice", async () => {
  await expect(voidInvoice(env.DB, admin, "missing")).rejects.toBeInstanceOf(
    InvoiceNotFoundError,
  );
});

it("requires invoice management permission", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await issueInvoice(env.DB, admin, invoiceId);

  const before = await getInvoice(invoiceId);

  await expect(
    voidInvoice(
      env.DB,
      {
        ...admin,
        role: "operator",
      },
      invoiceId,
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await getInvoice(invoiceId)).toEqual(before);
});
