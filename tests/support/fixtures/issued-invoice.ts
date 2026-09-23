import { env } from "cloudflare:workers";
import { createInvoiceItem } from "../../../app/server/features/invoices/services/create-invoice-item.server";
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { draftInvoiceFixture } from "./draft-invoice";

export async function issuedInvoiceFixture() {
  const fixture = await draftInvoiceFixture();
  await createInvoiceItem(env.DB, fixture.admin, fixture.invoiceId, {
    jobId: fixture.jobId,
    description: "Mowing",
    amountCents: 6000,
  });
  await createInvoiceItem(env.DB, fixture.admin, fixture.invoiceId, {
    jobId: fixture.jobId,
    description: "Edging",
    amountCents: 4000,
  });
  await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
    dueDate: "2026-10-01",
  });
  return fixture;
}
