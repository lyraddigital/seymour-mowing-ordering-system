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
} from "../../../app/routes/invoices.$invoiceId.items.$itemId.edit";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { invoiceItems } from "../../../app/server/db/schema/invoice-items";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import { createInvoiceItem } from "../../../app/server/features/invoices/services/create-invoice-item.server";
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import EditInvoiceItemPage from "../../../app/ui/features/invoices/pages/edit-invoice-item-page/edit-invoice-item-page";
import { draftInvoiceFixture } from "../../support/fixtures/draft-invoice";

let fixture: Awaited<ReturnType<typeof draftInvoiceFixture>>;

let context: RouterContextProvider;
let itemId: string;

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
      itemId,
    },
    request: new Request("https://example.test/invoices", {
      method: "POST",
      body,
    }),
    url: new URL("https://example.test/invoices"),
    pattern: "/invoices/:invoiceId/items/:itemId/edit",
  };
}

function renderPage(props: ComponentProps<typeof EditInvoiceItemPage>) {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <EditInvoiceItemPage {...props} />,
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

  ({ id: itemId } = await createInvoiceItem(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    {
      jobId: fixture.jobId,
      description: "Original",
      amountCents: 1000,
    },
  ));
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

it("returns 404 for another invoice's item", async () => {
  const { id } = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [fixture.otherJobId],
  });

  await expect(action(args(id))).rejects.toMatchObject({
    status: 404,
  });

  await expect(loader(args(id))).rejects.toMatchObject({
    status: 404,
  });
});

it("returns 404 for a missing item", async () => {
  itemId = "missing";

  await expect(action(args())).rejects.toMatchObject({
    status: 404,
  });

  await expect(loader(args())).rejects.toMatchObject({
    status: 404,
  });
});

it("loads draft form data", async () => {
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

  expect(result.item).toMatchObject({
    id: itemId,
    jobId: fixture.jobId,
    description: "Original",
    amountCents: 1000,
  });
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
      id: itemId,
      description: "Changed",
      amountCents: cents,
      jobId: fixture.jobId,
    }),
  );
});

it("ignores a submitted replacement job", async () => {
  await action(
    args(
      fixture.invoiceId,
      new URLSearchParams({
        jobId: fixture.otherJobId,
        description: "Updated",
        amount: "1",
      }),
    ),
  );

  expect((await createDb(env.DB).select().from(invoiceItems))[0].jobId).toBe(
    fixture.jobId,
  );
});

it("renders linked job as read-only context with validation feedback", async () => {
  const result = await loader(args());

  const html = renderPage({
    ...result,
    values: {
      description: "Retry",
      amount: "-1",
    },
    fieldErrors: {
      amountCents: "Enter a valid amount.",
    },
  });

  expect(html).toContain("Edit invoice item");
  expect(html).toContain("John Smith");

  expect(html).toContain("Front lawn");
  expect(html).toContain("20 Sept 2026");
  expect(html).toContain(`href="/jobs/${fixture.jobId}"`);

  expect(html).not.toContain('name="jobId"');

  expect(html).toContain('name="description"');
  expect(html).toContain('value="Retry"');

  expect(html).toContain('name="amount"');
  expect(html).toContain('value="-1"');

  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="amount-error"');
  expect(html).toContain("Enter a valid amount.");
  expect(html).toContain('role="alert"');

  expect(html).toContain(`href="/invoices/${fixture.invoiceId}"`);
  expect(html).toContain("Save changes");
  expect(html).toContain("Cancel");
});
