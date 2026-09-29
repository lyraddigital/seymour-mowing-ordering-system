import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { jobs } from "./jobs";

export const jobItems = sqliteTable(
  "job_items",
  {
    id: text("id").primaryKey().notNull(),

    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id),

    description: text("description").notNull(),

    quantity: integer("quantity").notNull().default(1),

    unitPriceCents: integer("unit_price_cents").notNull(),

    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    check(
      "job_items_description_valid",
      sql`length(trim(${table.description})) between 1 and 500`,
    ),

    check(
      "job_items_quantity_valid",
      sql`typeof(${table.quantity}) = 'integer' and ${table.quantity} > 0`,
    ),

    check(
      "job_items_unit_price_cents_valid",
      sql`typeof(${table.unitPriceCents}) = 'integer' and ${table.unitPriceCents} >= 0`,
    ),

    index("job_items_job_id_idx").on(table.jobId, table.createdAt, table.id),
  ],
);
