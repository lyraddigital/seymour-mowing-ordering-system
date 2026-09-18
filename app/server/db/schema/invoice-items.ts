import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { invoices } from "./invoices";
import { jobs } from "./jobs";

export const invoiceItems = sqliteTable(
  "invoice_items",
  {
    id: text("id").primaryKey().notNull(),

    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id),

    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id),

    description: text("description").notNull(),

    amountCents: integer("amount_cents").notNull(),

    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    check(
      "invoice_items_description_valid",
      sql`length(trim(${table.description})) between 1 and 500`,
    ),

    check("invoice_items_amount_cents_valid", sql`${table.amountCents} >= 0`),

    index("invoice_items_invoice_id_idx").on(
      table.invoiceId,
      table.createdAt,
      table.id,
    ),

    index("invoice_items_job_id_idx").on(table.jobId),
  ],
);
