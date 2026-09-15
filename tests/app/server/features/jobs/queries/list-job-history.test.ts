import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { users } from "../../../../../../app/server/db/schema/users";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { listJobHistory } from "../../../../../../app/server/features/jobs/queries/list-job-history.server";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { internalUser } from "../../../../../support/fixtures/internal-user";
import { listActiveJobs } from "../../../../../../app/server/features/jobs/queries/list-active-jobs.server";

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
});
it("returns terminal jobs with names and customers ordered by latest transition descending then job id", async () => {
  const db = createDb(env.DB);
  const fixtures = [
    {
      id: "z",
      status: "completed" as const,
      changedAt: 2,
      scheduledDate: "2026-12-01",
    },
    {
      id: "b",
      status: "cancelled" as const,
      changedAt: 3,
      scheduledDate: "2026-09-01",
    },
    {
      id: "a",
      status: "completed" as const,
      changedAt: 3,
      scheduledDate: "2026-08-01",
    },
    {
      id: "scheduled",
      status: "scheduled" as const,
      changedAt: 4,
      scheduledDate: "2026-10-01",
    },
  ];
  for (const fixture of fixtures) {
    await db.insert(jobs).values({
      id: fixture.id,
      customerId: "customer",
      name: `Job ${fixture.id}`,
      description: "Mow lawn",
      scheduledDate: fixture.scheduledDate,
      createdAt: 1,
      updatedAt: 1,
    });
    await db.insert(jobStatusHistory).values({
      id: fixture.id,
      jobId: fixture.id,
      status: fixture.status,
      createdAt: fixture.changedAt,
      createdByUserId: user.id,
    });
  }
  // Customer archival does not hide historical jobs.
  await db.update(customers).set({ archivedAt: 5 });
  expect(await listJobHistory(env.DB, user)).toEqual(
    ["a", "b", "z"].map((id) => {
      const fixture = fixtures.find((item) => item.id === id)!;
      return {
        id,
        name: `Job ${id}`,
        customerId: "customer",
        customerName: "Customer",
        description: "Mow lawn",
        scheduledDate: fixture.scheduledDate,
        currentStatus: fixture.status,
        statusChangedAt: fixture.changedAt,
      };
    }),
  );
});
it.each(["completed", "cancelled"] as const)(
  "uses the latest status rather than any earlier %s row",
  async (status) => {
    const db = createDb(env.DB);
    await db.insert(jobs).values({
      id: "job",
      customerId: "customer",
      name: "Lawn service",
      description: "Mow lawn",
      scheduledDate: "2026-09-17",
      createdAt: 1,
      updatedAt: 1,
    });
    // Direct fixtures exercise authoritative ordering without adding reopening.
    await db.insert(jobStatusHistory).values([
      {
        id: "z-old",
        jobId: "job",
        status,
        createdAt: 1,
        createdByUserId: user.id,
      },
      {
        id: "a",
        jobId: "job",
        status: "scheduled",
        createdAt: 2,
        createdByUserId: user.id,
      },
    ]);
    expect(await listJobHistory(env.DB, user)).toEqual([]);
    expect(await listActiveJobs(env.DB, user)).toMatchObject([{ id: "job" }]);
    await db.insert(jobStatusHistory).values({
      id: "b",
      jobId: "job",
      status,
      createdAt: 2,
      createdByUserId: user.id,
    });
    expect(await listJobHistory(env.DB, user)).toMatchObject([
      { id: "job", currentStatus: status, statusChangedAt: 2 },
    ]);
    expect(await listActiveJobs(env.DB, user)).toEqual([]);
    await db.insert(jobStatusHistory).values({
      id: "c",
      jobId: "job",
      status: "scheduled",
      createdAt: 2,
      createdByUserId: user.id,
    });
    expect(await listJobHistory(env.DB, user)).toEqual([]);
  },
);
it("returns an empty list when no historical jobs exist", async () => {
  expect(await listJobHistory(env.DB, user)).toEqual([]);
});
it("requires read permission", async () => {
  await expect(
    listJobHistory(env.DB, { ...user, role: "unknown" as "admin" }),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
