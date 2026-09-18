import { and, inArray, isNull, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { invoices } from "../../../db/schema/invoices";
import { jobItems } from "../../../db/schema/job-items";
import { jobs } from "../../../db/schema/jobs";
import { InvoiceJobConflictError } from "../errors/invoice-job-conflict-error";
import { InvoiceJobSelectionError } from "../errors/invoice-job-selection-error";
import type { CreateDraftInvoiceInput } from "../types/create-draft-invoice-input";

function isActiveJobConflict(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("UNIQUE constraint failed: invoice_jobs.job_id")
  );
}

export async function createDraftInvoice(
  binding: Env["DB"],
  user: CurrentUser,
  input: CreateDraftInvoiceInput,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const jobIds = input.jobIds.map((jobId) => jobId.trim());

  if (!jobIds.length || jobIds.some((jobId) => !jobId)) {
    throw new InvoiceJobSelectionError("Select at least one job.");
  }

  if (new Set(jobIds).size !== jobIds.length) {
    throw new InvoiceJobSelectionError("A job can only be selected once.");
  }

  const db = createDb(binding);

  const selectedJobs = await db
    .select({
      id: jobs.id,
      customerId: jobs.customerId,
    })
    .from(jobs)
    .where(inArray(jobs.id, jobIds));

  if (selectedJobs.length !== jobIds.length) {
    throw new InvoiceJobSelectionError(
      "One or more selected jobs could not be found.",
    );
  }

  const customerId = selectedJobs[0].customerId;

  if (selectedJobs.some((job) => job.customerId !== customerId)) {
    throw new InvoiceJobSelectionError(
      "All selected jobs must belong to the same customer.",
    );
  }

  const existingAssignment = await db
    .select({
      jobId: invoiceJobs.jobId,
    })
    .from(invoiceJobs)
    .where(
      and(inArray(invoiceJobs.jobId, jobIds), isNull(invoiceJobs.releasedAt)),
    )
    .get();

  if (existingAssignment) {
    throw new InvoiceJobConflictError(
      "One or more selected jobs are already included on another active invoice.",
    );
  }

  const invoiceId = crypto.randomUUID();
  const now = Date.now();

  try {
    await db.batch([
      db.insert(invoices).values({
        id: invoiceId,
        customerId,
        invoiceNumber: null,
        status: "draft",
        issuedAt: null,
        voidedAt: null,
        createdAt: now,
        updatedAt: now,
      }),

      db.insert(invoiceJobs).values(
        jobIds.map((jobId) => ({
          invoiceId,
          jobId,
          releasedAt: null,
        })),
      ),

      db.insert(invoiceItems).select(
        db
          .select({
            id: sql<string>`
              ${invoiceId} || ':' || ${jobItems.id}
            `.as("id"),

            invoiceId: sql<string>`
              ${invoiceId}
            `.as("invoice_id"),

            jobId: jobItems.jobId,

            description: jobItems.description,

            amountCents: jobItems.amountCents,

            createdAt: sql<number>`
              ${now}
            `.as("created_at"),
          })
          .from(jobItems)
          .where(inArray(jobItems.jobId, jobIds)),
      ),
    ]);
  } catch (error) {
    if (isActiveJobConflict(error)) {
      throw new InvoiceJobConflictError(
        "One or more selected jobs are already included on another active invoice.",
      );
    }

    throw error;
  }

  return {
    id: invoiceId,
  };
}
