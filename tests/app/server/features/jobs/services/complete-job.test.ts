import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { reopenJob } from "../../../../../../app/server/features/jobs/services/reopen-job.server";
import { JobValidationError } from "../../../../../../app/server/features/jobs/errors/job-validation-error";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { JobNotFoundError } from "../../../../../../app/server/features/jobs/errors/job-not-found-error";
import { JobStateConflictError } from "../../../../../../app/server/features/jobs/errors/job-state-conflict-error";
import { getJobById } from "../../../../../../app/server/features/jobs/queries/get-job-by-id.server";
import { listActiveJobs } from "../../../../../../app/server/features/jobs/queries/list-active-jobs.server";
import { cancelJob } from "../../../../../../app/server/features/jobs/services/cancel-job.server";
import { completeJob } from "../../../../../../app/server/features/jobs/services/complete-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();

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

  await db.insert(jobs).values(
    ["job", "other"].map((id) => ({
      id,
      customerId: "customer",
      name: id,
      description: "Mow lawn",
      scheduledDate: "2026-09-17",
      servicePriceCents: 10_000,
      createdAt: 1,
      updatedAt: 1,
    })),
  );

  await db.insert(jobStatusHistory).values(
    ["job", "other"].map((jobId) => ({
      id: jobId,
      jobId,
      status: "scheduled" as const,
      createdByUserId: user.id,
      createdAt: 1,
    })),
  );
});

it.each(["admin", "operator"] as const)(
  "allows an authorized %s to append completed history without changing existing data",
  async (role) => {
    const db = createDb(env.DB);

    const beforeHistory = await db.select().from(jobStatusHistory);
    const before = Date.now();

    expect(await completeJob(env.DB, { ...user, role }, "job", 10_000)).toEqual({
      id: "job",
    });

    const afterHistory = await db.select().from(jobStatusHistory);

    expect(afterHistory).toHaveLength(beforeHistory.length + 1);
    expect(afterHistory).toEqual(expect.arrayContaining(beforeHistory));

    expect(
      afterHistory.find((row) => row.status === "completed"),
    ).toMatchObject({
      jobId: "job",
      createdByUserId: user.id,
      createdAt: expect.any(Number),
    });

    expect(
      afterHistory.find((row) => row.status === "completed")!.createdAt,
    ).toBeGreaterThanOrEqual(before);

    expect(await db.select().from(jobs).where(eq(jobs.id, "job")).get()).toMatchObject({ servicePriceCents: 10_000 });

    expect(await getJobById(env.DB, user, "job")).toMatchObject({
      currentStatus: "completed",
    });

    expect((await listActiveJobs(env.DB, user)).map((job) => job.id)).toEqual([
      "other",
    ]);
  },
);

it("rejects completion when the service price has not been set", async () => {
  const db = createDb(env.DB);

  await db
    .update(jobs)
    .set({ servicePriceCents: null })
    .where(eq(jobs.id, "job"));

  const before = await db
    .select()
    .from(jobStatusHistory)
    .where(eq(jobStatusHistory.jobId, "job"));

  await expect(completeJob(env.DB, user, "job", undefined as unknown as number)).rejects.toThrow(
  );

  expect(
    await db
      .select()
      .from(jobStatusHistory)
      .where(eq(jobStatusHistory.jobId, "job")),
  ).toEqual(before);

  expect(await getJobById(env.DB, user, "job")).toMatchObject({
    currentStatus: "scheduled",
    servicePriceCents: null,
  });
});

it("allows completion when the service price is explicitly zero", async () => {
  const db = createDb(env.DB);

  await db.update(jobs).set({ servicePriceCents: 0 }).where(eq(jobs.id, "job"));

  expect(await completeJob(env.DB, user, "job", 0)).toEqual({
    id: "job",
  });

  expect(await getJobById(env.DB, user, "job")).toMatchObject({
    currentStatus: "completed",
    servicePriceCents: 0,
  });
});

it("allows an in-progress job with a service price to be completed", async () => {
  const db = createDb(env.DB);

  await db.insert(jobStatusHistory).values({
    id: "in-progress",
    jobId: "job",
    status: "in_progress",
    createdByUserId: user.id,
    createdAt: 2,
  });

  expect(await completeJob(env.DB, user, "job", 10_000)).toEqual({
    id: "job",
  });

  expect(await getJobById(env.DB, user, "job")).toMatchObject({
    currentStatus: "completed",
  });
});

it.each(["completed", "cancelled"] as const)(
  "rejects a job whose latest status is %s",
  async (status) => {
    const db = createDb(env.DB);

    await db.insert(jobStatusHistory).values({
      id: "latest",
      jobId: "job",
      status,
      createdByUserId: user.id,
      createdAt: 2,
    });

    const before = await db.select().from(jobStatusHistory);

    await expect(completeJob(env.DB, user, "job", 10_000)).rejects.toBeInstanceOf(
      JobStateConflictError,
    );

    expect(await db.select().from(jobStatusHistory)).toEqual(before);
    expect(await getJobById(env.DB, user, "job")).toMatchObject({ servicePriceCents: 10000 });
  },
);

it.each(["missing", "", "' OR 1=1 --"])(
  "rejects missing job %j",
  async (id) => {
    await expect(completeJob(env.DB, user, id, 10_000)).rejects.toBeInstanceOf(
      JobNotFoundError,
    );

    expect(await createDb(env.DB).select().from(jobStatusHistory)).toHaveLength(
      2,
    );
  },
);

it("requires manage permission", async () => {
  await expect(
    completeJob(env.DB, { ...user, role: "unknown" as "admin" }, "job", 10_000),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});

it("orders the new history after an existing future timestamp", async () => {
  const db = createDb(env.DB);
  const future = Date.now() + 10000;

  await db
    .update(jobStatusHistory)
    .set({ createdAt: future })
    .where(eq(jobStatusHistory.jobId, "job"));

  await completeJob(env.DB, user, "job", 10_000);

  expect(await getJobById(env.DB, user, "job")).toMatchObject({
    currentStatus: "completed",
  });

  expect(
    await db
      .select()
      .from(jobStatusHistory)
      .where(eq(jobStatusHistory.status, "completed"))
      .get(),
  ).toMatchObject({
    createdAt: future + 1,
  });
});

it("allows only one of competing transitions to succeed", async () => {
  const outcomes = await Promise.allSettled([
    completeJob(env.DB, user, "job", 10_000),
    completeJob(env.DB, user, "job", 10_000),
    cancelJob(env.DB, user, "job"),
  ]);

  expect(
    outcomes.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);

  for (const result of outcomes) {
    if (result.status === "rejected") {
      expect(result.reason).toBeInstanceOf(JobStateConflictError);
    }
  }

  expect(
    await createDb(env.DB)
      .select()
      .from(jobStatusHistory)
      .where(eq(jobStatusHistory.jobId, "job")),
  ).toHaveLength(2);
});

it("preserves history if the responsible user foreign key fails", async () => {
  const db = createDb(env.DB);
  const before = await db.select().from(jobStatusHistory);

  await expect(
    completeJob(env.DB, { ...user, id: "missing-user" }, "job", 10_000),
  ).rejects.toThrow();

  expect(await db.select().from(jobStatusHistory)).toEqual(before);
});


it.each([undefined, null, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "100"])(
  "rejects invalid final price %s without changing billing or history", async (price) => {
    const db = createDb(env.DB);
    const beforeJobs = await db.select().from(jobs);
    const beforeHistory = await db.select().from(jobStatusHistory);
    await expect(completeJob(env.DB, user, "job", price as number)).rejects.toBeInstanceOf(JobValidationError);
    expect(await db.select().from(jobs)).toEqual(beforeJobs);
    expect(await db.select().from(jobStatusHistory)).toEqual(beforeHistory);
  },
);

it("persists the final price, retains charges through reopening, and accepts a corrected price on re-completion", async () => {
  const db = createDb(env.DB);
  await db.update(jobs).set({ servicePriceCents: null }).where(eq(jobs.id, "job"));
  await db.insert(jobItems).values({ id: "charge", jobId: "job", description: "Green waste", amountCents: 2500, createdAt: 1, updatedAt: 1 });
  const charges = await db.select().from(jobItems);
  await completeJob(env.DB, user, "job", 12345);
  expect(await getJobById(env.DB, user, "job")).toMatchObject({ currentStatus: "completed", servicePriceCents: 12345 });
  await reopenJob(env.DB, user, "job");
  expect(await getJobById(env.DB, user, "job")).toMatchObject({ currentStatus: "in_progress", servicePriceCents: 12345 });
  expect(await db.select().from(jobItems)).toEqual(charges);
  await completeJob(env.DB, user, "job", 9876);
  expect(await getJobById(env.DB, user, "job")).toMatchObject({ currentStatus: "completed", servicePriceCents: 9876 });
  expect(await db.select().from(jobItems)).toEqual(charges);
});

it("rolls back completed history when the price write fails", async () => {
  const before = await createDb(env.DB).select().from(jobStatusHistory);
  await env.DB.exec("CREATE TRIGGER fail_completion_price BEFORE UPDATE OF service_price_cents ON jobs BEGIN SELECT RAISE(ABORT, 'price write failed'); END");
  try {
    await expect(completeJob(env.DB, user, "job", 23456)).rejects.toThrow();
    expect(await createDb(env.DB).select().from(jobStatusHistory)).toEqual(before);
    expect(await getJobById(env.DB, user, "job")).toMatchObject({ currentStatus: "scheduled", servicePriceCents: 10000 });
  } finally {
    await env.DB.exec("DROP TRIGGER fail_completion_price");
  }
});
