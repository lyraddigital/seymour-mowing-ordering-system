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
import { JobItemValidationError } from "../../../../../../app/server/features/jobs/errors/job-item-validation-error";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { updateJobItem } from "../../../../../../app/server/features/jobs/services/update-job-item.server";
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

async function getItem() {
  return createDb(env.DB)
    .select()
    .from(jobItems)
    .where(eq(jobItems.id, itemId))
    .get();
}

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
  "allows an authorized %s to update a job item",
  async (role) => {
    const original = await getItem();

    expect(
      await updateJobItem(env.DB, { ...user, role }, jobId, itemId, {
        description: "  Front and back lawn  ",
        amountCents: 8000,
      }),
    ).toEqual({ id: itemId });

    const updated = await getItem();

    expect(updated).toMatchObject({
      id: itemId,
      jobId,
      description: "Front and back lawn",
      amountCents: 8000,
      createdAt: original!.createdAt,
    });

    expect(updated!.updatedAt).toBeGreaterThanOrEqual(original!.updatedAt);
  },
);

it("allows the amount to be changed to zero", async () => {
  await updateJobItem(env.DB, user, jobId, itemId, {
    description: "No-charge follow-up",
    amountCents: 0,
  });

  expect(await getItem()).toMatchObject({
    description: "No-charge follow-up",
    amountCents: 0,
  });
});

it.each(["scheduled", "in_progress", "completed", "cancelled"] as const)(
  "allows an item to be edited while the job is %s",
  async (status) => {
    if (status !== "scheduled") {
      await setStatus(status);
    }

    await updateJobItem(env.DB, user, jobId, itemId, {
      description: "Updated work",
      amountCents: 5000,
    });

    expect(await getItem()).toMatchObject({
      description: "Updated work",
      amountCents: 5000,
    });
  },
);

it.each([
  {
    description: "",
    amountCents: 1000,
  },
  {
    description: " ",
    amountCents: 1000,
  },
  {
    description: "x".repeat(501),
    amountCents: 1000,
  },
  {
    description: "Lawn mowing",
    amountCents: -1,
  },
  {
    description: "Lawn mowing",
    amountCents: 10.5,
  },
])("rejects invalid item input %#", async (input) => {
  await expect(
    updateJobItem(env.DB, user, jobId, itemId, input),
  ).rejects.toBeInstanceOf(JobItemValidationError);

  expect(await getItem()).toMatchObject({
    description: "Front lawn",
    amountCents: 4500,
  });
});

it("rejects a nonexistent item", async () => {
  await expect(
    updateJobItem(env.DB, user, jobId, "missing", {
      description: "Updated work",
      amountCents: 5000,
    }),
  ).rejects.toBeInstanceOf(JobItemNotFoundError);
});

it("rejects an item that belongs to another job", async () => {
  const { id: otherJobId } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Other job",
    description: "Other work",
    scheduledDate: "2026-09-17",
  });

  await expect(
    updateJobItem(env.DB, user, otherJobId, itemId, {
      description: "Updated work",
      amountCents: 5000,
    }),
  ).rejects.toBeInstanceOf(JobItemNotFoundError);

  expect(await getItem()).toMatchObject({
    jobId,
    description: "Front lawn",
    amountCents: 4500,
  });
});

it("requires manage permission", async () => {
  await expect(
    updateJobItem(
      env.DB,
      { ...user, role: "unknown" as "admin" },
      jobId,
      itemId,
      {
        description: "Updated work",
        amountCents: 5000,
      },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await getItem()).toMatchObject({
    description: "Front lawn",
    amountCents: 4500,
  });
});
