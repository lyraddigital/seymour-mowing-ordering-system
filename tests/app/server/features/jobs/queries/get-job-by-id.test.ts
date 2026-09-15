import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { users } from "../../../../../../app/server/db/schema/users";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { getJobById } from "../../../../../../app/server/features/jobs/queries/get-job-by-id.server";
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
  await db.insert(customers).values({
    id: "customer",
    name: "Customer",
    createdAt: 1,
    updatedAt: 1,
    archivedAt: 2,
  });
  await db.insert(jobs).values(
    ["job", "other"].map((id) => ({
      id,
      customerId: "customer",
      name: `Name ${id}`,
      description: "Mow and edge lawns",
      scheduledDate: "2026-09-17",
      createdAt: 1,
      updatedAt: 1,
    })),
  );
  await db.insert(jobStatusHistory).values(
    ["job", "other"].map((jobId) => ({
      id: `${jobId}-initial`,
      jobId,
      status: "scheduled" as const,
      createdByUserId: user.id,
      createdAt: 1,
    })),
  );
});
it("returns the requested job with its name and customer even if the customer is archived", async () => {
  expect(await getJobById(env.DB, user, "job")).toEqual({
    id: "job",
    name: "Name job",
    customerId: "customer",
    customerName: "Customer",
    description: "Mow and edge lawns",
    scheduledDate: "2026-09-17",
    currentStatus: "scheduled",
  });
});
it.each(["completed", "cancelled"] as const)(
  "returns %s as current status using timestamp then id ordering",
  async (status) => {
    const db = createDb(env.DB);
    await db.insert(jobStatusHistory).values([
      {
        id: "z",
        jobId: "job",
        status: "scheduled",
        createdByUserId: user.id,
        createdAt: 0,
      },
      { id: "b", jobId: "job", status, createdByUserId: user.id, createdAt: 2 },
      {
        id: "a",
        jobId: "job",
        status: "scheduled",
        createdByUserId: user.id,
        createdAt: 2,
      },
    ]);
    expect(await getJobById(env.DB, user, "job")).toMatchObject({
      currentStatus: status,
    });
  },
);
it.each(["missing", "", "' OR 1=1 --"])(
  "returns null for unknown id %j",
  async (id) => {
    expect(await getJobById(env.DB, user, id)).toBeNull();
  },
);
it("requires read permission", async () => {
  await expect(
    getJobById(env.DB, { ...user, role: "unknown" as "admin" }, "job"),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
