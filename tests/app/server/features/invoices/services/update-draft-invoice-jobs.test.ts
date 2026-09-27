import { completeInvoiceJobs } from "../../../../../support/fixtures/complete-invoice-jobs";
import { updateInvoiceItem } from "../../../../../../app/server/features/invoices/services/update-invoice-item.server";
import { createInvoiceItem } from "../../../../../../app/server/features/invoices/services/create-invoice-item.server";
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
import { InvoiceJobConflictError } from "../../../../../../app/server/features/invoices/errors/invoice-job-conflict-error";
import { InvoiceJobSelectionError } from "../../../../../../app/server/features/invoices/errors/invoice-job-selection-error";
import { InvoiceNotFoundError } from "../../../../../../app/server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../../../../../../app/server/features/invoices/errors/invoice-state-conflict-error";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { updateDraftInvoiceJobs } from "../../../../../../app/server/features/invoices/services/update-draft-invoice-jobs.server";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let firstJobId: string;
let secondJobId: string;
let otherCustomerJobId: string;

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

  await db.insert(customers).values([
    {
      id: "customer",
      name: "John Smith",
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: "other-customer",
      name: "Jane Smith",
      createdAt: 1,
      updatedAt: 1,
    },
  ]);

  ({ id: firstJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-19",
  }));

  ({ id: secondJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow back lawn",
    scheduledDate: "2026-09-20",
  }));

  ({ id: otherCustomerJobId } = await createJob(env.DB, admin, {
    customerId: "other-customer",
    name: "Nature strip",
    description: "Mow nature strip",
    scheduledDate: "2026-09-21",
  }));
});

it("adds a job to a draft invoice", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [firstJobId, secondJobId],
  });

  const assignments = await createDb(env.DB)
    .select()
    .from(invoiceJobs)
    .where(eq(invoiceJobs.invoiceId, invoiceId));

  expect(assignments).toEqual(
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

  expect(assignments).toHaveLength(2);
});

it("removes a job from a draft invoice", async () => {
  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  await completeInvoiceJobs(admin, [secondJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [secondJobId],
  });

  const assignments = await createDb(env.DB)
    .select()
    .from(invoiceJobs)
    .where(eq(invoiceJobs.invoiceId, invoiceId));

  expect(assignments).toEqual([
    expect.objectContaining({
      invoiceId,
      jobId: secondJobId,
      releasedAt: null,
    }),
  ]);
});

it("preserves invoice item snapshots for jobs that remain selected", async () => {
  const { id: firstItemId } = await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await createDb(env.DB)
    .update(jobItems)
    .set({
      amountCents: 5000,
    })
    .where(eq(jobItems.id, firstItemId));

  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [firstJobId, secondJobId],
  });

  const snapshots = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(snapshots).toContainEqual(
    expect.objectContaining({
      invoiceId,
      jobId: firstJobId,
      description: "Front lawn mow",
      amountCents: 4500,
    }),
  );
});

it("snapshots current job items when a job is newly added", async () => {
  await createJobItem(env.DB, admin, secondJobId, {
    description: "Back lawn mow",
    amountCents: 3500,
  });

  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [firstJobId, secondJobId],
  });

  const snapshots = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(snapshots).toContainEqual(
    expect.objectContaining({
      invoiceId,
      jobId: secondJobId,
      description: "Back lawn mow",
      amountCents: 3500,
    }),
  );
});

it("removes snapshots belonging to removed jobs", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, secondJobId, {
    description: "Back lawn mow",
    amountCents: 3500,
  });

  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  await completeInvoiceJobs(admin, [firstJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [firstJobId],
  });

  const snapshots = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(snapshots).toEqual([
    expect.objectContaining({
      invoiceId,
      jobId: firstJobId,
      description: "Front lawn mow",
      amountCents: 4500,
    }),
  ]);
});

it("allows a job removed from a draft to be invoiced elsewhere", async () => {
  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  await completeInvoiceJobs(admin, [firstJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [firstJobId],
  });

  await completeInvoiceJobs(admin, [secondJobId]);
  const result = await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId],
  });

  expect(result.id).toEqual(expect.any(String));
});

it("rejects an empty job selection", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await expect(
    updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
      jobIds: [],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobSelectionError);
});

it("rejects duplicate job ids", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await expect(
    updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
      jobIds: [firstJobId, firstJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobSelectionError);
});

it("rejects a missing job", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await expect(
    updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
      jobIds: [firstJobId, "missing"],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobSelectionError);
});

it("rejects a job belonging to another customer", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await expect(
    updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
      jobIds: [firstJobId, otherCustomerJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobSelectionError);
});

it("rejects a job assigned to another active invoice", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await completeInvoiceJobs(admin, [secondJobId]);
  await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId],
  });

  await expect(
    updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
      jobIds: [firstJobId, secondJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobConflictError);

  const assignments = await createDb(env.DB)
    .select()
    .from(invoiceJobs)
    .where(eq(invoiceJobs.invoiceId, invoiceId));

  expect(assignments).toEqual([
    expect.objectContaining({
      invoiceId,
      jobId: firstJobId,
    }),
  ]);
});

it("rejects an issued invoice", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await expect(
    updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
      jobIds: [firstJobId, secondJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);
});

it("rejects a voided invoice", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await voidInvoice(env.DB, admin, invoiceId);

  await expect(
    updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
      jobIds: [firstJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);
});

it("rejects a missing invoice", async () => {
  await expect(
    updateDraftInvoiceJobs(env.DB, admin, "missing", {
      jobIds: [firstJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceNotFoundError);
});

it("requires invoice management permission", async () => {
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await expect(
    updateDraftInvoiceJobs(
      env.DB,
      {
        ...admin,
        role: "operator",
      },
      invoiceId,
      {
        jobIds: [firstJobId],
      },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});

it("preserves manual and edited items for retained jobs, then removes them with their job", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Original",
    amountCents: 1000,
  });
  await completeInvoiceJobs(admin, [firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });
  const db = createDb(env.DB);
  const snapshot = (await db.select().from(invoiceItems))[0];
  await updateInvoiceItem(env.DB, admin, invoiceId, snapshot.id, {
    description: "Edited snapshot",
    amountCents: 1200,
  });
  await createInvoiceItem(env.DB, admin, invoiceId, {
    jobId: firstJobId,
    description: "Manual",
    amountCents: 500,
  });
  const before = await db.select().from(invoiceItems);
  await completeInvoiceJobs(admin, [firstJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [firstJobId],
  });
  expect(await db.select().from(invoiceItems)).toEqual(before);
  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [firstJobId, secondJobId],
  });
  expect(await db.select().from(invoiceItems)).toEqual(before);
  await completeInvoiceJobs(admin, [secondJobId]);
  await updateDraftInvoiceJobs(env.DB, admin, invoiceId, {
    jobIds: [secondJobId],
  });
  expect(await db.select().from(invoiceItems)).toEqual([]);
});
