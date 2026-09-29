import { env } from "cloudflare:workers";
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
import type { JobStatus } from "../../../../../../app/server/features/jobs/job-status";
import { listJobsByStatus } from "../../../../../../app/server/features/jobs/queries/list-jobs-by-status.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();
const completionTime = Date.UTC(2026, 8, 18, 1);

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
});

async function insertJob(id: string, status: JobStatus, changedAt: number) {
  const db = createDb(env.DB);

  await db.insert(jobs).values({
    id,
    customerId: "customer",
    name: `Job ${id}`,
    description: "Mow lawn",
    scheduledDate: "2026-09-15",
    servicePriceCents: status === "completed" ? 10_000 : null,
    createdAt: 1,
    updatedAt: 1,
  });
  await db.insert(jobStatusHistory).values({
    id: `status-${id}`,
    jobId: id,
    status,
    createdByUserId: user.id,
    createdAt: changedAt,
  });
}

it.each(["scheduled", "in_progress", "completed", "cancelled"] as const)(
  "returns only Jobs whose latest status is %s",
  async (status) => {
    const statuses = [
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
    ] as const;

    for (const [index, fixtureStatus] of statuses.entries()) {
      await insertJob(fixtureStatus, fixtureStatus, completionTime + index);
    }

    expect(await listJobsByStatus(env.DB, user, status)).toMatchObject([
      { id: status, currentStatus: status },
    ]);
  },
);

it("uses the authoritative latest status with the ID tie-break", async () => {
  await insertJob("job", "completed", completionTime);

  const db = createDb(env.DB);
  await db.insert(jobStatusHistory).values({
    id: "zz-latest",
    jobId: "job",
    status: "scheduled",
    createdByUserId: user.id,
    createdAt: completionTime,
  });

  expect(await listJobsByStatus(env.DB, user, "completed")).toEqual([]);
  expect(await listJobsByStatus(env.DB, user, "scheduled")).toMatchObject([
    { id: "job", currentStatus: "scheduled" },
  ]);
});

it("returns completed billing totals, completion date, and active invoice allocation", async () => {
  await insertJob("completed", "completed", completionTime);

  const db = createDb(env.DB);
  await db.insert(jobItems).values({
    id: "charge",
    jobId: "completed",
    description: "Green waste",
    quantity: 3,
    unitPriceCents: 2_345,
    createdAt: 1,
    updatedAt: 1,
  });
  await db.insert(invoices).values({
    id: "invoice",
    customerId: "customer",
    status: "draft",
    createdAt: 1,
    updatedAt: 1,
  });
  await db.insert(invoiceJobs).values({
    invoiceId: "invoice",
    jobId: "completed",
    completedAt: completionTime,
  });

  expect(await listJobsByStatus(env.DB, user, "completed")).toMatchObject([
    {
      id: "completed",
      statusChangedAt: completionTime,
      totalCents: 17_035,
      invoiceId: "invoice",
      invoiceNumber: null,
    },
  ]);
});

it("keeps an allocated Job in the completed lifecycle view", async () => {
  await insertJob("completed", "completed", completionTime);

  const db = createDb(env.DB);
  await db.insert(invoices).values({
    id: "invoice",
    customerId: "customer",
    status: "draft",
    createdAt: 1,
    updatedAt: 1,
  });
  await db.insert(invoiceJobs).values({
    invoiceId: "invoice",
    jobId: "completed",
    completedAt: completionTime,
  });

  expect(await listJobsByStatus(env.DB, user, "completed")).toMatchObject([
    { id: "completed", currentStatus: "completed", invoiceId: "invoice" },
  ]);
});

it("returns an empty list when the requested status has no Jobs", async () => {
  expect(await listJobsByStatus(env.DB, user, "cancelled")).toEqual([]);
});

it("requires read permission", async () => {
  await expect(
    listJobsByStatus(
      env.DB,
      { ...user, role: "unknown" as "admin" },
      "scheduled",
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
