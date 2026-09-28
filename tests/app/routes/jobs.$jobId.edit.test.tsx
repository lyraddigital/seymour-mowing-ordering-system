import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import { action, loader } from "../../../app/routes/jobs.$jobId.edit";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../app/server/db/schema/jobs";
import { users } from "../../../app/server/db/schema/users";
import { getJobById } from "../../../app/server/features/jobs/queries/get-job-by-id.server";
import { cancelJob } from "../../../app/server/features/jobs/services/cancel-job.server";
import { completeJob } from "../../../app/server/features/jobs/services/complete-job.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import EditJobPage from "../../../app/ui/features/jobs/pages/edit-job-page/edit-job-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();

let context: RouterContextProvider;
let jobId: string;

function routeArgs(request: Request) {
  return {
    context,
    request,
    params: { jobId },
    url: new URL(request.url),
    pattern: "/jobs/:jobId/edit",
  };
}

function renderPage(job: Awaited<ReturnType<typeof getJobById>>) {
  if (!job) throw new Error("Expected job");

  const router = createMemoryRouter(
    [{ path: "/jobs/:jobId/edit", element: <EditJobPage job={job} /> }],
    { initialEntries: [`/jobs/${jobId}/edit`] },
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

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
  await db.insert(customers).values({
    id: "customer",
    name: "John Smith",
    createdAt: 1,
    updatedAt: 1,
  });

  ({ id: jobId } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-17",
  }));
});

it("renders operational fields without a service-price field", async () => {
  const result = await loader(
    routeArgs(new Request(`https://example.test/jobs/${jobId}/edit`)),
  );
  const html = renderPage(result.job);

  expect(html).toContain('name="name"');
  expect(html).toContain('name="description"');
  expect(html).toContain('name="scheduledDate"');
  expect(html).not.toContain('name="servicePrice"');
  expect(html).not.toContain("Service price");
  expect(html).not.toContain("Billing");
});

it("ignores a forged service price submitted through ordinary editing", async () => {
  await createDb(env.DB)
    .update(jobs)
    .set({ servicePriceCents: 10_000 })
    .where(eq(jobs.id, jobId));

  const request = new Request(`https://example.test/jobs/${jobId}/edit`, {
    method: "POST",
    body: new URLSearchParams({
      name: "Corrected front lawn",
      description: "Corrected instructions",
      scheduledDate: "2026-09-18",
      servicePrice: "999.99",
      servicePriceCents: "99999",
    }),
  });

  const response = await action(routeArgs(request));
  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(302);
  expect(await getJobById(env.DB, user, jobId)).toMatchObject({
    name: "Corrected front lawn",
    description: "Corrected instructions",
    scheduledDate: "2026-09-18",
    servicePriceCents: 10_000,
  });
});

it.each(["completed", "cancelled"] as const)(
  "rejects ordinary editing when the job is %s",
  async (status) => {
    if (status === "completed") {
      await completeJob(env.DB, user, jobId, 10_000);
    } else {
      await cancelJob(env.DB, user, jobId);
    }

    const request = new Request(`https://example.test/jobs/${jobId}/edit`, {
      method: "POST",
      body: new URLSearchParams({
        name: "Forged change",
        description: "Forged change",
        scheduledDate: "2026-09-17",
      }),
    });

    await expect(action(routeArgs(request))).rejects.toMatchObject({
      status: 409,
    });
    await expect(
      loader(routeArgs(new Request(`https://example.test/jobs/${jobId}/edit`))),
    ).rejects.toMatchObject({ status: 409 });
  },
);
