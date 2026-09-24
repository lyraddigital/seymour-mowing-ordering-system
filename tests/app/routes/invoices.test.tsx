import { env } from "cloudflare:workers";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import { loader } from "../../../app/routes/invoices";
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
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { createJobItem } from "../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import InvoicesPage from "../../../app/ui/features/invoices/pages/invoices-page/invoices-page";
import { internalUser } from "../../support/fixtures/internal-user";

const admin = internalUser();

let context: RouterContextProvider;
let firstJobId: string;
let secondJobId: string;

function args() {
  return {
    context,
    request: new Request("https://example.test/invoices"),
    url: new URL("https://example.test/invoices"),
    params: {},
    pattern: "/invoices",
  };
}

function renderPage(result: Awaited<ReturnType<typeof loader>>) {
  const router = createMemoryRouter(
    [
      {
        path: "/invoices",
        element: (
          <InvoicesPage
            invoices={result.invoices}
            canManage={result.canManage}
          />
        ),
      },
    ],
    {
      initialEntries: ["/invoices"],
    },
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

beforeEach(async () => {
  context = new RouterContextProvider();

  context.set(currentUserContext, admin);
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

  await db.insert(users).values(admin);

  await db.insert(customers).values({
    id: "customer",
    name: "John Smith",
    createdAt: 1,
    updatedAt: 1,
  });

  ({ id: firstJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-17",
  }));

  ({ id: secondJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow back lawn",
    scheduledDate: "2026-09-18",
  }));
});

it("renders invoices as a scan-friendly table", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await loader(args());
  const html = renderPage(result);

  expect(result.canManage).toBe(true);

  expect(html).toContain("<table");
  expect(html).toContain("Invoice");
  expect(html).toContain("Customer");
  expect(html).toContain("Jobs");
  expect(html).toContain("Status");
  expect(html).toContain("Due");
  expect(html).toContain("Total");

  expect(html).toContain("Draft invoice");
  expect(html).toContain("John Smith");
  expect(html).toContain("Front lawn");
  expect(html).toContain("Draft");
  expect(html).toContain("$45.00");

  expect(html).toContain(`href="/invoices/${invoiceId}"`);
  expect(html).toContain('href="/customers/customer"');
  expect(html).toContain(`href="/jobs/${firstJobId}"`);
});

it("shows all jobs belonging to a multi-job invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const html = renderPage(await loader(args()));

  expect(html).toContain("Front lawn");
  expect(html).toContain("Back lawn");

  expect(html).toContain(`href="/jobs/${firstJobId}"`);
  expect(html).toContain(`href="/jobs/${secondJobId}"`);

  expect(html).toContain(`href="/invoices/${invoiceId}"`);
});

it("shows the invoice number and due date after issue", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  const result = await loader(args());

  expect(result.invoices[0]).toMatchObject({
    id: invoiceId,
    invoiceNumber: "INV-000001",
    status: "issued",
    dueDate: "2026-10-01",
  });

  const html = renderPage(result);

  expect(html).toContain("INV-000001");
  expect(html).toContain("Issued");
  expect(html).toContain("1 Oct 2026");
});

it("shows no due date for a draft invoice", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const html = renderPage(await loader(args()));

  expect(html).toContain("Draft invoice");
  expect(html).toContain("Draft");
  expect(html).not.toContain("1 Oct 2026");
});

it("shows the create invoice action to managers", async () => {
  const html = renderPage(await loader(args()));

  expect(html).toContain('href="/invoices/new"');
  expect(html).toContain("Create invoice");
});

it("hides the create invoice action from operators", async () => {
  context.set(currentUserContext, {
    ...admin,
    role: "operator",
  });

  const result = await loader(args());

  expect(result.canManage).toBe(false);

  const html = renderPage(result);

  expect(html).not.toContain('href="/invoices/new"');
  expect(html).not.toContain("Create invoice");
});

it("renders the empty state", async () => {
  const result = await loader(args());
  const html = renderPage(result);

  expect(result.invoices).toEqual([]);

  expect(html).toContain("No invoices yet");
  expect(html).toContain(
    "Create an invoice from completed work when you are ready to bill a customer.",
  );

  expect(html).toContain('href="/invoices/new"');
  expect(html).toContain("Create invoice");

  expect(html).not.toContain("<table");
});

it("renders the operator empty state without a create action", async () => {
  context.set(currentUserContext, {
    ...admin,
    role: "operator",
  });

  const html = renderPage(await loader(args()));

  expect(html).toContain("No invoices yet");
  expect(html).not.toContain('href="/invoices/new"');
  expect(html).not.toContain("Create invoice");
});

it("returns 403 without invoice read permission", async () => {
  context.set(currentUserContext, {
    ...admin,
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
