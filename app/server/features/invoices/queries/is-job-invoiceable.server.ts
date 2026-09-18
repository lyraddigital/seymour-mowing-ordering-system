import { and, eq, isNull } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";

export async function isJobInvoiceable(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
): Promise<boolean> {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const [activeInvoiceJob] = await db
    .select({
      jobId: invoiceJobs.jobId,
    })
    .from(invoiceJobs)
    .where(and(eq(invoiceJobs.jobId, jobId), isNull(invoiceJobs.releasedAt)))
    .limit(1);

  return !activeInvoiceJob;
}
