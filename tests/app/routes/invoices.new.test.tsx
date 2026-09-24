import { env } from "cloudflare:workers";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import { action, loader } from "../../../app/routes/invoices.new";
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
import { createJobItem } from "../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import NewInvoicePage from "../../../app/ui/features/invoices/pages/new-invoice-page/new-invoice-page";
import { internalUser } from "../../support/fixtures/internal-user";

const admin = internalUser();

let context: RouterContextProvider;
let firstJobId: string;
let secondJobId: string;
let otherCustomerJobId: string;

function loaderArgs(search = "") {
  return {
    context,
    request: new Request(`https://example.test/invoices/new${search}`),
    url: new URL(`https://example.test/invoices/new${search}`),
    params: {},
    pattern: "/invoices/new",
  };
}

function actionArgs(jobIds: string[]) {
  const body = new URLSearchParams();

  for (const jobId of jobIds) {
    body.append("jobId", jobId);
  }

  return {
    context,
    request: new Request("https://example.test/invoices/new", {
      method: "POST",
      body,
    }),
    url: new URL("https://example.test/invoices/new"),
    params: {},
    pattern: "/invoices/new",
  };
}

function renderPage(props: ComponentProps<typeof NewInvoicePage>) {
  const router = createMemoryRouter(
    [
      {
        path: "/invoices/new",
        element: <NewInvoicePage {...props} />,
      },
    ],
    {
      initialEntries: ["/invoices/new"],
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
    scheduledDate: "2026-09-17",
  }));

  ({ id: secondJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow back lawn",
    scheduledDate: "2026-09-18",
  }));

  ({ id: otherCustomerJobId } = await createJob(env.DB, admin, {
    customerId: "other-customer",
    name: "Nature strip",
    description: "Mow nature strip",
    scheduledDate: "2026-09-19",
  }));
});

it("loads jobs available for invoicing", async () => {
  const result = await loader(loaderArgs());

  expect(result.jobs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: firstJobId,
        customerId: "customer",
        customerName: "John Smith",
        name: "Front lawn",
      }),
      expect.objectContaining({
        id: secondJobId,
        customerId: "customer",
        customerName: "John Smith",
        name: "Back lawn",
      }),
      expect.objectContaining({
        id: otherCustomerJobId,
        customerId: "other-customer",
        customerName: "Jane Smith",
        name: "Nature strip",
      }),
    ]),
  );
});

it("renders the create invoice workflow", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  const result = await loader(loaderArgs());

  const html = renderPage({
    jobs: result.jobs,
    initialJobId: result.initialJobId,
  });

  expect(html).toContain("Create invoice");
  expect(html).toContain(
    "Choose a customer and select the jobs to include on the draft invoice.",
  );

  expect(html).toContain("Customer");
  expect(html).toContain("Select a customer");
  expect(html).toContain("John Smith");
  expect(html).toContain("Jane Smith");

  expect(html).toContain("Jobs");
  expect(html).toContain("Select one or more jobs to include on this invoice.");

  expect(html).toContain("Create draft invoice");
  expect(html).toContain("Cancel");
  expect(html).toContain('href="/invoices"');
});

it("preselects an eligible job from the query string", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  const result = await loader(loaderArgs(`?jobId=${firstJobId}`));

  expect(result.initialJobId).toBe(firstJobId);

  const html = renderPage({
    jobs: result.jobs,
    initialJobId: result.initialJobId,
  });

  expect(html).toContain("John Smith");
  expect(html).toContain("Front lawn");
  expect(html).toContain("17 Sept 2026");
  expect(html).toContain("$45.00");
  expect(html).toContain("1");
  expect(html).toContain("job selected");
  expect(html).toContain("Selected jobs total");
});

it("does not preselect an unknown job", async () => {
  const result = await loader(loaderArgs("?jobId=missing"));

  expect(result.initialJobId).toBeNull();
});

it("does not return a job already attached to an active invoice", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await loader(loaderArgs());

  expect(result.jobs.some((job) => job.id === firstJobId)).toBe(false);
  expect(result.jobs.some((job) => job.id === secondJobId)).toBe(true);
});

it("does not preselect a job already attached to an active invoice", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await loader(loaderArgs(`?jobId=${firstJobId}`));

  expect(result.initialJobId).toBeNull();
});

it("creates a draft invoice from selected jobs", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, secondJobId, {
    description: "Back lawn mow",
    amountCents: 3500,
  });

  const response = await action(actionArgs([firstJobId, secondJobId]));

  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(302);

  const location = (response as Response).headers.get("Location");

  expect(location).toMatch(/^\/invoices\/[^/]+$/);

  const invoiceId = location!.split("/").at(-1)!;

  expect(await createDb(env.DB).select().from(invoices)).toEqual([
    expect.objectContaining({
      id: invoiceId,
      customerId: "customer",
      status: "draft",
      invoiceNumber: null,
      dueDate: null,
    }),
  ]);

  expect(await createDb(env.DB).select().from(invoiceJobs)).toEqual(
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

  expect(await createDb(env.DB).select().from(invoiceItems)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        invoiceId,
        jobId: firstJobId,
        description: "Front lawn mow",
        amountCents: 4500,
      }),
      expect.objectContaining({
        invoiceId,
        jobId: secondJobId,
        description: "Back lawn mow",
        amountCents: 3500,
      }),
    ]),
  );
});

it("returns 400 when no jobs are selected", async () => {
  const result = await action(actionArgs([]));

  expect(result).toMatchObject({
    init: {
      status: 400,
    },
    data: {
      values: {
        jobIds: [],
      },
      errorMessage: "Select at least one job.",
    },
  });

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);
});

it("returns and renders feedback when jobs belong to different customers", async () => {
  const result = await action(actionArgs([firstJobId, otherCustomerJobId]));

  expect(result).toMatchObject({
    init: {
      status: 400,
    },
    data: {
      values: {
        jobIds: [firstJobId, otherCustomerJobId],
      },
      errorMessage: "All selected jobs must belong to the same customer.",
    },
  });

  if (result instanceof Response) {
    throw new Error("Expected validation data, received Response");
  }

  const loaderResult = await loader(loaderArgs());

  const html = renderPage({
    jobs: loaderResult.jobs,
    initialJobId: loaderResult.initialJobId,
    values: result.data.values,
    errorMessage: result.data.errorMessage,
  });

  expect(html).toContain('role="alert"');
  expect(html).toContain("Invoice could not be created.");
  expect(html).toContain("All selected jobs must belong to the same customer.");

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);
});

it("returns 400 when a selected job is already on an active invoice", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const result = await action(actionArgs([firstJobId, secondJobId]));

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

it("renders the empty state when no jobs are available to invoice", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  await createDraftInvoice(env.DB, admin, {
    jobIds: [otherCustomerJobId],
  });

  const result = await loader(loaderArgs());

  expect(result.jobs).toEqual([]);

  const html = renderPage({
    jobs: result.jobs,
    initialJobId: result.initialJobId,
  });

  expect(html).toContain("No jobs available to invoice");
  expect(html).toContain(
    "Jobs already assigned to a draft or issued invoice are not available here.",
  );
  expect(html).toContain('href="/jobs"');
  expect(html).toContain("View jobs");
});

it("returns 403 without invoice management permission", async () => {
  context.set(currentUserContext, {
    ...admin,
    role: "operator",
  });

  await expectResponseStatus(loader(loaderArgs()), 403);
  await expectResponseStatus(action(actionArgs([firstJobId])), 403);
});

it("requires authenticated user context", async () => {
  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(loader(loaderArgs())).rejects.toThrow();
  await expect(action(actionArgs([firstJobId]))).rejects.toThrow();
});
