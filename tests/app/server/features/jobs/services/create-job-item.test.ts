import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { JobItemValidationError } from "../../../../../../app/server/features/jobs/errors/job-item-validation-error";
import { JobNotFoundError } from "../../../../../../app/server/features/jobs/errors/job-not-found-error";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();

let jobId: string;

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
});

it.each(["admin", "operator"] as const)(
  "creates a job item for an authorized %s",
  async (role) => {
    const before = Date.now();

    const { id } = await createJobItem(env.DB, { ...user, role }, jobId, {
      description: "  Front lawn mow  ",
      amountCents: 4500,
    });

    const saved = await createDb(env.DB).select().from(jobItems).get();

    expect(saved).toMatchObject({
      id,
      jobId,
      description: "Front lawn mow",
      amountCents: 4500,
    });

    expect(saved!.createdAt).toBeGreaterThanOrEqual(before);
    expect(saved!.updatedAt).toBe(saved!.createdAt);
  },
);

it.each(["scheduled", "in_progress", "completed", "cancelled"] as const)(
  "allows an item to be added while the job is %s",
  async (status) => {
    const db = createDb(env.DB);

    if (status !== "scheduled") {
      await db.insert(jobStatusHistory).values({
        id: `status-${status}`,
        jobId,
        status,
        createdByUserId: user.id,
        createdAt: Date.now() + 1,
      });
    }

    await createJobItem(env.DB, user, jobId, {
      description: "Lawn mowing",
      amountCents: 5000,
    });

    expect(await db.select().from(jobItems)).toHaveLength(1);
  },
);

it("allows a zero-value item", async () => {
  await createJobItem(env.DB, user, jobId, {
    description: "No-charge follow-up",
    amountCents: 0,
  });

  expect(await createDb(env.DB).select().from(jobItems)).toEqual([
    expect.objectContaining({
      description: "No-charge follow-up",
      amountCents: 0,
    }),
  ]);
});

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
    createJobItem(env.DB, user, jobId, input),
  ).rejects.toBeInstanceOf(JobItemValidationError);

  expect(await createDb(env.DB).select().from(jobItems)).toEqual([]);
});

it("rejects a nonexistent job", async () => {
  await expect(
    createJobItem(env.DB, user, "missing", {
      description: "Lawn mowing",
      amountCents: 5000,
    }),
  ).rejects.toBeInstanceOf(JobNotFoundError);

  expect(await createDb(env.DB).select().from(jobItems)).toEqual([]);
});

it("requires manage permission", async () => {
  await expect(
    createJobItem(env.DB, { ...user, role: "unknown" as "admin" }, jobId, {
      description: "Lawn mowing",
      amountCents: 5000,
    }),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await createDb(env.DB).select().from(jobItems)).toEqual([]);
});
