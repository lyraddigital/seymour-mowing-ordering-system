import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { MemoryRouter, RouterContextProvider } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "../../../app/routes/jobs.history";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { users } from "../../../app/server/db/schema/users";
import { jobs } from "../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import JobHistoryPage from "../../../app/ui/features/jobs/pages/job-history-page/job-history-page";
import { internalUser } from "../../support/fixtures/internal-user";
import { completeJob } from "../../../app/server/features/jobs/services/complete-job.server";
import { cancelJob } from "../../../app/server/features/jobs/services/cancel-job.server";

const user = internalUser();
let context: RouterContextProvider;
const args = () => ({
  context,
  request: new Request("https://example.test/jobs/history"),
  url: new URL("https://example.test/jobs/history"),
  params: {},
  pattern: "/jobs/history",
});
it.each(["admin", "operator"] as const)(
  "loads and renders completed and cancelled jobs for an authorized %s",
  async (role) => {
    context.set(currentUserContext, { ...user, role });
    for (const [name, operation] of [
      ["Completed lawn service", completeJob],
      ["Cancelled lawn service", cancelJob],
    ] as const) {
      const { id } = await createJob(env.DB, user, {
        customerId: "customer",
        name,
        description: "Mow front lawn",
        scheduledDate: "2026-09-17",
      });
      await operation(env.DB, user, id);
    }
    await createJob(env.DB, user, {
      customerId: "customer",
      name: "Scheduled lawn service",
      description: "Mow front lawn",
      scheduledDate: "2026-09-17",
    });
    const result = await loader(args());
    expect(result.jobs).toHaveLength(2);
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <JobHistoryPage jobs={result.jobs} />
      </MemoryRouter>,
    );
    expect(html).toContain('aria-label="Job history"');
    expect(html).toContain("completed");
    expect(html).toContain("cancelled");
    expect(html).not.toContain("Scheduled lawn service");
    for (const job of result.jobs) {
      expect(html).toMatch(
        new RegExp(
          `<h2[^>]*><a[^>]*href="/jobs/${job.id}"[^>]*>${job.name}</a></h2>`,
        ),
      );
    }
    expect(html).toMatch(
      /<p[^>]*><a[^>]*href="\/customers\/customer"[^>]*>Visible customer<\/a><\/p>/,
    );
    expect(html).toContain('dateTime="2026-09-17"');
    expect(html).toContain("Mow front lawn");
    expect(html).toContain('href="/jobs"');
  },
);
it("renders an empty history with a way back to active jobs", async () => {
  const result = await loader(args());
  expect(result.jobs).toEqual([]);
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <JobHistoryPage jobs={result.jobs} />
    </MemoryRouter>,
  );
  expect(html).toContain("No completed or cancelled jobs yet");
  expect(html).toContain('href="/jobs"');
});
it("enforces authorization", async () => {
  context.set(currentUserContext, { ...user, role: "unknown" as "admin" });
  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
});
it("requires authenticated user context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await expect(loader(args())).rejects.toThrow();
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
