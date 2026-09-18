import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { invoices } from "./invoices";
import { jobs } from "./jobs";

export const invoiceJobs = sqliteTable(
  "invoice_jobs",
  {
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id),

    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id),

    releasedAt: integer("released_at"),
  },
  (table) => [
    primaryKey({
      columns: [table.invoiceId, table.jobId],
    }),

    index("invoice_jobs_invoice_id_idx").on(table.invoiceId),

    index("invoice_jobs_job_id_idx").on(table.jobId),

    uniqueIndex("invoice_jobs_active_job_unique")
      .on(table.jobId)
      .where(sql`${table.releasedAt} is null`),
  ],
);
