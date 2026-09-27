import { env } from "cloudflare:workers";
import { RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";

import { action } from "../../../app/routes/jobs.$jobId.reopen";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../app/server/db/schema/jobs";
import { users } from "../../../app/server/db/schema/users";
import { getJobById } from "../../../app/server/features/jobs/queries/get-job-by-id.server";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();

let context: RouterContextProvider;
let jobId: string;

function submit(id = jobId, method = "POST") {
  const url = `https://example.test/jobs/${id}/reopen`;

  return action({
    context,
    params: {
      jobId: id,
    },
    request: new Request(url, {
      method,
      ...(method === "POST"
        ? {
            body: new URLSearchParams({
              status: "scheduled",
              createdByUserId: "forged",
            }),
          }
        : {}),
    }),
    url: new URL(url),
    pattern: "/jobs/:jobId/reopen",
  });
}

beforeEach(async () => {
  context = new RouterContextProvider();

  context.set(currentUserContext, user);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

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

  jobId = "job";

  await db.insert(jobs).values({
    id: jobId,
    customerId: "customer",
    name: "Lawn service",
    description: "Mow lawn",
    scheduledDate: "2026-09-17",
    servicePriceCents: 10_000,
    createdAt: 1,
    updatedAt: 1,
  });

  await db.insert(jobStatusHistory).values([
    {
      id: "scheduled",
      jobId,
      status: "scheduled",
      createdByUserId: user.id,
      createdAt: 1,
    },
    {
      id: "completed",
      jobId,
      status: "completed",
      createdByUserId: user.id,
      createdAt: 2,
    },
  ]);
});

it("reopens the job and redirects to job detail despite forged form values", async () => {
  const response = await submit();

  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe(`/jobs/${jobId}`);

  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "in_progress",
  });
});

it("returns 404 for an unknown job", async () => {
  await expect(submit("missing")).rejects.toMatchObject({
    status: 404,
  });
});

it("returns 409 when the job is no longer completed", async () => {
  await submit();

  await expect(submit()).rejects.toMatchObject({
    status: 409,
  });
});

it("requires authorization", async () => {
  context.set(currentUserContext, {
    ...user,
    role: "unknown" as "admin",
  });

  await expect(submit()).rejects.toMatchObject({
    status: 403,
  });
});

it("requires authenticated user context", async () => {
  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(submit()).rejects.toThrow();

  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "completed",
  });
});

it.each(["GET", "PUT", "PATCH", "DELETE"])(
  "rejects %s with 405",
  async (method) => {
    await expect(submit(jobId, method)).rejects.toMatchObject({
      status: 405,
    });
  },
);
