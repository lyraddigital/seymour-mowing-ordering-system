import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { users } from "../../../../../../app/server/db/schema/users";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { listActiveJobs } from "../../../../../../app/server/features/jobs/queries/list-active-jobs.server";
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
});
it("returns scheduled jobs with customer data in date then id order, even after customer archival", async () => {
  const db = createDb(env.DB);
  for (const [id, scheduledDate] of [
    ["c", "2026-09-16"],
    ["b", "2026-09-15"],
    ["a", "2026-09-15"],
  ]) {
    await db.insert(jobs).values({
      id,
      customerId: "customer",
      name: "Lawn service",
      description: "Mow lawn",
      scheduledDate,
      createdAt: 1,
      updatedAt: 1,
    });
    await db.insert(jobStatusHistory).values({
      id,
      jobId: id,
      status: "scheduled",
      createdByUserId: user.id,
      createdAt: 1,
    });
  }
  await db.update(customers).set({ archivedAt: 2 });
  expect(await listActiveJobs(env.DB, user)).toEqual(
    ["a", "b", "c"].map((id) => ({
      id,
      customerId: "customer",
      customerName: "Customer",
      name: "Lawn service",
      description: "Mow lawn",
      scheduledDate: id === "c" ? "2026-09-16" : "2026-09-15",
      currentStatus: "scheduled",
    })),
  );
});
it.each(["completed", "cancelled"] as const)(
  "uses the latest status and excludes %s jobs",
  async (status) => {
    const db = createDb(env.DB);
    await db.insert(jobs).values({
      id: "job",
      customerId: "customer",
      name: "Lawn service",
      description: "Mow lawn",
      scheduledDate: "2026-09-15",
      createdAt: 1,
      updatedAt: 1,
    });
    // Insertion order and ID order differ from timestamp order deliberately.
    await db.insert(jobStatusHistory).values([
      { id: "a", jobId: "job", status, createdByUserId: user.id, createdAt: 2 },
      {
        id: "z",
        jobId: "job",
        status: "scheduled",
        createdByUserId: user.id,
        createdAt: 1,
      },
    ]);
    expect(await listActiveJobs(env.DB, user)).toEqual([]);
    await db.insert(jobStatusHistory).values({
      id: "b",
      jobId: "job",
      status: "scheduled",
      createdByUserId: user.id,
      createdAt: 2,
    });
    expect(await listActiveJobs(env.DB, user)).toMatchObject([
      { id: "job", currentStatus: "scheduled" },
    ]);
  },
);
it("returns an empty list with no jobs", async () => {
  expect(await listActiveJobs(env.DB, user)).toEqual([]);
});
it("requires read permission", async () => {
  await expect(
    listActiveJobs(env.DB, { ...user, role: "unknown" as "admin" }),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
