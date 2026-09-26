import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { invoices } from "./invoices";

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey().notNull(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id),
    amountCents: integer("amount_cents").notNull(),
    paymentDate: text("payment_date").notNull(),
    voidedAt: integer("voided_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    check(
      "payments_amount_cents_valid",
      sql`typeof(${table.amountCents}) = 'integer' and ${table.amountCents} > 0 and ${table.amountCents} <= 9007199254740991`,
    ),
    index("payments_invoice_id_idx").on(
      table.invoiceId,
      table.paymentDate,
      table.createdAt,
      table.id,
    ),
    index("payments_payment_date_idx").on(
      table.paymentDate,
      table.createdAt,
      table.id,
    ),
  ],
);
