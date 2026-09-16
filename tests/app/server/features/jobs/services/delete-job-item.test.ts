import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { JobItemNotFoundError } from "../../../../../../app/server/features/jobs/errors/job-item-not-found-error";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { deleteJobItem } from "../../../../../../app/server/features/jobs/services/delete-job-item.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();

let jobId: string;
let itemId: string;

beforeEach(async () => {
  const db = createDb(env.DB);

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

  ({ id: jobId } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Lawn service",
    description: "Mow lawns",
    scheduledDate: "2026-09-16",
  }));

  ({ id: itemId } = await createJobItem(env.DB, user, jobId, {
    description: "Front lawn",
    amountCents: 4500,
  }));
});

async function setStatus(status: "in_progress" | "completed" | "cancelled") {
  await createDb(env.DB)
    .insert(jobStatusHistory)
    .values({
      id: `status-${status}`,
      jobId,
      status,
      createdByUserId: user.id,
      createdAt: Date.now() + 1,
    });
}

it.each(["admin", "operator"] as const)(
  "allows an authorized %s to delete a job item",
  async (role) => {
    expect(
      await deleteJobItem(env.DB, { ...user, role }, jobId, itemId),
    ).toEqual({ id: itemId });

    expect(
      await createDb(env.DB)
        .select()
        .from(jobItems)
        .where(eq(jobItems.id, itemId)),
    ).toEqual([]);
  },
);

it("only deletes the requested item", async () => {
  const { id: otherItemId } = await createJobItem(env.DB, user, jobId, {
    description: "Back lawn",
    amountCents: 3500,
  });

  await deleteJobItem(env.DB, user, jobId, itemId);

  expect(await createDb(env.DB).select().from(jobItems)).toEqual([
    expect.objectContaining({
      id: otherItemId,
      description: "Back lawn",
      amountCents: 3500,
    }),
  ]);
});

it.each(["scheduled", "in_progress", "completed", "cancelled"] as const)(
  "allows an item to be deleted while the job is %s",
  async (status) => {
    if (status !== "scheduled") {
      await setStatus(status);
    }

    await deleteJobItem(env.DB, user, jobId, itemId);

    expect(await createDb(env.DB).select().from(jobItems)).toEqual([]);
  },
);

it("rejects a nonexistent item", async () => {
  await expect(
    deleteJobItem(env.DB, user, jobId, "missing"),
  ).rejects.toBeInstanceOf(JobItemNotFoundError);

  expect(await createDb(env.DB).select().from(jobItems)).toHaveLength(1);
});

it("rejects an item that belongs to another job", async () => {
  const { id: otherJobId } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Other job",
    description: "Other work",
    scheduledDate: "2026-09-17",
  });

  await expect(
    deleteJobItem(env.DB, user, otherJobId, itemId),
  ).rejects.toBeInstanceOf(JobItemNotFoundError);

  expect(
    await createDb(env.DB)
      .select()
      .from(jobItems)
      .where(eq(jobItems.id, itemId)),
  ).toHaveLength(1);
});

it("requires manage permission", async () => {
  await expect(
    deleteJobItem(
      env.DB,
      {
        ...user,
        role: "unknown" as "admin",
      },
      jobId,
      itemId,
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await createDb(env.DB).select().from(jobItems)).toHaveLength(1);
});
