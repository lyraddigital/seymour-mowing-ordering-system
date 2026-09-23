import { voidPayment } from "../../../app/server/features/payments/services/void-payment.server";
import { recordPayment } from "../../../app/server/features/payments/services/record-payment.server";
import { payments } from "../../../app/server/db/schema/payments";
import { deleteInvoiceItem } from "../../../app/server/features/invoices/services/delete-invoice-item.server";
import { updateInvoiceItem } from "../../../app/server/features/invoices/services/update-invoice-item.server";
import { createInvoiceItem } from "../../../app/server/features/invoices/services/create-invoice-item.server";
import { env } from "cloudflare:workers";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import { loader } from "../../../app/routes/invoices.$invoiceId";
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
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import { createJobItem } from "../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import InvoicePage from "../../../app/ui/features/invoices/pages/invoice-page/invoice-page";
import { internalUser } from "../../support/fixtures/internal-user";

const admin = internalUser();

let context: RouterContextProvider;
let jobId: string;

function loaderArgs(invoiceId: string) {
  return {
    context,
    request: new Request(`https://example.test/invoices/${invoiceId}`),
    url: new URL(`https://example.test/invoices/${invoiceId}`),
    params: {
      invoiceId,
    },
    pattern: "/invoices/:invoiceId",
  };
}

function renderPage(props: ComponentProps<typeof InvoicePage>) {
  const router = createMemoryRouter(
    [
      {
        path: "/invoices/:invoiceId",
        element: <InvoicePage {...props} />,
      },
    ],
    {
      initialEntries: [`/invoices/${props.invoice.id}`],
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

  ({ id: jobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-18",
  }));
});

it("loads invoice details", async () => {
  await createJobItem(env.DB, admin, jobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  const result = await loader(loaderArgs(invoiceId));

  expect(result).toEqual({
    payments: [],
    invoice: expect.objectContaining({
      id: invoiceId,
      customerId: "customer",
      customerName: "John Smith",
      invoiceNumber: null,
      status: "draft",
      totalCents: 4500,
      jobs: [
        {
          id: jobId,
          name: "Front lawn",
          scheduledDate: "2026-09-18",
        },
      ],
    }),
    items: [
      expect.objectContaining({
        invoiceId,
        jobId,
        description: "Front lawn mow",
        amountCents: 4500,
      }),
    ],
    canManage: true,
  });
});

it("returns 404 for a missing invoice", async () => {
  await expectResponseStatus(loader(loaderArgs("missing")), 404);
});

it("returns 403 without invoice read permission", async () => {
  context.set(currentUserContext, {
    ...admin,
    role: "unknown" as "admin",
  });

  await expectResponseStatus(loader(loaderArgs("missing")), 403);
});

it("renders invoice details", async () => {
  await createJobItem(env.DB, admin, jobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  const result = await loader(loaderArgs(invoiceId));

  const html = renderPage(result);

  expect(html).toContain("Draft invoice");
  expect(html).toContain("John Smith");
  expect(html).toContain("Front lawn");
  expect(html).toContain("Front lawn mow");
  expect(html).toContain("$45.00");
});

it("shows issue and delete actions for a manageable draft invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  const result = await loader(loaderArgs(invoiceId));

  const html = renderPage(result);

  expect(html).toContain("Issue invoice");
  expect(html).toContain("Delete draft");
  expect(html).toContain("Confirm delete");
  expect(html).not.toContain("Void invoice");
});

it("shows only the void action for a manageable issued invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  const result = await loader(loaderArgs(invoiceId));

  const html = renderPage(result);

  expect(html).toContain("Issued");
  expect(html).toContain("Void invoice");
  expect(html).toContain("Confirm void");

  expect(html).not.toContain("Issue invoice");
  expect(html).not.toContain("Delete draft");
});

it("shows no lifecycle actions for a voided invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await voidInvoice(env.DB, admin, invoiceId);

  const result = await loader(loaderArgs(invoiceId));

  const html = renderPage(result);

  expect(html).toContain("Voided");

  expect(html).not.toContain("Issue invoice");
  expect(html).not.toContain("Delete draft");
  expect(html).not.toContain("Void invoice");
});

it("allows an operator to view an invoice without management actions", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  context.set(currentUserContext, {
    ...admin,
    role: "operator",
  });

  const result = await loader(loaderArgs(invoiceId));

  expect(result.canManage).toBe(false);

  const html = renderPage(result);

  expect(html).toContain("Draft invoice");
  expect(html).toContain("John Smith");
  expect(html).toContain("Front lawn");

  expect(html).not.toContain("Issue invoice");
  expect(html).not.toContain("Delete draft");
  expect(html).not.toContain("Void invoice");
});

it.each([
  ["draft", true, true],
  ["issued", true, false],
  ["voided", true, false],
  ["draft", false, false],
] as const)(
  "item controls for %s, managing=%s",
  async (status, manage, visible) => {
    const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
      jobIds: [jobId],
    });
    const { id: itemId } = await createInvoiceItem(env.DB, admin, invoiceId, {
      jobId,
      description: "Charge",
      amountCents: 100,
    });
    if (status !== "draft")
      await issueInvoice(env.DB, admin, invoiceId, {
        dueDate: "2026-10-01",
      });
    if (status === "voided") await voidInvoice(env.DB, admin, invoiceId);
    if (!manage)
      context.set(currentUserContext, { ...admin, role: "operator" });
    const html = renderPage(await loader(loaderArgs(invoiceId)));
    expect(html.includes(`/invoices/${invoiceId}/items/new`)).toBe(visible);
    expect(html.includes(`/invoices/${invoiceId}/items/${itemId}/edit`)).toBe(
      visible,
    );
    expect(html.includes(`/invoices/${invoiceId}/items/${itemId}/delete`)).toBe(
      visible,
    );
    expect(html.includes("Confirm delete item")).toBe(visible);
  },
);
it("renders derived totals after adding, editing and deleting an item", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });
  const { id } = await createInvoiceItem(env.DB, admin, invoiceId, {
    jobId,
    description: "Charge",
    amountCents: 1234,
  });
  let result = await loader(loaderArgs(invoiceId));
  expect(result.invoice.totalCents).toBe(1234);
  expect(renderPage(result)).toContain("$12.34");
  await updateInvoiceItem(env.DB, admin, invoiceId, id, {
    description: "Correction",
    amountCents: 2000,
  });
  result = await loader(loaderArgs(invoiceId));
  expect(result.invoice.totalCents).toBe(2000);
  expect(renderPage(result)).toContain("$20.00");
  await deleteInvoiceItem(env.DB, admin, invoiceId, id);
  result = await loader(loaderArgs(invoiceId));
  expect(result.invoice.totalCents).toBe(0);
  expect(renderPage(result)).toContain("$0.00");
});

it("shows payment history, balances and appropriate controls through payment and invoice lifecycle", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });
  await createInvoiceItem(env.DB, admin, invoiceId, {
    jobId,
    description: "Charge",
    amountCents: 10000,
  });
  let html = renderPage(await loader(loaderArgs(invoiceId)));
  expect(html).not.toContain("Record payment");
  expect(html).not.toContain("Void payment");
  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });
  html = renderPage(await loader(loaderArgs(invoiceId)));
  expect(html).toContain(`/invoices/${invoiceId}/payments/new`);
  const first = await recordPayment(env.DB, admin, invoiceId, {
    amountCents: 2500,
  });
  html = renderPage(await loader(loaderArgs(invoiceId)));
  expect(html).toContain("$25.00");
  expect(html).toContain("$75.00");
  expect(html).toContain("Record payment");
  expect(html).toContain(`/invoices/${invoiceId}/payments/${first.id}/void`);
  const second = await recordPayment(env.DB, admin, invoiceId, {
    amountCents: 7500,
  });
  html = renderPage(await loader(loaderArgs(invoiceId)));
  expect(html).not.toContain("Record payment");
  expect(html).toContain("$0.00");
  await voidPayment(env.DB, admin, invoiceId, second.id);
  html = renderPage(await loader(loaderArgs(invoiceId)));
  expect(html).toContain("Record payment");
  expect(html).not.toContain(`/payments/${second.id}/void`);
  expect(html).toContain("Voided");
  await voidInvoice(env.DB, admin, invoiceId);
  const result = await loader(loaderArgs(invoiceId));
  expect(result.invoice).toMatchObject({ paidCents: 2500, balanceCents: 7500 });
  expect(result.payments).toHaveLength(2);
  html = renderPage(result);
  expect(html).toContain("Historical balance");
  expect(html).not.toContain("Record payment");
  expect(html).toContain(`/payments/${first.id}/void`);
  expect(html).not.toContain(`/payments/${second.id}/void`);
  context.set(currentUserContext, { ...admin, role: "operator" });
  html = renderPage(await loader(loaderArgs(invoiceId)));
  expect(html).toContain("$25.00");
  expect(html).toContain("$75.00");
  expect(html).toContain("Received");
  expect(html).not.toContain("Record payment");
  expect(html).not.toContain("Void payment");
});
it("hides Record payment from non-managers on an issued unpaid invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });
  await createInvoiceItem(env.DB, admin, invoiceId, {
    jobId,
    description: "Charge",
    amountCents: 10000,
  });
  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });
  context.set(currentUserContext, { ...admin, role: "operator" });
  const html = renderPage(await loader(loaderArgs(invoiceId)));
  expect(html).not.toContain("Record payment");
  expect(html).toContain("$100.00");
});
