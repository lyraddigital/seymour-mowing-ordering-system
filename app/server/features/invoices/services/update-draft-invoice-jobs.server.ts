import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";

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
import { InvoiceNotFoundError } from "../errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../errors/invoice-state-conflict-error";

interface UpdateDraftInvoiceJobsInput {
  jobIds: string[];
}

export async function updateDraftInvoiceJobs(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
  input: UpdateDraftInvoiceJobsInput,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const [invoice] = await db
    .select({
      id: invoices.id,
      customerId: invoices.customerId,
      status: invoices.status,
    })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice) {
    throw new InvoiceNotFoundError();
  }

  if (invoice.status !== "draft") {
    throw new InvoiceStateConflictError("Only draft invoices can be edited.");
  }

  const jobIds = input.jobIds.map((jobId) => jobId.trim());

  if (jobIds.length === 0 || jobIds.some((jobId) => jobId.length === 0)) {
    throw new InvoiceJobSelectionError("At least one job must be selected.");
  }

  if (new Set(jobIds).size !== jobIds.length) {
    throw new InvoiceJobSelectionError(
      "The same job cannot be selected more than once.",
    );
  }

  const selectedJobs = await db
    .select({
      id: jobs.id,
      customerId: jobs.customerId,
    })
    .from(jobs)
    .where(inArray(jobs.id, jobIds));

  if (selectedJobs.length !== jobIds.length) {
    throw new InvoiceJobSelectionError(
      "One or more selected jobs do not exist.",
    );
  }

  if (selectedJobs.some((job) => job.customerId !== invoice.customerId)) {
    throw new InvoiceJobSelectionError(
      "All selected jobs must belong to the invoice customer.",
    );
  }

  const conflictingAssignments = await db
    .select({
      jobId: invoiceJobs.jobId,
    })
    .from(invoiceJobs)
    .where(
      and(
        inArray(invoiceJobs.jobId, jobIds),
        isNull(invoiceJobs.releasedAt),
        ne(invoiceJobs.invoiceId, invoiceId),
      ),
    )
    .limit(1);

  if (conflictingAssignments.length > 0) {
    throw new InvoiceJobConflictError(
      "One or more selected jobs are already included on another active invoice.",
    );
  }

  const currentAssignments = await db
    .select({
      jobId: invoiceJobs.jobId,
    })
    .from(invoiceJobs)
    .where(
      and(eq(invoiceJobs.invoiceId, invoiceId), isNull(invoiceJobs.releasedAt)),
    );

  const currentJobIds = new Set(
    currentAssignments.map((assignment) => assignment.jobId),
  );

  const selectedJobIds = new Set(jobIds);

  const addedJobIds = jobIds.filter((jobId) => !currentJobIds.has(jobId));

  const removedJobIds = [...currentJobIds].filter(
    (jobId) => !selectedJobIds.has(jobId),
  );

  if (addedJobIds.length === 0 && removedJobIds.length === 0) {
    return {
      id: invoiceId,
    };
  }

  const now = Date.now();

  const updateInvoice = db
    .update(invoices)
    .set({
      updatedAt: now,
    })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.status, "draft")));

  try {
    if (addedJobIds.length > 0 && removedJobIds.length > 0) {
      await db.batch([
        db
          .delete(invoiceItems)
          .where(
            and(
              eq(invoiceItems.invoiceId, invoiceId),
              inArray(invoiceItems.jobId, removedJobIds),
            ),
          ),

        db
          .delete(invoiceJobs)
          .where(
            and(
              eq(invoiceJobs.invoiceId, invoiceId),
              inArray(invoiceJobs.jobId, removedJobIds),
            ),
          ),

        db.insert(invoiceJobs).values(
          addedJobIds.map((jobId) => ({
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
            .where(inArray(jobItems.jobId, addedJobIds)),
        ),

        updateInvoice,
      ]);
    } else if (addedJobIds.length > 0) {
      await db.batch([
        db.insert(invoiceJobs).values(
          addedJobIds.map((jobId) => ({
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
            .where(inArray(jobItems.jobId, addedJobIds)),
        ),

        updateInvoice,
      ]);
    } else {
      await db.batch([
        db
          .delete(invoiceItems)
          .where(
            and(
              eq(invoiceItems.invoiceId, invoiceId),
              inArray(invoiceItems.jobId, removedJobIds),
            ),
          ),

        db
          .delete(invoiceJobs)
          .where(
            and(
              eq(invoiceJobs.invoiceId, invoiceId),
              inArray(invoiceJobs.jobId, removedJobIds),
            ),
          ),

        updateInvoice,
      ]);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("invoice_jobs.job_id")
    ) {
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
