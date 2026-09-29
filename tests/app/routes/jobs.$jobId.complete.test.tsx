import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";
import {
  action,
  loader,
  shouldRevalidate,
} from "../../../app/routes/jobs.$jobId.complete";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { users } from "../../../app/server/db/schema/users";
import { jobs } from "../../../app/server/db/schema/jobs";
import { jobItems } from "../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import { completeJob } from "../../../app/server/features/jobs/services/complete-job.server";
import { cancelJob } from "../../../app/server/features/jobs/services/cancel-job.server";
import { getJobById } from "../../../app/server/features/jobs/queries/get-job-by-id.server";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();
let context: RouterContextProvider;
let jobId: string;

const submit = (id = jobId, method = "POST", servicePrice = "125.50") => {
  const url = `https://example.test/jobs/${id}/complete`;

  return action({
    context,
    params: { jobId: id },
    request: new Request(url, {
      method,
      ...(method === "POST"
        ? {
            body: new URLSearchParams({
              servicePrice,
              status: "cancelled",
              createdByUserId: "forged",
            }),
          }
        : {}),
    }),
    url: new URL(url),
    pattern: "/jobs/:jobId/complete",
  });
};

beforeEach(async () => {
  context = new RouterContextProvider();
  context.set(currentUserContext, user);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });

  const db = createDb(env.DB);

  await db.delete(jobItems);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);

  await db.insert(users).values(user);

  await db
    .insert(customers)
    .values({ id: "customer", name: "Customer", createdAt: 1, updatedAt: 1 });

  jobId = (
    await createJob(env.DB, user, {
      name: "Lawn service",
      customerId: "customer",
      description: "Mow lawn",
      scheduledDate: "2026-09-17",
    })
  ).id;

  await db
    .update(jobs)
    .set({ servicePriceCents: 10_000 })
    .where(eq(jobs.id, jobId));
});

it("performs the dedicated operation and redirects to job detail despite forged form values", async () => {
  const response = await submit();

  if (!(response instanceof Response)) throw new Error("Expected redirect");
  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe(`/jobs/${jobId}`);

  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "completed",
    servicePriceCents: 12550,
  });
});

it("does not revalidate the billing-review loader after a successful completion redirect", () => {
  expect(shouldRevalidate()).toBe(false);
});

it("returns 404 for an unknown job", async () => {
  await expect(submit("missing")).rejects.toMatchObject({ status: 404 });
});

it.each([completeJob, cancelJob])(
  "returns 409 after an earlier transition",
  async (operation) => {
    await operation(env.DB, user, jobId, 10_000);

    await expect(submit()).rejects.toMatchObject({ status: 409 });
  },
);

it("requires authorization", async () => {
  context.set(currentUserContext, { ...user, role: "unknown" as "admin" });

  await expect(submit()).rejects.toMatchObject({ status: 403 });
});

it("requires authenticated user context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });

  await expect(submit()).rejects.toThrow();

  expect(await createDb(env.DB).select().from(jobStatusHistory)).toHaveLength(
    1,
  );
});

it.each(["GET", "PUT", "PATCH", "DELETE"])(
  "rejects %s with 405",
  async (method) => {
    await expect(submit(jobId, method)).rejects.toMatchObject({ status: 405 });
  },
);

it.each(["", " ", "-1", "abc", "1.234", "1e2", "Infinity", "9007199254740992"])(
  "returns validation data preserving %j",
  async (servicePrice) => {
    const response = await submit(jobId, "POST", servicePrice);
    if (response instanceof Response)
      throw new Error("Expected validation data");
    expect(response.init?.status).toBe(400);
    expect(response.data).toMatchObject({
      servicePrice,
      error: expect.any(String),
    });
    expect(await getJobById(env.DB, user, jobId)).toMatchObject({
      currentStatus: "scheduled",
      servicePriceCents: 10000,
    });
  },
);

it("loads current billing for review with server-side authorization", async () => {
  await createDb(env.DB).insert(jobItems).values({
    id: "charge",
    jobId,
    description: "Green waste disposal",
    amountCents: 2_500,
    createdAt: 1,
    updatedAt: 1,
  });
  const url = `https://example.test/jobs/${jobId}/complete`;
  const args = {
    context,
    params: { jobId },
    request: new Request(url),
    url: new URL(url),
    pattern: "/jobs/:jobId/complete",
  };
  expect(await loader(args)).toMatchObject({
    job: { servicePriceCents: 10_000 },
    charges: {
      items: [{ description: "Green waste disposal", amountCents: 2_500 }],
      totalCents: 2_500,
    },
  });
  context.set(currentUserContext, { ...user, role: "unknown" as "admin" });
  await expect(loader(args)).rejects.toMatchObject({ status: 403 });
});
