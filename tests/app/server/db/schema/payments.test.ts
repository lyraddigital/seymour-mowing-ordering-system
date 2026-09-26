import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";

import { createDb } from "../../../../../app/server/db/client/create-db.server";
import { payments } from "../../../../../app/server/db/schema/payments";
import { issuedInvoiceFixture } from "../../../../support/fixtures/issued-invoice";

let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;

beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
});

it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
  "rejects invalid stored amount %s",
  async (amountCents) => {
    await expect(
      createDb(env.DB).insert(payments).values({
        id: crypto.randomUUID(),
        invoiceId: fixture.invoiceId,
        amountCents,
        paymentDate: "2026-09-24",
        createdAt: 1,
      }),
    ).rejects.toThrow();
  },
);

it("requires a payment date", async () => {
  await expect(
    createDb(env.DB)
      .insert(payments)
      .values({
        id: crypto.randomUUID(),
        invoiceId: fixture.invoiceId,
        amountCents: 1000,
        paymentDate: null as unknown as string,
        createdAt: 1,
      }),
  ).rejects.toThrow();
});

it("requires a real invoice", async () => {
  await expect(
    createDb(env.DB).insert(payments).values({
      id: crypto.randomUUID(),
      invoiceId: "missing",
      amountCents: 1,
      paymentDate: "2026-09-24",
      createdAt: 1,
    }),
  ).rejects.toThrow();
});
