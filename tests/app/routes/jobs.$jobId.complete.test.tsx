import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { RouterContextProvider } from "react-router";
import { action } from "../../../app/routes/jobs.$jobId.complete";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { users } from "../../../app/server/db/schema/users";
import { jobs } from "../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import { completeJob } from "../../../app/server/features/jobs/services/complete-job.server";
import { cancelJob } from "../../../app/server/features/jobs/services/cancel-job.server";
import { getJobById } from "../../../app/server/features/jobs/queries/get-job-by-id.server";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();
let context: RouterContextProvider;
let jobId: string;
const submit = (id = jobId, method = "POST") => {
  const url = `https://example.test/jobs/${id}/complete`;
  return action({
    context,
    params: { jobId: id },
    request: new Request(url, {
      method,
      ...(method === "POST"
        ? {
            body: new URLSearchParams({
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
});
it("performs the dedicated operation and redirects to job detail despite forged form values", async () => {
  const response = await submit();
  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe(`/jobs/${jobId}`);
  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    currentStatus: "completed",
  });
});
it("returns 404 for an unknown job", async () => {
  await expect(submit("missing")).rejects.toMatchObject({ status: 404 });
});
it.each([completeJob, cancelJob])(
  "returns 409 after an earlier transition",
  async (operation) => {
    await operation(env.DB, user, jobId);
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
