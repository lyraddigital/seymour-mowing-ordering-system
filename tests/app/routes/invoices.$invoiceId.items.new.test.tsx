import { env } from "cloudflare:workers";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import {
  action,
  loader,
} from "../../../app/routes/invoices.$invoiceId.items.new";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { invoiceItems } from "../../../app/server/db/schema/invoice-items";
import { createInvoiceItem } from "../../../app/server/features/invoices/services/create-invoice-item.server";
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { updateDraftInvoiceJobs } from "../../../app/server/features/invoices/services/update-draft-invoice-jobs.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import AddInvoiceItemPage from "../../../app/ui/features/invoices/pages/add-invoice-item-page/add-invoice-item-page";
import { draftInvoiceFixture } from "../../support/fixtures/draft-invoice";

let fixture: Awaited<ReturnType<typeof draftInvoiceFixture>>;

let context: RouterContextProvider;

function args(
  invoiceId: string = fixture.invoiceId,
  body = new URLSearchParams({
    jobId: fixture.jobId,
    description: "Updated",
    amount: "12.34",
  }),
) {
  return {
    context,
    params: {
      invoiceId,
    },
    request: new Request("https://example.test/invoices", {
      method: "POST",
      body,
    }),
    url: new URL("https://example.test/invoices"),
    pattern: "/invoices/:invoiceId/items/new",
  };
}

function renderPage(props: ComponentProps<typeof AddInvoiceItemPage>) {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <AddInvoiceItemPage {...props} />,
    },
  ]);

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

beforeEach(async () => {
  fixture = await draftInvoiceFixture();

  context = new RouterContextProvider();

  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await createInvoiceItem(env.DB, fixture.admin, fixture.invoiceId, {
    jobId: fixture.jobId,
    description: "Original",
    amountCents: 1000,
  });
});

it("redirects successful POST to invoice details", async () => {
  const result = await action(args());

  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(302);
  expect((result as Response).headers.get("Location")).toBe(
    `/invoices/${fixture.invoiceId}`,
  );
});

it("returns 403 without management permission", async () => {
  context.set(currentUserContext, {
    ...fixture.admin,
    role: "operator",
  });

  await expect(action(args())).rejects.toMatchObject({
    status: 403,
  });

  await expect(loader(args())).rejects.toMatchObject({
    status: 403,
  });
});

it("returns 404 for a missing invoice", async () => {
  await expect(action(args("missing"))).rejects.toMatchObject({
    status: 404,
  });

  await expect(loader(args("missing"))).rejects.toMatchObject({
    status: 404,
  });
});

it.each(["issued", "voided"] as const)(
  "returns 409 for %s invoices",
  async (status) => {
    await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
      dueDate: "2026-10-01",
    });

    if (status === "voided") {
      await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
    }

    await expect(action(args())).rejects.toMatchObject({
      status: 409,
    });

    await expect(loader(args())).rejects.toMatchObject({
      status: 409,
    });
  },
);

it("loads draft invoice form data", async () => {
  const result = await loader(args());

  expect(result.invoice).toMatchObject({
    id: fixture.invoiceId,
    customerName: "John Smith",
    status: "draft",
  });

  expect(result.invoice.jobs).toEqual([
    expect.objectContaining({
      id: fixture.jobId,
      name: "Front lawn",
      scheduledDate: "2026-09-20",
    }),
  ]);
});

it.each(["", "abc", "-1", "1.234", "$45", "1e2", "9007199254740992"])(
  "returns 400 with submitted values for invalid amount %s",
  async (amount) => {
    const result = await action(
      args(
        fixture.invoiceId,
        new URLSearchParams({
          jobId: fixture.jobId,
          description: "Keep me",
          amount,
        }),
      ),
    );

    if (result instanceof Response) {
      throw new Error("Expected validation data");
    }

    expect(result.init?.status).toBe(400);

    expect(result.data.values).toMatchObject({
      jobId: fixture.jobId,
      description: "Keep me",
      amount,
    });

    expect(result.data.fieldErrors).toHaveProperty("amountCents");
  },
);

it("returns 400 for a blank description", async () => {
  const result = await action(
    args(
      fixture.invoiceId,
      new URLSearchParams({
        jobId: fixture.jobId,
        description: " ",
        amount: "1",
      }),
    ),
  );

  if (result instanceof Response) {
    throw new Error("Expected validation data");
  }

  expect(result.init?.status).toBe(400);

  expect(result.data.fieldErrors).toHaveProperty("description");
});

it.each([
  ["0", 0],
  ["45.5", 4550],
  ["45.67", 4567],
])("parses %s into integer cents", async (amount, cents) => {
  await action(
    args(
      fixture.invoiceId,
      new URLSearchParams({
        jobId: fixture.jobId,
        description: "Changed",
        amount: String(amount),
      }),
    ),
  );

  const items = await createDb(env.DB).select().from(invoiceItems);

  expect(items).toContainEqual(
    expect.objectContaining({
      description: "Changed",
      amountCents: cents,
      jobId: fixture.jobId,
    }),
  );
});

it("returns 400 for an unselected job", async () => {
  const result = await action(
    args(
      fixture.invoiceId,
      new URLSearchParams({
        jobId: fixture.otherJobId,
        description: "Item",
        amount: "0",
      }),
    ),
  );

  if (result instanceof Response) {
    throw new Error("Expected validation data");
  }

  expect(result.init?.status).toBe(400);

  expect(result.data.fieldErrors).toHaveProperty("jobId");
});

it("renders the single-job workflow with read-only job context", async () => {
  const result = await loader(args());

  const html = renderPage({
    ...result,
    values: {
      jobId: fixture.jobId,
      description: "Retry",
      amount: "-1",
    },
    fieldErrors: {
      amountCents: "Enter a valid amount.",
    },
  });

  expect(html).toContain("Add invoice item");
  expect(html).toContain("John Smith");

  expect(html).toContain("Front lawn");
  expect(html).toContain("20 Sept 2026");
  expect(html).toContain(`href="/jobs/${fixture.jobId}"`);

  expect(html).toContain(`type="hidden" name="jobId" value="${fixture.jobId}"`);
  expect(html).not.toContain('<select id="jobId"');

  expect(html).toContain('name="description"');
  expect(html).toContain('value="Retry"');

  expect(html).toContain('name="amount"');
  expect(html).toContain('value="-1"');

  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="amount-error"');
  expect(html).toContain("Enter a valid amount.");

  expect(html).toContain(`href="/invoices/${fixture.invoiceId}"`);
  expect(html).toContain("Add item");
  expect(html).toContain("Cancel");
});

it("offers only selected jobs for a multi-job invoice", async () => {
  await updateDraftInvoiceJobs(env.DB, fixture.admin, fixture.invoiceId, {
    jobIds: [fixture.jobId, fixture.otherJobId],
  });

  const result = await loader(args());

  const html = renderPage(result);

  expect(html).toContain('<select id="jobId" name="jobId"');

  expect(html).toContain(`<option value="${fixture.jobId}">`);
  expect(html).toContain("Front lawn — 20 Sept 2026");

  expect(html).toContain(`<option value="${fixture.otherJobId}">`);
  expect(html).toContain("Back lawn — 21 Sept 2026");

  expect(html).not.toContain('type="hidden" name="jobId"');
});
