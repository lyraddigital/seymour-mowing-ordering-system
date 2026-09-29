import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
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
import { invoiceItems } from "../../../app/server/db/schema/invoice-items";
import { invoiceJobs } from "../../../app/server/db/schema/invoice-jobs";
import { invoices } from "../../../app/server/db/schema/invoices";
import { jobItems } from "../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../app/server/db/schema/jobs";
import { payments } from "../../../app/server/db/schema/payments";
import { users } from "../../../app/server/db/schema/users";
import { cancelJob } from "../../../app/server/features/jobs/services/cancel-job.server";
import { startJob } from "../../../app/server/features/jobs/services/start-job.server";
import JobsPage from "../../../app/ui/features/jobs/pages/jobs-page/jobs-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();
const completedAt = Date.UTC(2026, 8, 18, 1);

let context: RouterContextProvider;

function args(url = "https://example.test/jobs") {
  return {
    context,
    request: new Request(url),
    url: new URL(url),
    params: {},
    pattern: "/jobs",
  };
}

function renderJobsPage(props: ComponentProps<typeof JobsPage>) {
  const router = createMemoryRouter(
    [{ path: "/jobs", element: <JobsPage {...props} /> }],
    { initialEntries: [`/jobs?status=${props.status}`] },
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

beforeEach(async () => {
  context = new RouterContextProvider();
  context.set(currentUserContext, user);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });

  const db = createDb(env.DB);
  await db.delete(payments);
  await db.delete(invoiceItems);
  await db.delete(invoiceJobs);
  await db.delete(invoices);
  await db.delete(jobItems);
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

async function createNamedJob(id: string, name: string) {
  const db = createDb(env.DB);
  await db.insert(jobs).values({
    id,
    customerId: "customer",
    name,
    description: "Mow front lawn",
    scheduledDate: "2026-09-15",
    createdAt: 1,
    updatedAt: 1,
  });
  await db.insert(jobStatusHistory).values({
    id: `scheduled-${id}`,
    jobId: id,
    status: "scheduled",
    createdByUserId: user.id,
    createdAt: 1,
  });
}

async function markCompleted(id: string, name: string) {
  await createNamedJob(id, name);
  const db = createDb(env.DB);
  await db
    .update(jobs)
    .set({ servicePriceCents: 12_300 })
    .where(eq(jobs.id, id));
  await db.insert(jobStatusHistory).values({
    id: `completed-${id}`,
    jobId: id,
    status: "completed",
    createdByUserId: user.id,
    createdAt: completedAt,
  });
}

it("defaults /jobs to Scheduled and excludes non-scheduled Jobs", async () => {
  await createNamedJob("scheduled", "Scheduled lawn service");
  await createNamedJob("progress", "Started lawn service");
  await startJob(env.DB, user, "progress");

  const result = await loader(args());

  expect(result.status).toBe("scheduled");
  expect(result.jobs).toMatchObject([
    { id: "scheduled", currentStatus: "scheduled" },
  ]);

  const html = renderJobsPage(result);
  expect(html).toContain('aria-label="Scheduled jobs"');
  expect(html).toContain("Scheduled lawn service");
  expect(html).not.toContain("Started lawn service");
});

it.each([
  ["scheduled", "Scheduled"],
  ["in_progress", "In progress"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const)(
  "loads and marks the %s status view active",
  async (status, label) => {
    const result = await loader(
      args(`https://example.test/jobs?status=${status}`),
    );
    const html = renderJobsPage(result);

    expect(result.status).toBe(status);
    expect(html).toContain(`aria-current="page" href="/jobs?status=${status}"`);
    expect(html).toContain(label);
  },
);

it("renders links for all four bookmarkable status views", async () => {
  const html = renderJobsPage(await loader(args()));

  expect(html).toContain('aria-label="Job status views"');
  expect(html).toContain('href="/jobs?status=scheduled"');
  expect(html).toContain('href="/jobs?status=in_progress"');
  expect(html).toContain('href="/jobs?status=completed"');
  expect(html).toContain('href="/jobs?status=cancelled"');
});

it("normalises an invalid status to Scheduled without passing it to the query", async () => {
  await createNamedJob("scheduled", "Scheduled lawn service");

  const result = await loader(
    args("https://example.test/jobs?status=invoiced"),
  );

  expect(result.status).toBe("scheduled");
  expect(result.jobs).toMatchObject([{ id: "scheduled" }]);
});

it("shows completed date, final Job total, and ready-to-invoice state", async () => {
  await markCompleted("ready", "Ready lawn service");
  const db = createDb(env.DB);
  await db.insert(jobItems).values({
    id: "charge",
    jobId: "ready",
    description: "Green waste",
    quantity: 3,
    unitPriceCents: 2_345,
    createdAt: 1,
    updatedAt: 1,
  });

  const result = await loader(
    args("https://example.test/jobs?status=completed"),
  );
  const html = renderJobsPage(result);

  expect(result.jobs).toMatchObject([
    { id: "ready", statusChangedAt: completedAt, totalCents: 19_335 },
  ]);
  expect(html).toContain("Ready lawn service");
  expect(html).toContain("Visible customer");
  expect(html).toContain("18 Sept 2026");
  expect(html).toContain("$193.35");
  expect(html).toContain("Ready to invoice");
});

it("keeps an allocated Job in Completed and links its invoice", async () => {
  await markCompleted("allocated", "Allocated lawn service");
  const db = createDb(env.DB);
  await db.insert(invoices).values({
    id: "invoice",
    customerId: "customer",
    status: "draft",
    createdAt: 1,
    updatedAt: 1,
  });
  await db.insert(invoiceJobs).values({
    invoiceId: "invoice",
    jobId: "allocated",
    completedAt,
  });

  const result = await loader(
    args("https://example.test/jobs?status=completed"),
  );
  const html = renderJobsPage(result);

  expect(result.jobs).toMatchObject([
    { id: "allocated", currentStatus: "completed", invoiceId: "invoice" },
  ]);
  expect(html).toContain("Allocated lawn service");
  expect(html).toContain('href="/invoices/invoice"');
  expect(html).toContain("Draft invoice");
  expect(html).not.toContain("Ready to invoice");
});

it("shows cancelled Jobs only in Cancelled with their cancellation date", async () => {
  await createNamedJob("cancelled", "Cancelled lawn service");
  await cancelJob(env.DB, user, "cancelled");

  const cancelled = await loader(
    args("https://example.test/jobs?status=cancelled"),
  );
  const completed = await loader(
    args("https://example.test/jobs?status=completed"),
  );

  expect(cancelled.jobs).toMatchObject([
    { id: "cancelled", currentStatus: "cancelled" },
  ]);
  expect(completed.jobs).toEqual([]);

  const html = renderJobsPage(cancelled);
  expect(html).toContain("Cancelled lawn service");
  expect(html).toContain("Cancelled");
  expect(html).not.toContain("Ready to invoice");
});

it("preserves lifecycle and edit actions on operational views", async () => {
  await createNamedJob("scheduled", "Lawn service");
  const html = renderJobsPage(await loader(args()));

  expect(html).toContain('action="/jobs/scheduled/start"');
  expect(html).toContain('action="/jobs/scheduled/complete"');
  expect(html).toContain('href="/jobs/scheduled/edit"');
});

it("allows operators to use the Jobs workspace", async () => {
  await createNamedJob("scheduled", "Operator lawn service");
  context.set(currentUserContext, { ...user, role: "operator" });

  const result = await loader(args());
  const html = renderJobsPage(result);

  expect(result.canManage).toBe(true);
  expect(html).toContain("Operator lawn service");
  expect(html).toContain('href="/jobs/new"');
  expect(html).toContain('action="/jobs/scheduled/start"');
});

it.each(["scheduled", "in_progress", "completed", "cancelled"] as const)(
  "renders the %s empty state",
  async (status) => {
    const html = renderJobsPage(
      await loader(args(`https://example.test/jobs?status=${status}`)),
    );

    expect(html).toContain("No ");
    expect(html).not.toContain("<table");
  },
);

it("denies access without read permission", async () => {
  context.set(currentUserContext, { ...user, role: "unknown" as "admin" });

  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
});

it("requires the authenticated user context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });

  await expect(loader(args())).rejects.toThrow();
});
