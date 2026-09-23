import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { invoiceItems } from "../../../../../../app/server/db/schema/invoice-items";
import { invoiceJobs } from "../../../../../../app/server/db/schema/invoice-jobs";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { InvoiceNotFoundError } from "../../../../../../app/server/features/invoices/errors/invoice-not-found-error";
import { IssueInvoiceValidationError } from "../../../../../../app/server/features/invoices/errors/issue-invoice-validation-error";
import { InvoiceStateConflictError } from "../../../../../../app/server/features/invoices/errors/invoice-state-conflict-error";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let firstJobId: string;
let secondJobId: string;

beforeEach(async () => {
  const db = createDb(env.DB);

  await db.delete(invoiceItems);
  await db.delete(invoiceJobs);
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

  ({ id: firstJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-17",
  }));

  ({ id: secondJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow back lawn",
    scheduledDate: "2026-09-18",
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
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  expect(result).toEqual({
    id: invoiceId,
    invoiceNumber: "INV-000001",
  });

  expect(await getInvoice(invoiceId)).toMatchObject({
    id: invoiceId,
    invoiceNumber: "INV-000001",
    status: "issued",
    issuedAt: expect.any(Number),
    dueDate: "2026-10-01",
    voidedAt: null,
  });
});

it("issues an invoice containing multiple jobs", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceJobs)
      .where(eq(invoiceJobs.invoiceId, invoiceId)),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        invoiceId,
        jobId: firstJobId,
        releasedAt: null,
      }),
      expect.objectContaining({
        invoiceId,
        jobId: secondJobId,
        releasedAt: null,
      }),
    ]),
  );
});

it("allocates sequential invoice numbers", async () => {
  const first = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const second = await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId],
  });

  expect(
    await issueInvoice(env.DB, admin, first.id, {
      dueDate: "2026-10-01",
    }),
  ).toEqual({
    id: first.id,
    invoiceNumber: "INV-000001",
  });

  expect(
    await issueInvoice(env.DB, admin, second.id, {
      dueDate: "2026-10-01",
    }),
  ).toEqual({
    id: second.id,
    invoiceNumber: "INV-000002",
  });
});

it("does not assign an invoice number until issue", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: null,
    status: "draft",
    issuedAt: null,
    dueDate: null,
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: "INV-000001",
    status: "issued",
    dueDate: "2026-10-01",
  });
});

it("stores the supplied due date when issuing", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-15",
  });

  expect(await getInvoice(invoiceId)).toMatchObject({
    status: "issued",
    dueDate: "2026-10-15",
  });
});

it.each(["", "not-a-date", "2026-02-30", "23/09/2026", "0000-01-01"])(
  "rejects invalid due date %s",
  async (dueDate) => {
    const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
      jobIds: [firstJobId],
    });

    await expect(
      issueInvoice(env.DB, admin, invoiceId, {
        dueDate,
      }),
    ).rejects.toBeInstanceOf(IssueInvoiceValidationError);

    expect(await getInvoice(invoiceId)).toMatchObject({
      status: "draft",
      invoiceNumber: null,
      issuedAt: null,
      dueDate: null,
    });
  },
);

it("does not change invoice items when issuing", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, secondJobId, {
    description: "Back lawn",
    amountCents: 3500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const before = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  const after = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(after).toEqual(before);
});

it("does not release jobs when issuing", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  const assignments = await createDb(env.DB)
    .select()
    .from(invoiceJobs)
    .where(eq(invoiceJobs.invoiceId, invoiceId));

  expect(assignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        jobId: firstJobId,
        releasedAt: null,
      }),
      expect.objectContaining({
        jobId: secondJobId,
        releasedAt: null,
      }),
    ]),
  );
});

it("rejects issuing an already issued invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await expect(
    issueInvoice(env.DB, admin, invoiceId, {
      dueDate: "2026-10-01",
    }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: "INV-000001",
    status: "issued",
    dueDate: "2026-10-01",
  });
});

it("does not allocate another number when issue is retried", async () => {
  const first = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, first.id, {
    dueDate: "2026-10-01",
  });

  await expect(
    issueInvoice(env.DB, admin, first.id, {
      dueDate: "2026-10-01",
    }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);

  const second = await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId],
  });

  expect(
    await issueInvoice(env.DB, admin, second.id, {
      dueDate: "2026-10-01",
    }),
  ).toEqual({
    id: second.id,
    invoiceNumber: "INV-000002",
  });
});

it("rejects a voided invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await createDb(env.DB)
    .update(invoices)
    .set({
      status: "voided",
      voidedAt: Date.now(),
      updatedAt: Date.now(),
    })
    .where(eq(invoices.id, invoiceId));

  await expect(
    issueInvoice(env.DB, admin, invoiceId, {
      dueDate: "2026-10-01",
    }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);
});

it("rejects a missing invoice", async () => {
  await expect(
    issueInvoice(env.DB, admin, "missing", {
      dueDate: "2026-10-01",
    }),
  ).rejects.toBeInstanceOf(InvoiceNotFoundError);
});

it("requires invoice management permission", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await expect(
    issueInvoice(
      env.DB,
      {
        ...admin,
        role: "operator",
      },
      invoiceId,
      {
        dueDate: "2026-10-01",
      },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await getInvoice(invoiceId)).toMatchObject({
    invoiceNumber: null,
    status: "draft",
    issuedAt: null,
    dueDate: null,
  });

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceJobs)
      .where(eq(invoiceJobs.invoiceId, invoiceId)),
  ).toEqual([
    expect.objectContaining({
      jobId: firstJobId,
      releasedAt: null,
    }),
  ]);
});
