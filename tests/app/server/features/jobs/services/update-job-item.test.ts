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
import { JobStateConflictError } from "../../../../../../app/server/features/jobs/errors/job-state-conflict-error";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { reopenJob } from "../../../../../../app/server/features/jobs/services/reopen-job.server";
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
    quantity: 1,
    unitPriceCents: 4500,
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
        quantity: 3,
        unitPriceCents: 8000,
      }),
    ).toEqual({ id: itemId });

    const updated = await getItem();

    expect(updated).toMatchObject({
      id: itemId,
      jobId,
      description: "Front and back lawn",
      quantity: 3,
      unitPriceCents: 8000,
      createdAt: original!.createdAt,
    });

    expect(updated!.updatedAt).toBeGreaterThanOrEqual(original!.updatedAt);
  },
);

it("allows the amount to be changed to zero", async () => {
  await updateJobItem(env.DB, user, jobId, itemId, {
    description: "No-charge follow-up",
    quantity: 1,
    unitPriceCents: 0,
  });

  expect(await getItem()).toMatchObject({
    description: "No-charge follow-up",
    quantity: 1,
    unitPriceCents: 0,
  });
});

it.each(["scheduled", "in_progress"] as const)(
  "allows an item to be edited while the job is %s",
  async (status) => {
    if (status !== "scheduled") {
      await setStatus(status);
    }

    await updateJobItem(env.DB, user, jobId, itemId, {
      description: "Updated work",
      quantity: 1,
      unitPriceCents: 5000,
    });

    expect(await getItem()).toMatchObject({
      description: "Updated work",
      quantity: 1,
      unitPriceCents: 5000,
    });
  },
);

it.each(["completed", "cancelled"] as const)(
  "rejects editing an item while the job is %s",
  async (status) => {
    await setStatus(status);

    await expect(
      updateJobItem(env.DB, user, jobId, itemId, {
        description: "Updated work",
        quantity: 1,
        unitPriceCents: 5000,
      }),
    ).rejects.toBeInstanceOf(JobStateConflictError);

    expect(await getItem()).toMatchObject({
      id: itemId,
      jobId,
      description: "Front lawn",
      quantity: 1,
      unitPriceCents: 4500,
    });
  },
);

it("allows an item to be edited after a completed job is reopened", async () => {
  await setStatus("completed");

  await reopenJob(env.DB, user, jobId);

  await updateJobItem(env.DB, user, jobId, itemId, {
    description: "Updated after reopening",
    quantity: 1,
    unitPriceCents: 5500,
  });

  expect(await getItem()).toMatchObject({
    id: itemId,
    jobId,
    description: "Updated after reopening",
    quantity: 1,
    unitPriceCents: 5500,
  });
});

it.each([
  {
    description: "",
    quantity: 1,
    unitPriceCents: 1000,
  },
  {
    description: " ",
    quantity: 1,
    unitPriceCents: 1000,
  },
  {
    description: "x".repeat(501),
    quantity: 1,
    unitPriceCents: 1000,
  },
  {
    description: "Lawn mowing",
    quantity: 1,
    unitPriceCents: -1,
  },
  {
    description: "Lawn mowing",
    quantity: 1,
    unitPriceCents: 10.5,
  },
])("rejects invalid item input %#", async (input) => {
  await expect(
    updateJobItem(env.DB, user, jobId, itemId, input),
  ).rejects.toBeInstanceOf(JobItemValidationError);

  expect(await getItem()).toMatchObject({
    description: "Front lawn",
    quantity: 1,
    unitPriceCents: 4500,
  });
});

it("rejects a nonexistent item", async () => {
  await expect(
    updateJobItem(env.DB, user, jobId, "missing", {
      description: "Updated work",
      quantity: 1,
      unitPriceCents: 5000,
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
      quantity: 1,
      unitPriceCents: 5000,
    }),
  ).rejects.toBeInstanceOf(JobItemNotFoundError);

  expect(await getItem()).toMatchObject({
    jobId,
    description: "Front lawn",
    quantity: 1,
    unitPriceCents: 4500,
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
        quantity: 1,
        unitPriceCents: 5000,
      },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await getItem()).toMatchObject({
    description: "Front lawn",
    quantity: 1,
    unitPriceCents: 4500,
  });
});

it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  "rejects invalid quantity %s without changing charges",
  async (quantity) => {
    const before = await createDb(env.DB).select().from(jobItems);
    const input = {
      description: "Green waste",
      quantity,
      unitPriceCents: 1000,
    };
    await expect(
      updateJobItem(env.DB, user, jobId, itemId, input),
    ).rejects.toBeInstanceOf(JobItemValidationError);
    expect(await createDb(env.DB).select().from(jobItems)).toEqual(before);
  },
);
it("rejects a line amount outside the safe integer range", async () => {
  const input = {
    description: "Green waste",
    quantity: 2,
    unitPriceCents: Number.MAX_SAFE_INTEGER,
  };
  await expect(
    updateJobItem(env.DB, user, jobId, itemId, input),
  ).rejects.toBeInstanceOf(JobItemValidationError);
});
