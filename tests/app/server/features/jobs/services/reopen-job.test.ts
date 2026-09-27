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
import { payments } from "../../../../../../app/server/db/schema/payments";
import { users } from "../../../../../../app/server/db/schema/users";
import { JobNotFoundError } from "../../../../../../app/server/features/jobs/errors/job-not-found-error";
import { JobStateConflictError } from "../../../../../../app/server/features/jobs/errors/job-state-conflict-error";
import { getJobById } from "../../../../../../app/server/features/jobs/queries/get-job-by-id.server";
import { reopenJob } from "../../../../../../app/server/features/jobs/services/reopen-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();
const jobId = "job";

beforeEach(async () => {
  const db = createDb(env.DB);

  await db.delete(payments);
  await db.delete(invoiceItems);
  await db.delete(invoiceJobs);
  await db.delete(invoices);
  await db.delete(jobItems);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);

  await db.insert(users).values(user);

  await db.insert(customers).values({
    id: "customer",
    name: "Customer",
    createdAt: 1,
    updatedAt: 1,
  });

  await db.insert(jobs).values({
    id: jobId,
    customerId: "customer",
    name: "Lawn service",
    description: "Mow lawn",
    scheduledDate: "2026-09-17",
    servicePriceCents: 10_000,
    createdAt: 1,
    updatedAt: 1,
  });

  await db.insert(jobStatusHistory).values([
    {
      id: "scheduled",
      jobId,
      status: "scheduled",
      createdByUserId: user.id,
      createdAt: 1,
    },
    {
      id: "completed",
      jobId,
      status: "completed",
      createdByUserId: user.id,
      createdAt: 2,
    },
  ]);
});

it.each(["admin", "operator"] as const)(
  "allows an authorized %s to reopen a completed job",
  async (role) => {
    expect(await reopenJob(env.DB, { ...user, role }, jobId)).toEqual({
      id: jobId,
    });

    expect(await getJobById(env.DB, user, jobId)).toMatchObject({
      currentStatus: "in_progress",
      servicePriceCents: 10_000,
    });
  },
);

it("appends history without changing the job record", async () => {
  const db = createDb(env.DB);

  const beforeJob = await db.select().from(jobs).get();
  const beforeHistory = await db.select().from(jobStatusHistory);

  await reopenJob(env.DB, user, jobId);

  expect(await db.select().from(jobs).get()).toEqual(beforeJob);

  const afterHistory = await db.select().from(jobStatusHistory);

  expect(afterHistory).toHaveLength(beforeHistory.length + 1);
  expect(afterHistory).toEqual(expect.arrayContaining(beforeHistory));

  expect(afterHistory).toContainEqual(
    expect.objectContaining({
      jobId,
      status: "in_progress",
      createdByUserId: user.id,
    }),
  );
});

it("rejects reopening while the job is allocated to an active invoice", async () => {
  const db = createDb(env.DB);

  await db.insert(invoices).values({
    id: "invoice",
    customerId: "customer",
    invoiceNumber: null,
    status: "draft",
    issuedAt: null,
    dueDate: null,
    voidedAt: null,
    createdAt: 3,
    updatedAt: 3,
  });

  await db.insert(invoiceJobs).values({
    invoiceId: "invoice",
    jobId,
    releasedAt: null,
  });

  const before = await db.select().from(jobStatusHistory);

  await expect(reopenJob(env.DB, user, jobId)).rejects.toThrow(
    "A job assigned to an active invoice cannot be reopened.",
  );

  expect(await db.select().from(jobStatusHistory)).toEqual(before);

  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "completed",
  });
});

it("allows reopening after an invoice allocation has been released", async () => {
  const db = createDb(env.DB);

  await db.insert(invoices).values({
    id: "invoice",
    customerId: "customer",
    invoiceNumber: "INV-0001",
    status: "voided",
    issuedAt: 3,
    dueDate: "2026-10-01",
    voidedAt: 4,
    createdAt: 3,
    updatedAt: 4,
  });

  await db.insert(invoiceJobs).values({
    invoiceId: "invoice",
    jobId,
    releasedAt: 4,
  });

  await reopenJob(env.DB, user, jobId);

  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "in_progress",
  });
});

it.each(["scheduled", "in_progress", "cancelled"] as const)(
  "rejects reopening when the current status is %s",
  async (status) => {
    const db = createDb(env.DB);

    await db.insert(jobStatusHistory).values({
      id: `later-${status}`,
      jobId,
      status,
      createdByUserId: user.id,
      createdAt: 3,
    });

    await expect(reopenJob(env.DB, user, jobId)).rejects.toBeInstanceOf(
      JobStateConflictError,
    );

    expect(await getJobById(env.DB, user, jobId)).toMatchObject({
      currentStatus: status,
    });
  },
);

it("rejects a nonexistent job", async () => {
  await expect(reopenJob(env.DB, user, "missing")).rejects.toBeInstanceOf(
    JobNotFoundError,
  );
});

it("requires manage permission", async () => {
  await expect(
    reopenJob(env.DB, { ...user, role: "unknown" as "admin" }, jobId),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "completed",
  });
});

it("allows only one competing reopen request to succeed", async () => {
  const outcomes = await Promise.allSettled([
    reopenJob(env.DB, user, jobId),
    reopenJob(env.DB, user, jobId),
  ]);

  expect(
    outcomes.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);

  const rejected = outcomes.find((result) => result.status === "rejected");

  expect(rejected).toMatchObject({
    status: "rejected",
    reason: expect.any(JobStateConflictError),
  });

  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "in_progress",
  });
});

it("orders the reopened history after an existing future timestamp", async () => {
  const db = createDb(env.DB);
  const future = Date.now() + 10_000;

  await db
    .update(jobStatusHistory)
    .set({
      createdAt: future,
    })
    .where(eq(jobStatusHistory.id, "completed"));

  await reopenJob(env.DB, user, jobId);

  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "in_progress",
  });

  const reopened = await db
    .select()
    .from(jobStatusHistory)
    .where(eq(jobStatusHistory.status, "in_progress"))
    .get();

  expect(reopened).toMatchObject({
    createdAt: future + 1,
  });
});
