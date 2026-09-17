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

it("issues a draft invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  const result = await issueInvoice(env.DB, admin, invoiceId);

  expect(result).toEqual({
    id: invoiceId,
    invoiceNumber: "INV-000001",
  });

  const invoice = await getInvoice(invoiceId);

  expect(invoice).toMatchObject({
    id: invoiceId,
    invoiceNumber: "INV-000001",
    status: "issued",
    voidedAt: null,
  });

  expect(invoice?.issuedAt).toEqual(expect.any(Number));
  expect(invoice?.updatedAt).toEqual(expect.any(Number));
});

it("allocates sequential invoice numbers", async () => {
  const { id: firstInvoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  const { id: secondInvoiceId } = await createDraftInvoice(
    env.DB,
    admin,
    jobId,
  );

  expect(await issueInvoice(env.DB, admin, firstInvoiceId)).toEqual({
    id: firstInvoiceId,
    invoiceNumber: "INV-000001",
  });

  expect(await issueInvoice(env.DB, admin, secondInvoiceId)).toEqual({
    id: secondInvoiceId,
    invoiceNumber: "INV-000002",
  });
});

it("continues numbering after an existing issued invoice", async () => {
  const { id: firstInvoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await issueInvoice(env.DB, admin, firstInvoiceId);

  const { id: secondInvoiceId } = await createDraftInvoice(
    env.DB,
    admin,
    jobId,
  );

  const result = await issueInvoice(env.DB, admin, secondInvoiceId);

  expect(result.invoiceNumber).toBe("INV-000002");
});

it("does not assign an invoice number until issue", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: null,
    status: "draft",
    issuedAt: null,
  });

  await issueInvoice(env.DB, admin, invoiceId);

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: "INV-000001",
    status: "issued",
  });
});

it("does not change invoice items when issuing", async () => {
  await createJobItem(env.DB, admin, jobId, {
    description: "Front lawn",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, jobId, {
    description: "Back lawn",
    amountCents: 3500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  const before = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  await issueInvoice(env.DB, admin, invoiceId);

  const after = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(after).toEqual(before);
});

it("rejects issuing an already issued invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await issueInvoice(env.DB, admin, invoiceId);

  await expect(issueInvoice(env.DB, admin, invoiceId)).rejects.toBeInstanceOf(
    InvoiceStateConflictError,
  );

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: "INV-000001",
    status: "issued",
  });
});

it("does not allocate another number when issue is retried", async () => {
  const { id: firstInvoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await issueInvoice(env.DB, admin, firstInvoiceId);

  await expect(
    issueInvoice(env.DB, admin, firstInvoiceId),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);

  const { id: secondInvoiceId } = await createDraftInvoice(
    env.DB,
    admin,
    jobId,
  );

  expect(await issueInvoice(env.DB, admin, secondInvoiceId)).toEqual({
    id: secondInvoiceId,
    invoiceNumber: "INV-000002",
  });
});

it("rejects a voided invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  const issued = await issueInvoice(env.DB, admin, invoiceId);

  await createDb(env.DB)
    .update(invoices)
    .set({
      status: "voided",
      voidedAt: Date.now(),
      updatedAt: Date.now(),
    })
    .where(eq(invoices.id, issued.id));

  await expect(issueInvoice(env.DB, admin, invoiceId)).rejects.toBeInstanceOf(
    InvoiceStateConflictError,
  );

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: "INV-000001",
    status: "voided",
  });
});

it("rejects a missing invoice", async () => {
  await expect(issueInvoice(env.DB, admin, "missing")).rejects.toBeInstanceOf(
    InvoiceNotFoundError,
  );
});

it("requires invoice management permission", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await expect(
    issueInvoice(
      env.DB,
      {
        ...admin,
        role: "operator",
      },
      invoiceId,
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: null,
    status: "draft",
    issuedAt: null,
  });
});
