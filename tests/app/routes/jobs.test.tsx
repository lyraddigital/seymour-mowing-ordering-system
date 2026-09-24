import { env } from "cloudflare:workers";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import { loader } from "../../../app/routes/jobs";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../app/server/db/schema/jobs";
import { users } from "../../../app/server/db/schema/users";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import { startJob } from "../../../app/server/features/jobs/services/start-job.server";
import JobsPage from "../../../app/ui/features/jobs/pages/jobs-page/jobs-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();

let context: RouterContextProvider;

function args() {
  return {
    context,
    request: new Request("https://example.test/jobs"),
    url: new URL("https://example.test/jobs"),
    params: {},
    pattern: "/jobs",
  };
}

function renderJobsPage(props: ComponentProps<typeof JobsPage>) {
  const router = createMemoryRouter(
    [
      {
        path: "/jobs",
        element: <JobsPage {...props} />,
      },
    ],
    {
      initialEntries: ["/jobs"],
    },
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
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
    name: "Visible customer",
    createdAt: 1,
    updatedAt: 1,
  });
});

it("renders active jobs as a scan-friendly table", async () => {
  const { id } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Lawn service",
    description: "Mow front lawn",
    scheduledDate: "2026-09-15",
  });

  const result = await loader(args());

  expect(result.canManage).toBe(true);
  expect(result.jobs).toHaveLength(1);

  const html = renderJobsPage(result);

  expect(html).toContain("<table");
  expect(html).toContain('aria-label="Active jobs"');

  expect(html).toContain("Job");
  expect(html).toContain("Customer");
  expect(html).toContain("Scheduled");
  expect(html).toContain("Status");
  expect(html).toContain("Actions");
  expect(html).toContain("Details");

  expect(html).toContain("Lawn service");
  expect(html).toContain("Visible customer");
  expect(html).toContain("15 Sept 2026");
  expect(html).toContain("Scheduled");

  expect(html).toContain(`href="/jobs/${id}"`);
  expect(html).toContain('href="/customers/customer"');
});

it("renders the active jobs and job history tabs", async () => {
  const html = renderJobsPage(await loader(args()));

  expect(html).toContain('aria-label="Job views"');
  expect(html).toContain('href="/jobs"');
  expect(html).toContain('aria-current="page"');
  expect(html).toContain("Active jobs");

  expect(html).toContain('href="/jobs/history"');
  expect(html).toContain("Job history");
});

it("shows quick lifecycle and edit actions to managers", async () => {
  const { id } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Lawn service",
    description: "Mow front lawn",
    scheduledDate: "2026-09-15",
  });

  const html = renderJobsPage(await loader(args()));

  expect(html).toContain(`action="/jobs/${id}/start"`);
  expect(html).toContain(`action="/jobs/${id}/complete"`);

  expect(html).toContain("Start Job");
  expect(html).toContain("Complete Job");

  expect(html).toContain(`href="/jobs/${id}/edit"`);
  expect(html).toContain("Edit");

  expect(html).not.toContain(`action="/jobs/${id}/cancel"`);
  expect(html).not.toContain("Cancel Job");
});

it("shows only complete as the lifecycle action for an in-progress job", async () => {
  const { id } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Lawn service",
    description: "Mow front lawn",
    scheduledDate: "2026-09-15",
  });

  await startJob(env.DB, user, id);

  const result = await loader(args());

  expect(result.jobs[0]).toMatchObject({
    id,
    currentStatus: "in_progress",
  });

  const html = renderJobsPage(result);

  expect(html).toContain("In progress");

  expect(html).not.toContain(`action="/jobs/${id}/start"`);
  expect(html).not.toContain("Start Job");

  expect(html).toContain(`action="/jobs/${id}/complete"`);
  expect(html).toContain("Complete Job");

  expect(html).toContain(`href="/jobs/${id}/edit"`);

  expect(html).not.toContain(`action="/jobs/${id}/cancel"`);
  expect(html).not.toContain("Cancel Job");
});

it("shows the create job action to managers", async () => {
  const html = renderJobsPage(await loader(args()));

  expect(html).toContain('href="/jobs/new"');
  expect(html).toContain("New job");
});

it("allows operators to manage jobs", async () => {
  const { id } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Lawn service",
    description: "Mow front lawn",
    scheduledDate: "2026-09-15",
  });

  context.set(currentUserContext, {
    ...user,
    role: "operator",
  });

  const result = await loader(args());

  expect(result.canManage).toBe(true);

  const html = renderJobsPage(result);

  expect(html).toContain("Lawn service");
  expect(html).toContain("Visible customer");

  expect(html).toContain('href="/jobs/new"');
  expect(html).toContain("New job");

  expect(html).toContain(`action="/jobs/${id}/start"`);
  expect(html).toContain(`action="/jobs/${id}/complete"`);
  expect(html).toContain(`href="/jobs/${id}/edit"`);

  expect(html).toContain("Start Job");
  expect(html).toContain("Complete Job");
  expect(html).toContain("Edit");

  expect(html).not.toContain(`action="/jobs/${id}/cancel"`);
  expect(html).not.toContain("Cancel Job");

  expect(html).toContain('href="/jobs/history"');
});

it("renders the manager empty state", async () => {
  const result = await loader(args());

  expect(result.jobs).toEqual([]);
  expect(result.canManage).toBe(true);

  const html = renderJobsPage(result);

  expect(html).toContain("No active jobs");
  expect(html).toContain(
    "Create a job for an active customer to start planning your work.",
  );

  expect(html).toContain('href="/jobs/new"');
  expect(html).toContain("Create job");

  expect(html).toContain('href="/jobs/history"');
  expect(html).not.toContain("<table");
});

it("renders the operator empty state with a create action", async () => {
  context.set(currentUserContext, {
    ...user,
    role: "operator",
  });

  const result = await loader(args());
  const html = renderJobsPage(result);

  expect(result.jobs).toEqual([]);
  expect(result.canManage).toBe(true);

  expect(html).toContain("No active jobs");
  expect(html).toContain('href="/jobs/history"');

  expect(html).toContain('href="/jobs/new"');
  expect(html).toContain("Create job");

  expect(html).not.toContain("<table");
});

it("denies access without read permission", async () => {
  context.set(currentUserContext, {
    ...user,
    role: "unknown" as "admin",
  });

  await expect(loader(args())).rejects.toMatchObject({
    status: 403,
  });
});

it("requires the authenticated user context", async () => {
  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(loader(args())).rejects.toThrow();
});
