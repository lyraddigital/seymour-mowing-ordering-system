import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { MemoryRouter, RouterContextProvider } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "../../../app/routes/jobs";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { users } from "../../../app/server/db/schema/users";
import { jobs } from "../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import JobsPage from "../../../app/ui/features/jobs/pages/jobs-page/jobs-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();
let context: RouterContextProvider;
const args = () => ({
  context,
  request: new Request("https://example.test/jobs"),
  url: new URL("https://example.test/jobs"),
  params: {},
  pattern: "/jobs",
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
  await db.insert(customers).values({
    id: "customer",
    name: "Visible customer",
    createdAt: 1,
    updatedAt: 1,
  });
});
it("renders list-ready loader data and a creation link", async () => {
  const { id } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Lawn service",
    description: "Mow front lawn",
    scheduledDate: "2026-09-15",
  });
  const result = await loader(args());
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <JobsPage jobs={result.jobs} />
    </MemoryRouter>,
  );
  expect(html).toContain("Visible customer");
  expect(html).toMatch(
    new RegExp(`<h2[^>]*><a[^>]*href="/jobs/${id}"[^>]*>Lawn service</a></h2>`),
  );
  expect(html).toMatch(
    /<p[^>]*><a[^>]*href="\/customers\/customer"[^>]*>Visible customer<\/a><\/p>/,
  );
  expect(html).toContain("Mow front lawn");
  expect(html).toContain('dateTime="2026-09-15"');
  expect(html).toContain("scheduled");
  expect(html).toContain('href="/jobs/new"');
});
it("renders the empty state", async () => {
  const result = await loader(args());
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <JobsPage jobs={result.jobs} />
    </MemoryRouter>,
  );
  expect(html).toContain("No active jobs");
  expect(html).toContain("Create job");
});
it("denies access without read permission", async () => {
  context.set(currentUserContext, { ...user, role: "unknown" as "admin" });
  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
});
it("requires the authenticated user context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await expect(loader(args())).rejects.toThrow();
});
