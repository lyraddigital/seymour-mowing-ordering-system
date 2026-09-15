import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { users } from "../../../../../../app/server/db/schema/users";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { cancelJob } from "../../../../../../app/server/features/jobs/services/cancel-job.server";
import { completeJob } from "../../../../../../app/server/features/jobs/services/complete-job.server";
import { getJobById } from "../../../../../../app/server/features/jobs/queries/get-job-by-id.server";
import { listActiveJobs } from "../../../../../../app/server/features/jobs/queries/list-active-jobs.server";
import { JobNotFoundError } from "../../../../../../app/server/features/jobs/errors/job-not-found-error";
import { JobStateConflictError } from "../../../../../../app/server/features/jobs/errors/job-state-conflict-error";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();
beforeEach(async () => {
  const db = createDb(env.DB);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);
  await db.insert(users).values(user);
  await db
    .insert(customers)
    .values({ id: "customer", name: "Customer", createdAt: 1, updatedAt: 1 });
  await db.insert(jobs).values(
    ["job", "other"].map((id) => ({
      id,
      customerId: "customer",
      name: id,
      description: "Mow lawn",
      scheduledDate: "2026-09-17",
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
  "allows an authorized %s to append cancelled history without changing existing data",
  async (role) => {
    const db = createDb(env.DB);
    const beforeJobs = await db.select().from(jobs);
    const beforeHistory = await db.select().from(jobStatusHistory);
    const before = Date.now();
    expect(await cancelJob(env.DB, { ...user, role }, "job")).toEqual({
      id: "job",
    });
    const afterHistory = await db.select().from(jobStatusHistory);
    expect(afterHistory).toHaveLength(beforeHistory.length + 1);
    expect(afterHistory).toEqual(expect.arrayContaining(beforeHistory));
    expect(
      afterHistory.find((row) => row.status === "cancelled"),
    ).toMatchObject({
      jobId: "job",
      createdByUserId: user.id,
      createdAt: expect.any(Number),
    });
    expect(
      afterHistory.find((row) => row.status === "cancelled")!.createdAt,
    ).toBeGreaterThanOrEqual(before);
    expect(await db.select().from(jobs)).toEqual(beforeJobs);
    expect(await getJobById(env.DB, user, "job")).toMatchObject({
      currentStatus: "cancelled",
    });
    expect((await listActiveJobs(env.DB, user)).map((job) => job.id)).toEqual([
      "other",
    ]);
  },
);
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
    await expect(cancelJob(env.DB, user, "job")).rejects.toBeInstanceOf(
      JobStateConflictError,
    );
    expect(await db.select().from(jobStatusHistory)).toEqual(before);
  },
);
it.each(["missing", "", "' OR 1=1 --"])(
  "rejects missing job %j",
  async (id) => {
    await expect(cancelJob(env.DB, user, id)).rejects.toBeInstanceOf(
      JobNotFoundError,
    );
    expect(await createDb(env.DB).select().from(jobStatusHistory)).toHaveLength(
      2,
    );
  },
);
it("requires manage permission", async () => {
  await expect(
    cancelJob(env.DB, { ...user, role: "unknown" as "admin" }, "job"),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
it("orders the new history after an existing future timestamp", async () => {
  const db = createDb(env.DB);
  const future = Date.now() + 10000;
  await db
    .update(jobStatusHistory)
    .set({ createdAt: future })
    .where(eq(jobStatusHistory.jobId, "job"));
  await cancelJob(env.DB, user, "job");
  expect(await getJobById(env.DB, user, "job")).toMatchObject({
    currentStatus: "cancelled",
  });
  expect(
    await db
      .select()
      .from(jobStatusHistory)
      .where(eq(jobStatusHistory.status, "cancelled"))
      .get(),
  ).toMatchObject({ createdAt: future + 1 });
});
it("allows only one of competing transitions to succeed", async () => {
  const outcomes = await Promise.allSettled([
    cancelJob(env.DB, user, "job"),
    cancelJob(env.DB, user, "job"),
    completeJob(env.DB, user, "job"),
  ]);
  expect(
    outcomes.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  for (const result of outcomes)
    if (result.status === "rejected")
      expect(result.reason).toBeInstanceOf(JobStateConflictError);
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
    cancelJob(env.DB, { ...user, id: "missing-user" }, "job"),
  ).rejects.toThrow();
  expect(await db.select().from(jobStatusHistory)).toEqual(before);
});
