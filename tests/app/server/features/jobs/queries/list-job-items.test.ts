import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { listJobItems } from "../../../../../../app/server/features/jobs/queries/list-job-items.server";
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

it("returns job items in creation order", async () => {
  await createJobItem(env.DB, user, jobId, {
    description: "Front lawn",
    amountCents: 4500,
  });

  await createJobItem(env.DB, user, jobId, {
    description: "Back lawn",
    amountCents: 3500,
  });

  const result = await listJobItems(env.DB, user, jobId);

  expect(result.items).toHaveLength(2);

  expect(result.items[0]).toMatchObject({
    description: "Front lawn",
    amountCents: 4500,
  });

  expect(result.items[1]).toMatchObject({
    description: "Back lawn",
    amountCents: 3500,
  });
});

it("returns the derived total", async () => {
  await createJobItem(env.DB, user, jobId, {
    description: "Front lawn",
    amountCents: 4500,
  });

  await createJobItem(env.DB, user, jobId, {
    description: "Back lawn",
    amountCents: 3500,
  });

  const result = await listJobItems(env.DB, user, jobId);

  expect(result.totalCents).toBe(8000);
});

it("returns an empty list and zero total when there are no items", async () => {
  const result = await listJobItems(env.DB, user, jobId);

  expect(result).toEqual({
    items: [],
    totalCents: 0,
  });
});

it("only returns items for the requested job", async () => {
  const { id: otherJobId } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Other job",
    description: "Other work",
    scheduledDate: "2026-09-17",
  });

  await createJobItem(env.DB, user, jobId, {
    description: "Correct item",
    amountCents: 5000,
  });

  await createJobItem(env.DB, user, otherJobId, {
    description: "Other item",
    amountCents: 9000,
  });

  const result = await listJobItems(env.DB, user, jobId);

  expect(result.items).toHaveLength(1);
  expect(result.items[0].description).toBe("Correct item");
  expect(result.totalCents).toBe(5000);
});

it("requires read permission", async () => {
  await expect(
    listJobItems(env.DB, { ...user, role: "unknown" as "admin" }, jobId),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
