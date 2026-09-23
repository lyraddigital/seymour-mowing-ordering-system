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

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey().notNull(),

    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),

    invoiceNumber: text("invoice_number"),

    status: text("status", {
      enum: ["draft", "issued", "voided"],
    })
      .notNull()
      .default("draft"),

    issuedAt: integer("issued_at"),

    dueDate: text("due_date"),

    voidedAt: integer("voided_at"),

    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("invoices_invoice_number_unique").on(table.invoiceNumber),

    index("invoices_customer_id_idx").on(table.customerId),

    index("invoices_status_idx").on(table.status),

    index("invoices_status_due_date_idx").on(table.status, table.dueDate),

    check(
      "invoices_invoice_number_valid",
      sql`
        (${table.status} = 'draft' and ${table.invoiceNumber} is null)
        or
        (${table.status} in ('issued', 'voided') and ${table.invoiceNumber} is not null)
      `,
    ),

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
      "invoices_due_date_valid",
      sql`
    (${table.status} = 'draft' and ${table.dueDate} is null)
    or
    (${table.status} in ('issued', 'voided') and ${table.dueDate} is not null)
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
