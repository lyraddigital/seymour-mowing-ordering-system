import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { customers } from "./customers";
import { jobs } from "./jobs";

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey().notNull(),

    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id),

    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),

    invoiceNumber: text("invoice_number").notNull(),

    status: text("status", {
      enum: ["draft", "issued", "voided"],
    })
      .notNull()
      .default("draft"),

    issuedAt: integer("issued_at"),

    voidedAt: integer("voided_at"),

    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("invoices_invoice_number_unique").on(
      table.invoiceNumber,
    ),

    index("invoices_job_id_idx").on(table.jobId),

    index("invoices_customer_id_idx").on(table.customerId),

    index("invoices_status_idx").on(table.status),

    check(
      "invoices_status_valid",
      sql`${table.status} in ('draft', 'issued', 'voided')`,
    ),

    check(
      "invoices_issued_at_valid",
      sql`
        (${table.status} = 'draft' and ${table.issuedAt} is null)
        or
        (${table.status} in ('issued', 'voided') and ${table.issuedAt} is not null)
      `,
    ),

    check(
      "invoices_voided_at_valid",
      sql`
        (${table.status} != 'voided' and ${table.voidedAt} is null)
        or
        (${table.status} = 'voided' and ${table.voidedAt} is not null)
      `,
    ),
  ],
);