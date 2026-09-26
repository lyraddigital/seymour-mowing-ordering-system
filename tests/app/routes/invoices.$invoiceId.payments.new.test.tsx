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
} from "../../../app/routes/invoices.$invoiceId.payments.new";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { payments } from "../../../app/server/db/schema/payments";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import { recordPayment } from "../../../app/server/features/payments/services/record-payment.server";
import RecordPaymentPage from "../../../app/ui/features/invoices/pages/record-payment-page/record-payment-page";
import { issuedInvoiceFixture } from "../../support/fixtures/issued-invoice";

let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
let context: RouterContextProvider;

beforeEach(async () => {
  fixture = await issuedInvoiceFixture();

  context = new RouterContextProvider();

  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });
});

function args(
  invoiceId: string = fixture.invoiceId,
  amount = "25.50",
  paymentDate = "2026-09-24",
) {
  return {
    context,
    params: {
      invoiceId,
    },
    request: new Request("https://example.test/invoices", {
      method: "POST",
      body: new URLSearchParams({
        amount,
        paymentDate,
      }),
    }),
    url: new URL("https://example.test/invoices"),
    pattern: "/invoices/:invoiceId/payments/new",
  };
}

function renderPage(props: ComponentProps<typeof RecordPaymentPage>) {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <RecordPaymentPage {...props} />,
    },
  ]);

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

it("loads invoice context and renders payment date and amount fields", async () => {
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2500,
    paymentDate: "2026-09-23",
  });

  const result = await loader(args());

  expect(result.invoice).toMatchObject({
    invoiceNumber: expect.any(String),
    customerName: "John Smith",
    totalCents: 10000,
    paidCents: 2500,
    balanceCents: 7500,
  });

  expect(result.defaultPaymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  const html = renderPage(result);

  expect(html).toContain(result.invoice.invoiceNumber!);
  expect(html).toContain("John Smith");
  expect(html).toContain("Payment date");
  expect(html).toContain('name="paymentDate"');
  expect(html).toContain(`value="${result.defaultPaymentDate}"`);
  expect(html).toContain('name="amount"');
  expect(html).toContain("$100.00");
  expect(html).toContain("$25.00");
  expect(html).toContain("$75.00");
  expect(html.match(/<input/g)).toHaveLength(2);
});

it.each([
  ["25.50", 2550],
  ["25.5", 2550],
  ["100", 10000],
])(
  "records %s with the bank payment date and redirects",
  async (amount, cents) => {
    const result = await action(args(fixture.invoiceId, String(amount)));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect((result as Response).headers.get("Location")).toBe(
      `/invoices/${fixture.invoiceId}`,
    );

    const [payment] = await createDb(env.DB).select().from(payments);

    expect(payment).toMatchObject({
      amountCents: cents,
      paymentDate: "2026-09-24",
      voidedAt: null,
    });

    expect(payment.createdAt).toEqual(expect.any(Number));
  },
);

it.each(["", "0", "-1", "1.234", "abc", "$5", "1e2", "9007199254740992"])(
  "returns amount validation data for %s",
  async (amount) => {
    const result = await action(args(fixture.invoiceId, amount));

    if (result instanceof Response) {
      throw new Error("Expected validation data");
    }

    expect(result.init?.status).toBe(400);
    expect(result.data.values.amount).toBe(amount);
    expect(result.data.values.paymentDate).toBe("2026-09-24");
    expect(result.data.fieldErrors.amount).toContain("valid payment amount");
  },
);

it("returns payment date validation data", async () => {
  const result = await action(args(fixture.invoiceId, "25.50", "2026-02-30"));

  if (result instanceof Response) {
    throw new Error("Expected validation data");
  }

  expect(result.init?.status).toBe(400);
  expect(result.data.values.paymentDate).toBe("2026-02-30");

  expect(result.data.fieldErrors).toMatchObject({
    paymentDate: "Enter a valid payment date.",
  });
});

it("returns a useful overpayment error and preserves both values", async () => {
  const result = await action(args(fixture.invoiceId, "100.01"));

  if (result instanceof Response) {
    throw new Error("Expected validation data");
  }

  expect(result.init?.status).toBe(400);
  expect(result.data.fieldErrors.amount).toContain("remaining invoice balance");

  const props = await loader(args());

  const html = renderPage({
    ...props,
    ...result.data,
  });

  expect(html).toContain('value="100.01"');
  expect(html).toContain('value="2026-09-24"');
  expect(html).toContain('role="alert"');
});

it.each(["draft", "voided"])(
  "rejects %s invoice loader and action",
  async (status) => {
    let id: string = fixture.invoiceId;

    if (status === "draft") {
      ({ id } = await createDraftInvoice(env.DB, fixture.admin, {
        jobIds: [fixture.otherJobId],
      }));
    } else {
      await voidInvoice(env.DB, fixture.admin, id);
    }

    await expect(loader(args(id))).rejects.toMatchObject({
      status: 409,
    });

    await expect(action(args(id))).rejects.toMatchObject({
      status: 409,
    });
  },
);

it("rejects the form loader for a fully-paid invoice", async () => {
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 10000,
    paymentDate: "2026-09-24",
  });

  await expect(loader(args())).rejects.toMatchObject({
    status: 409,
  });
});

it("returns 403 for a non-managing user", async () => {
  context.set(currentUserContext, {
    ...fixture.admin,
    role: "operator",
  });

  await expect(loader(args())).rejects.toMatchObject({
    status: 403,
  });

  await expect(action(args())).rejects.toMatchObject({
    status: 403,
  });
});

it("returns 404 for a missing invoice", async () => {
  await expect(loader(args("missing"))).rejects.toMatchObject({
    status: 404,
  });

  await expect(action(args("missing"))).rejects.toMatchObject({
    status: 404,
  });
});
