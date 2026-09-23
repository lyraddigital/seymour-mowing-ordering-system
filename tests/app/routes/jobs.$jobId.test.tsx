import { env } from "cloudflare:workers";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import { loader } from "../../../app/routes/jobs.$jobId";
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
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import { cancelJob } from "../../../app/server/features/jobs/services/cancel-job.server";
import { completeJob } from "../../../app/server/features/jobs/services/complete-job.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import JobPage from "../../../app/ui/features/jobs/pages/job-page/job-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();

let context: RouterContextProvider;
let jobId: string;

function renderPage(props: Parameters<typeof JobPage>[0]) {
  const router = createMemoryRouter(
    [
      {
        path: "/jobs/:jobId",
        element: <JobPage {...props} />,
      },
    ],
    {
      initialEntries: [`/jobs/${props.job.id}`],
    },
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

function args(id = jobId) {
  return {
    context,
    request: new Request(`https://example.test/jobs/${id}`),
    url: new URL(`https://example.test/jobs/${id}`),
    params: {
      jobId: id,
    },
    pattern: "/jobs/:jobId",
  };
}

beforeEach(async () => {
  context = new RouterContextProvider();

  context.set(currentUserContext, user);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

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
    name: "John Smith",
    createdAt: 1,
    updatedAt: 1,
  });

  jobId = (
    await createJob(env.DB, user, {
      name: "Front & Back Lawn Mow",
      customerId: "customer",
      description: "Mow lawns, edge paths and blow down.",
      scheduledDate: "2026-09-17",
    })
  ).id;
});

it("renders the job detail hierarchy for an administrator", async () => {
  const result = await loader(args());

  expect(result.canManage).toBe(true);
  expect(result.invoice).toBeNull();
  expect(result.canCreateInvoice).toBe(true);

  const html = renderPage(result);

  expect(html).toContain(
    '<h1 class="page-title">Front &amp; Back Lawn Mow</h1>',
  );

  expect(html).toContain("Scheduled");
  expect(html).toContain('href="/customers/customer"');
  expect(html).toContain("John Smith");
  expect(html).toContain("17 September 2026");
  expect(html).toContain("Mow lawns, edge paths and blow down.");

  expect(html).toContain('href="/jobs"');
  expect(html).toContain(`href="/jobs/${jobId}/edit"`);

  expect(html).toContain(`action="/jobs/${jobId}/start"`);
  expect(html).toContain(`action="/jobs/${jobId}/complete"`);
  expect(html).toContain("Start Job");
  expect(html).toContain("Complete Job");

  expect(html).toContain("Items");
  expect(html).toContain("No items have been added yet.");

  expect(html).toContain("Invoice");
  expect(html).toContain("This job has not been added to an invoice yet.");
  expect(html).toContain(`href="/invoices/new?jobId=${jobId}"`);
  expect(html).toContain("Create invoice");

  expect(html).toContain("Danger zone");
  expect(html).toContain("<summary>Cancel Job</summary>");
  expect(html).toContain(`action="/jobs/${jobId}/cancel"`);
  expect(html).toContain("Confirm cancellation");
});

it("shows the active invoice relationship instead of create invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, user, {
    jobIds: [jobId],
  });

  const result = await loader(args());

  expect(result.invoice).toEqual({
    id: invoiceId,
    invoiceNumber: null,
    status: "draft",
  });
  expect(result.canCreateInvoice).toBe(false);

  const html = renderPage(result);

  expect(html).toContain("Invoice");
  expect(html).toContain("Draft invoice");
  expect(html).toContain("Draft");
  expect(html).toContain("This job is currently assigned to this invoice.");
  expect(html).toContain(`href="/invoices/${invoiceId}"`);
  expect(html).toContain("View invoice");

  expect(html).not.toContain(`href="/invoices/new?jobId=${jobId}"`);
  expect(html).not.toContain("Create invoice");
});

it("shows an invoice relationship to an operator but not invoice creation", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, user, {
    jobIds: [jobId],
  });

  context.set(currentUserContext, {
    ...user,
    role: "operator",
  });

  const result = await loader(args());

  expect(result.canManage).toBe(true);
  expect(result.canCreateInvoice).toBe(false);
  expect(result.invoice).toEqual({
    id: invoiceId,
    invoiceNumber: null,
    status: "draft",
  });

  const html = renderPage(result);

  expect(html).toContain("Draft invoice");
  expect(html).toContain(`href="/invoices/${invoiceId}"`);
  expect(html).not.toContain("Create invoice");
});

it("does not offer invoice creation to an operator", async () => {
  context.set(currentUserContext, {
    ...user,
    role: "operator",
  });

  const result = await loader(args());

  expect(result.canManage).toBe(true);
  expect(result.canCreateInvoice).toBe(false);
  expect(result.invoice).toBeNull();

  const html = renderPage(result);

  expect(html).toContain("Start Job");
  expect(html).toContain("Complete Job");
  expect(html).toContain("Danger zone");
  expect(html).toContain("Cancel Job");

  expect(html).not.toContain("Create invoice");
});

it.each([
  ["completed", completeJob],
  ["cancelled", cancelJob],
] as const)(
  "shows a %s job without lifecycle controls or danger zone",
  async (status, operation) => {
    await operation(env.DB, user, jobId);

    const result = await loader(args());
    const html = renderPage(result);

    expect(html).toContain(status === "completed" ? "Completed" : "Cancelled");

    expect(html).not.toContain(`action="/jobs/${jobId}/start"`);
    expect(html).not.toContain(`action="/jobs/${jobId}/complete"`);
    expect(html).not.toContain(`action="/jobs/${jobId}/cancel"`);

    expect(html).not.toContain("Start Job");
    expect(html).not.toContain("Complete Job");
    expect(html).not.toContain("Cancel Job");
    expect(html).not.toContain("Danger zone");

    expect(html).toContain(`href="/jobs/${jobId}/edit"`);
  },
);

it("hides management controls when job management is not allowed", async () => {
  const result = await loader(args());

  const html = renderPage({
    ...result,
    canManage: false,
    canCreateInvoice: false,
  });

  expect(html).not.toContain(`href="/jobs/${jobId}/edit"`);
  expect(html).not.toContain(`action="/jobs/${jobId}/start"`);
  expect(html).not.toContain(`action="/jobs/${jobId}/complete"`);
  expect(html).not.toContain(`action="/jobs/${jobId}/cancel"`);

  expect(html).not.toContain("Start Job");
  expect(html).not.toContain("Complete Job");
  expect(html).not.toContain("Cancel Job");
  expect(html).not.toContain("Danger zone");
  expect(html).not.toContain("Create invoice");
});

it("returns 404 for an unknown job", async () => {
  await expect(loader(args("missing"))).rejects.toMatchObject({
    status: 404,
  });
});

it("requires read permission", async () => {
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
