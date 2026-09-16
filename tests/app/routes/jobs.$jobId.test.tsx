import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import {
  createMemoryRouter,
  RouterProvider,
  RouterContextProvider,
} from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "../../../app/routes/jobs.$jobId";
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
import JobPage from "../../../app/ui/features/jobs/pages/job-page/job-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();
function renderPage(props: Parameters<typeof JobPage>[0]) {
  const router = createMemoryRouter(
    [{ path: "/jobs/:jobId", element: <JobPage {...props} /> }],
    { initialEntries: [`/jobs/${props.job.id}`] },
  );
  return renderToStaticMarkup(<RouterProvider router={router} />);
}
let context: RouterContextProvider;
let jobId: string;
const args = (id = jobId) => ({
  context,
  request: new Request(`https://example.test/jobs/${id}`),
  url: new URL(`https://example.test/jobs/${id}`),
  params: { jobId: id },
  pattern: "/jobs/:jobId",
});
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
    .values({ id: "customer", name: "John Smith", createdAt: 1, updatedAt: 1 });
  jobId = (
    await createJob(env.DB, user, {
      name: "Front & Back Lawn Mow",
      customerId: "customer",
      description: "Mow lawns, edge paths and blow down.",
      scheduledDate: "2026-09-17",
    })
  ).id;
});
it.each(["admin", "operator"] as const)(
  "renders job details and dedicated transition forms for an authorized %s",
  async (role) => {
    context.set(currentUserContext, { ...user, role });
    const result = await loader(args());
    expect(result.canManage).toBe(true);
    const html = renderPage(result);
    expect(html).toContain(
      '<h1 class="page-title">Front &amp; Back Lawn Mow</h1>',
    );
    expect(html).toContain('href="/customers/customer"');
    expect(html).toContain("John Smith");
    expect(html).toContain("17 September 2026");
    expect(html).toContain("scheduled");
    expect(html).toContain("Mow lawns, edge paths and blow down.");
    expect(html).toContain('href="/jobs"');
    expect(html).toContain(`action="/jobs/${jobId}/complete"`);
    expect(html).toContain(`action="/jobs/${jobId}/cancel"`);
    expect(html).toContain("Complete Job");
    expect(html).toContain("<summary>Cancel Job</summary>");
    expect(html).toContain("Confirm cancellation");
    expect(html).toContain(`/jobs/${jobId}/edit`);
    expect(html).toContain("No items have been added yet.");
  },
);
it.each([
  ["completed", completeJob],
  ["cancelled", cancelJob],
] as const)(
  "shows %s without transition controls",
  async (status, operation) => {
    await operation(env.DB, user, jobId);
    const html = renderPage(await loader(args()));
    expect(html).toContain(status);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Complete Job");
    expect(html).not.toContain("Cancel Job");
  },
);
it("hides transition controls when management is not allowed", async () => {
  const html = renderPage({ ...(await loader(args())), canManage: false });
  expect(html).not.toContain("<form");
});
it("returns 404 for an unknown job", async () => {
  await expect(loader(args("missing"))).rejects.toMatchObject({ status: 404 });
});
it("requires read permission", async () => {
  context.set(currentUserContext, { ...user, role: "unknown" as "admin" });
  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
});
it("requires the authenticated user context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await expect(loader(args())).rejects.toThrow();
});
