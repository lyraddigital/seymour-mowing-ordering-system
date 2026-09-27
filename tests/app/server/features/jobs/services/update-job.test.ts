import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { JobNotFoundError } from "../../../../../../app/server/features/jobs/errors/job-not-found-error";
import { JobStateConflictError } from "../../../../../../app/server/features/jobs/errors/job-state-conflict-error";
import { JobValidationError } from "../../../../../../app/server/features/jobs/errors/job-validation-error";
import { updateJob } from "../../../../../../app/server/features/jobs/services/update-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();
const jobId = "job";
const originalDate = "2026-09-17";

beforeEach(async () => {
  const db = createDb(env.DB);

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
    name: "Old name",
    description: "Old description",
    scheduledDate: originalDate,
    servicePriceCents: null,
    createdAt: 1,
    updatedAt: 1,
  });

  await db.insert(jobStatusHistory).values({
    id: "initial",
    jobId,
    status: "scheduled",
    createdByUserId: user.id,
    createdAt: 1,
  });
});

async function setStatus(status: "in_progress" | "completed" | "cancelled") {
  await createDb(env.DB)
    .insert(jobStatusHistory)
    .values({
      id: `status-${status}`,
      jobId,
      status,
      createdByUserId: user.id,
      createdAt: 2,
    });
}

async function setServicePrice(servicePriceCents: number | null) {
  await createDb(env.DB)
    .update(jobs)
    .set({ servicePriceCents })
    .where(eq(jobs.id, jobId));
}

async function getJob() {
  return createDb(env.DB).select().from(jobs).where(eq(jobs.id, jobId)).get();
}

it.each(["admin", "operator"] as const)(
  "allows an authorized %s to update all editable fields while scheduled",
  async (role) => {
    const before = Date.now();

    expect(
      await updateJob(env.DB, { ...user, role }, jobId, {
        name: " New name ",
        description: " New description ",
        scheduledDate: "2026-09-18",
        servicePriceCents: 12_500,
      }),
    ).toEqual({ id: jobId });

    expect(await getJob()).toMatchObject({
      id: jobId,
      customerId: "customer",
      name: "New name",
      description: "New description",
      scheduledDate: "2026-09-18",
      servicePriceCents: 12_500,
      createdAt: 1,
    });

    expect((await getJob())!.updatedAt).toBeGreaterThanOrEqual(before);
  },
);

it("allows a zero service price while scheduled", async () => {
  await updateJob(env.DB, user, jobId, {
    name: "Old name",
    description: "Old description",
    scheduledDate: originalDate,
    servicePriceCents: 0,
  });

  expect(await getJob()).toMatchObject({
    servicePriceCents: 0,
  });
});

it("allows the service price to be cleared while scheduled", async () => {
  await setServicePrice(10_000);

  await updateJob(env.DB, user, jobId, {
    name: "Old name",
    description: "Old description",
    scheduledDate: originalDate,
    servicePriceCents: null,
  });

  expect(await getJob()).toMatchObject({
    servicePriceCents: null,
  });
});

it("allows the service price to be changed while in progress", async () => {
  await setServicePrice(10_000);
  await setStatus("in_progress");

  await updateJob(env.DB, user, jobId, {
    name: "Corrected name",
    description: "Corrected description",
    scheduledDate: originalDate,
    servicePriceCents: 15_000,
  });

  expect(await getJob()).toMatchObject({
    name: "Corrected name",
    description: "Corrected description",
    servicePriceCents: 15_000,
  });
});

it.each(["completed", "cancelled"] as const)(
  "rejects a service price change while %s",
  async (status) => {
    await setServicePrice(10_000);
    await setStatus(status);

    await expect(
      updateJob(env.DB, user, jobId, {
        name: "Changed name",
        description: "Changed description",
        scheduledDate: originalDate,
        servicePriceCents: 15_000,
      }),
    ).rejects.toBeInstanceOf(JobStateConflictError);

    expect(await getJob()).toMatchObject({
      name: "Old name",
      description: "Old description",
      servicePriceCents: 10_000,
    });
  },
);

it.each(["in_progress", "completed", "cancelled"] as const)(
  "rejects a scheduled date change while %s",
  async (status) => {
    await setStatus(status);

    await expect(
      updateJob(env.DB, user, jobId, {
        name: "Changed name",
        description: "Changed description",
        scheduledDate: "2026-09-18",
        servicePriceCents: null,
      }),
    ).rejects.toBeInstanceOf(JobStateConflictError);

    expect(await getJob()).toMatchObject({
      customerId: "customer",
      name: "Old name",
      description: "Old description",
      scheduledDate: originalDate,
      servicePriceCents: null,
    });
  },
);

it.each([
  -1,
  1.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.MAX_SAFE_INTEGER + 1,
])("rejects invalid service price %s", async (servicePriceCents) => {
  await expect(
    updateJob(env.DB, user, jobId, {
      name: "Changed name",
      description: "Changed description",
      scheduledDate: originalDate,
      servicePriceCents,
    }),
  ).rejects.toBeInstanceOf(JobValidationError);

  expect(await getJob()).toMatchObject({
    name: "Old name",
    description: "Old description",
    servicePriceCents: null,
  });
});

it("does not alter the customer relationship", async () => {
  await updateJob(env.DB, user, jobId, {
    name: "Changed name",
    description: "Changed description",
    scheduledDate: originalDate,
    servicePriceCents: 10_000,
  });

  expect(await getJob()).toMatchObject({
    customerId: "customer",
  });
});

it("does not alter status history", async () => {
  const db = createDb(env.DB);
  const before = await db.select().from(jobStatusHistory);

  await updateJob(env.DB, user, jobId, {
    name: "Changed name",
    description: "Changed description",
    scheduledDate: originalDate,
    servicePriceCents: 10_000,
  });

  expect(await db.select().from(jobStatusHistory)).toEqual(before);
});

it("rejects a nonexistent job", async () => {
  await expect(
    updateJob(env.DB, user, "missing", {
      name: "Changed name",
      description: "Changed description",
      scheduledDate: originalDate,
      servicePriceCents: 10_000,
    }),
  ).rejects.toBeInstanceOf(JobNotFoundError);
});

it("validates input before updating", async () => {
  await expect(
    updateJob(env.DB, user, jobId, {
      name: " ",
      description: "Changed description",
      scheduledDate: originalDate,
      servicePriceCents: 10_000,
    }),
  ).rejects.toBeInstanceOf(JobValidationError);

  expect(await getJob()).toMatchObject({
    name: "Old name",
    description: "Old description",
    scheduledDate: originalDate,
    servicePriceCents: null,
  });
});

it("requires manage permission", async () => {
  await expect(
    updateJob(env.DB, { ...user, role: "unknown" as "admin" }, jobId, {
      name: "Changed name",
      description: "Changed description",
      scheduledDate: originalDate,
      servicePriceCents: 10_000,
    }),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await getJob()).toMatchObject({
    name: "Old name",
    description: "Old description",
    scheduledDate: originalDate,
    servicePriceCents: null,
  });
});
