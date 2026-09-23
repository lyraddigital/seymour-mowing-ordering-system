import { and, eq, isNull } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { invoices } from "../../../db/schema/invoices";

export async function getActiveInvoiceForJob(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
) {
  if (!can(user, "invoices.read")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const invoice = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
    })
    .from(invoiceJobs)
    .innerJoin(invoices, eq(invoices.id, invoiceJobs.invoiceId))
    .where(and(eq(invoiceJobs.jobId, jobId), isNull(invoiceJobs.releasedAt)))
    .limit(1)
    .get();

  return invoice ?? null;
}
