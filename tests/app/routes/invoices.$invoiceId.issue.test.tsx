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

import { action, loader } from "../../../app/routes/invoices.$invoiceId.issue";
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
import { users } from "../../../app/server/db/schema/users";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { createJobItem } from "../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import IssueInvoicePage from "../../../app/ui/features/invoices/pages/issue-invoice-page/issue-invoice-page";
import { internalUser } from "../../support/fixtures/internal-user";

const admin = internalUser();

let context: RouterContextProvider;
let jobId: string;
let invoiceId: string;

function loaderArgs(id = invoiceId) {
  return {
    context,
    request: new Request(`https://example.test/invoices/${id}/issue`),
    url: new URL(`https://example.test/invoices/${id}/issue`),
    params: {
      invoiceId: id,
    },
    pattern: "/invoices/:invoiceId/issue",
  };
}

function actionArgs(dueDate: string | undefined, id = invoiceId) {
  const body = new URLSearchParams();

  if (dueDate !== undefined) {
    body.set("dueDate", dueDate);
  }

  return {
    ...loaderArgs(id),
    request: new Request(`https://example.test/invoices/${id}/issue`, {
      method: "POST",
      body,
    }),
  };
}

function renderPage(props: ComponentProps<typeof IssueInvoicePage>) {
  const router = createMemoryRouter(
    [
      {
        path: "/invoices/:invoiceId/issue",
        element: <IssueInvoicePage {...props} />,
      },
    ],
    {
      initialEntries: [`/invoices/${props.invoice.id}/issue`],
    },
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

async function expectResponseStatus(promise: Promise<unknown>, status: number) {
  try {
    await promise;

    throw new Error(`Expected Response with status ${status}`);
  } catch (error) {
    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(status);
  }
}

beforeEach(async () => {
  context = new RouterContextProvider();

  context.set(currentUserContext, admin);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  const db = createDb(env.DB);

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

  ({ id: jobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-20",
  }));

  await createJobItem(env.DB, admin, jobId, {
    description: "Front lawn mow",
    amountCents: 7500,
  });

  ({ id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  }));
});

it("loads the draft invoice", async () => {
  const result = await loader(loaderArgs());

  expect(result.invoice).toMatchObject({
    id: invoiceId,
    customerId: "customer",
    customerName: "John Smith",
    status: "draft",
    invoiceNumber: null,
    dueDate: null,
    totalCents: 7500,
  });

  expect(result.invoice.jobs).toEqual([
    expect.objectContaining({
      id: jobId,
      name: "Front lawn",
    }),
  ]);
});

it("renders the issue invoice workflow and summary", async () => {
  const result = await loader(loaderArgs());

  const html = renderPage({
    invoice: result.invoice,
  });

  expect(html).toContain("Issue invoice");
  expect(html).toContain("Set the payment due date and issue this draft to");
  expect(html).toContain("John Smith");

  expect(html).toContain("Payment terms");
  expect(html).toContain("Due date");
  expect(html).toContain('name="dueDate"');
  expect(html).toContain('type="date"');
  expect(html).toContain('required=""');

  expect(html).toContain(
    "This date will be shown on the issued invoice and used to determine when an unpaid balance becomes overdue.",
  );

  expect(html).toContain("Issuing finalises the draft");
  expect(html).toContain(
    "Once issued, the invoice number and due date are fixed",
  );

  expect(html).toContain("Invoice summary");
  expect(html).toContain("Customer");
  expect(html).toContain("Jobs");
  expect(html).toContain("Invoice total");
  expect(html).toContain("$75.00");

  expect(html).toContain("Included jobs");
  expect(html).toContain("Front lawn");
  expect(html).toContain(`href="/jobs/${jobId}"`);

  expect(html).toContain(`href="/invoices/${invoiceId}"`);
  expect(html).toContain("Cancel");
});

it("issues the invoice with an explicit due date and redirects", async () => {
  const response = await action(actionArgs("2026-10-01"));

  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(302);
  expect((response as Response).headers.get("Location")).toBe(
    `/invoices/${invoiceId}`,
  );

  const row = await createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();

  expect(row).toMatchObject({
    id: invoiceId,
    status: "issued",
    dueDate: "2026-10-01",
  });

  expect(row?.invoiceNumber).not.toBeNull();
  expect(row?.issuedAt).not.toBeNull();
});

it("returns and renders validation feedback for an invalid due date", async () => {
  const result = await action(actionArgs("2026-02-30"));

  expect(result).toMatchObject({
    init: {
      status: 400,
    },
    data: {
      values: {
        dueDate: "2026-02-30",
      },
      fieldErrors: {
        dueDate: "Enter a valid due date.",
      },
    },
  });

  if (result instanceof Response) {
    throw new Error("Expected validation data, received Response");
  }

  const loaderResult = await loader(loaderArgs());

  const html = renderPage({
    invoice: loaderResult.invoice,
    values: result.data.values,
    fieldErrors: result.data.fieldErrors,
  });

  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="dueDate-error"');
  expect(html).toContain('role="alert"');
  expect(html).toContain("Enter a valid due date.");
  expect(html).toContain('value="2026-02-30"');

  expect(
    await createDb(env.DB)
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .get(),
  ).toMatchObject({
    status: "draft",
    invoiceNumber: null,
    issuedAt: null,
    dueDate: null,
  });
});

it("returns validation feedback when the due date is missing", async () => {
  const result = await action(actionArgs(undefined));

  expect(result).toMatchObject({
    init: {
      status: 400,
    },
    data: {
      values: {
        dueDate: "",
      },
      fieldErrors: {
        dueDate: "Enter a due date.",
      },
    },
  });

  expect(
    await createDb(env.DB)
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .get(),
  ).toMatchObject({
    status: "draft",
    dueDate: null,
  });
});

it("rejects issuing an invoice that has already been issued", async () => {
  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await expectResponseStatus(action(actionArgs("2026-10-15")), 409);

  expect(
    await createDb(env.DB)
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .get(),
  ).toMatchObject({
    status: "issued",
    dueDate: "2026-10-01",
  });
});

it("returns 404 for a missing invoice", async () => {
  await expectResponseStatus(loader(loaderArgs("missing")), 404);

  await expectResponseStatus(action(actionArgs("2026-10-01", "missing")), 404);
});

it("returns 403 without invoice management permission", async () => {
  context.set(currentUserContext, {
    ...admin,
    role: "operator",
  });

  await expectResponseStatus(loader(loaderArgs()), 403);

  await expectResponseStatus(action(actionArgs("2026-10-01")), 403);
});

it("requires authenticated user context", async () => {
  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(loader(loaderArgs())).rejects.toThrow();

  await expect(action(actionArgs("2026-10-01"))).rejects.toThrow();
});
