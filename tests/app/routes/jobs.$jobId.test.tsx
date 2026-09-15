import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { MemoryRouter, RouterContextProvider } from "react-router";
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
import JobPage from "../../../app/ui/features/jobs/pages/job-page/job-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();
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
  "renders read-only job details for an authorized %s",
  async (role) => {
    context.set(currentUserContext, { ...user, role });
    const { job } = await loader(args());
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <JobPage job={job} />
      </MemoryRouter>,
    );
    expect(html).toContain(
      '<h1 class="page-title">Front &amp; Back Lawn Mow</h1>',
    );
    expect(html).toContain('href="/customers/customer"');
    expect(html).toContain("John Smith");
    expect(html).toContain("17 September 2026");
    expect(html).toContain("scheduled");
    expect(html).toContain("Mow lawns, edge paths and blow down.");
    expect(html).toContain('href="/jobs"');
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("/edit");
  },
);
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
