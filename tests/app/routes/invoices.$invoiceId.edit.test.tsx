import { env } from "cloudflare:workers";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import { action, loader } from "../../../app/routes/invoices.$invoiceId.edit";
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
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import EditInvoicePage from "../../../app/ui/features/invoices/pages/edit-invoice-page/edit-invoice-page";
import { internalUser } from "../../support/fixtures/internal-user";

const admin = internalUser();

let context: RouterContextProvider;
let firstJobId: string;
let secondJobId: string;
let otherCustomerJobId: string;

function loaderArgs(invoiceId: string) {
  return {
    context,
    request: new Request(`https://example.test/invoices/${invoiceId}/edit`),
    url: new URL(`https://example.test/invoices/${invoiceId}/edit`),
    params: {
      invoiceId,
    },
    pattern: "/invoices/:invoiceId/edit",
  };
}

function actionArgs(invoiceId: string, jobIds: string[]) {
  const body = new URLSearchParams();

  for (const jobId of jobIds) {
    body.append("jobId", jobId);
  }

  return {
    context,
    request: new Request(`https://example.test/invoices/${invoiceId}/edit`, {
      method: "POST",
      body,
    }),
    url: new URL(`https://example.test/invoices/${invoiceId}/edit`),
    params: {
      invoiceId,
    },
    pattern: "/invoices/:invoiceId/edit",
  };
}

function renderPage(props: ComponentProps<typeof EditInvoicePage>) {
  const router = createMemoryRouter(
    [
      {
        path: "/invoices/:invoiceId/edit",
        element: <EditInvoicePage {...props} />,
      },
    ],
    {
      initialEntries: [`/invoices/${props.invoiceId}/edit`],
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

  await db.insert(customers).values([
    {
      id: "customer",
      name: "John Smith",
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: "other-customer",
      name: "Jane Smith",
      createdAt: 1,
      updatedAt: 1,
    },
  ]);

  ({ id: firstJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-19",
  }));

  ({ id: secondJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow back lawn",
    scheduledDate: "2026-09-20",
  }));

  ({ id: otherCustomerJobId } = await createJob(env.DB, admin, {
    customerId: "other-customer",
    name: "Nature strip",
    description: "Mow nature strip",
    scheduledDate: "2026-09-21",
  }));
});

it("loads the current jobs and other available jobs for the invoice customer", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await loader(loaderArgs(invoiceId));

  expect(result).toEqual({
    invoiceId,
    customerName: "John Smith",
    jobs: [
      {
        id: firstJobId,
        name: "Front lawn",
        scheduledDate: "2026-09-19",
      },
      {
        id: secondJobId,
        name: "Back lawn",
        scheduledDate: "2026-09-20",
      },
    ],
    selectedJobIds: [firstJobId],
  });
});

it("renders the draft invoice edit workflow", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await loader(loaderArgs(invoiceId));

  const html = renderPage(result);

  expect(html).toContain("Edit draft invoice");
  expect(html).toContain("Update the jobs included on this draft invoice.");

  expect(html).toContain("Customer");
  expect(html).toContain("John Smith");
  expect(html).toContain(
    "The customer cannot be changed after the draft is created.",
  );

  expect(html).toContain("Jobs");
  expect(html).toContain("Front lawn");
  expect(html).toContain("Back lawn");

  expect(html).toContain("19 Sept 2026");
  expect(html).toContain("20 Sept 2026");

  expect(html).toContain('name="jobId"');
  expect(html).toContain(`value="${firstJobId}"`);
  expect(html).toContain(`value="${secondJobId}"`);

  expect(html).toContain("1");
  expect(html).toContain("job selected");

  expect(html).toContain("Save draft");
  expect(html).toContain("Cancel");

  expect(html).toContain('href="/invoices"');
  expect(html).toContain(`href="/invoices/${invoiceId}"`);
});

it("excludes jobs belonging to another customer", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await loader(loaderArgs(invoiceId));

  expect(result.jobs.some((job) => job.id === otherCustomerJobId)).toBe(false);

  const html = renderPage(result);

  expect(html).not.toContain("Nature strip");
});

it("excludes a job belonging to another active invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId],
  });

  const result = await loader(loaderArgs(invoiceId));

  expect(result.jobs.map((job) => job.id)).toEqual([firstJobId]);

  const html = renderPage(result);

  expect(html).toContain("Front lawn");
  expect(html).not.toContain("Back lawn");
});

it("updates the draft job selection and redirects", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const response = await action(
    actionArgs(invoiceId, [firstJobId, secondJobId]),
  );

  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(302);
  expect((response as Response).headers.get("Location")).toBe(
    `/invoices/${invoiceId}`,
  );

  const assignments = await createDb(env.DB).select().from(invoiceJobs);

  expect(assignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        invoiceId,
        jobId: firstJobId,
        releasedAt: null,
      }),
      expect.objectContaining({
        invoiceId,
        jobId: secondJobId,
        releasedAt: null,
      }),
    ]),
  );
});

it("returns and renders feedback when no jobs are selected", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await action(actionArgs(invoiceId, []));

  expect(result).toMatchObject({
    init: {
      status: 400,
    },
    data: {
      values: {
        jobIds: [],
      },
      errorMessage: "At least one job must be selected.",
    },
  });

  if (result instanceof Response) {
    throw new Error("Expected validation data, received Response");
  }

  const loaderResult = await loader(loaderArgs(invoiceId));

  const html = renderPage({
    ...loaderResult,
    selectedJobIds: result.data.values.jobIds,
    errorMessage: result.data.errorMessage,
  });

  expect(html).toContain('role="alert"');
  expect(html).toContain("Draft could not be updated.");
  expect(html).toContain("At least one job must be selected.");
  expect(html).toContain("0");
  expect(html).toContain("jobs selected");
});

it("returns 400 when another active invoice owns a selected job", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId],
  });

  const result = await action(actionArgs(invoiceId, [firstJobId, secondJobId]));

  expect(result).toMatchObject({
    init: {
      status: 400,
    },
    data: {
      values: {
        jobIds: [firstJobId, secondJobId],
      },
      errorMessage:
        "One or more selected jobs are already included on another active invoice.",
    },
  });
});

it("returns 404 for a missing invoice", async () => {
  await expectResponseStatus(loader(loaderArgs("missing")), 404);

  await expectResponseStatus(action(actionArgs("missing", [firstJobId])), 404);
});

it("returns 409 when an issued invoice is edited", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await expectResponseStatus(loader(loaderArgs(invoiceId)), 409);

  await expectResponseStatus(action(actionArgs(invoiceId, [firstJobId])), 409);
});

it("returns 403 without invoice management permission", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  context.set(currentUserContext, {
    ...admin,
    role: "operator",
  });

  await expectResponseStatus(loader(loaderArgs(invoiceId)), 403);

  await expectResponseStatus(action(actionArgs(invoiceId, [firstJobId])), 403);
});

it("requires authenticated user context", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(loader(loaderArgs(invoiceId))).rejects.toThrow();

  await expect(action(actionArgs(invoiceId, [firstJobId]))).rejects.toThrow();
});
