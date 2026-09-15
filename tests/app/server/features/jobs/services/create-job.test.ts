import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { users } from "../../../../../../app/server/db/schema/users";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { JobValidationError } from "../../../../../../app/server/features/jobs/errors/job-validation-error";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();
const input = {
  customerId: "customer",
  scheduledDate: "2026-09-15",
  name: "  Lawn service  ",
  description: " Mow lawn ",
};
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
it.each(["admin", "operator"] as const)(
  "creates a scheduled job and records the internal %s user",
  async (role) => {
    const before = Date.now();
    const { id } = await createJob(env.DB, { ...user, role }, input);
    const db = createDb(env.DB);
    const saved = await db.select().from(jobs).get();
    expect(saved).toMatchObject({
      id,
      customerId: "customer",
      scheduledDate: input.scheduledDate,
      name: "Lawn service",
      description: "Mow lawn",
    });
    expect(saved!.createdAt).toBeGreaterThanOrEqual(before);
    expect(saved!.updatedAt).toBe(saved!.createdAt);
    expect(await db.select().from(jobStatusHistory)).toEqual([
      {
        id: expect.any(String),
        jobId: id,
        status: "scheduled",
        createdByUserId: user.id,
        createdAt: saved!.createdAt,
      },
    ]);
  },
);
it.each(["nonexistent", "archived"])(
  "rejects a %s customer without either insert",
  async (state) => {
    const db = createDb(env.DB);
    if (state === "archived") await db.update(customers).set({ archivedAt: 2 });
    await expect(
      createJob(env.DB, user, {
        ...input,
        customerId: state === "nonexistent" ? "missing" : "customer",
      }),
    ).rejects.toBeInstanceOf(JobValidationError);
    expect(await db.select().from(jobs)).toEqual([]);
    expect(await db.select().from(jobStatusHistory)).toEqual([]);
  },
);
it("rolls back the job when its initial history insert fails a user foreign key", async () => {
  await expect(
    createJob(env.DB, { ...user, id: "missing-user" }, input),
  ).rejects.toThrow();
  expect(await createDb(env.DB).select().from(jobs)).toEqual([]);
  expect(await createDb(env.DB).select().from(jobStatusHistory)).toEqual([]);
});
it("validates input at the service boundary", async () => {
  await expect(
    createJob(env.DB, user, { ...input, description: " " }),
  ).rejects.toBeInstanceOf(JobValidationError);
  expect(await createDb(env.DB).select().from(jobs)).toEqual([]);
});
it.each(["", " \n\t", "x".repeat(201)])(
  "rejects invalid job name %j before writing",
  async (name) => {
    await expect(
      createJob(env.DB, user, { ...input, name }),
    ).rejects.toBeInstanceOf(JobValidationError);
    expect(await createDb(env.DB).select().from(jobs)).toEqual([]);
    expect(await createDb(env.DB).select().from(jobStatusHistory)).toEqual([]);
  },
);
it("requires permission before inserting", async () => {
  await expect(
    createJob(env.DB, { ...user, role: "unknown" as "admin" }, input),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
  expect(await createDb(env.DB).select().from(jobs)).toEqual([]);
});
