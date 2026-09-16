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

    amountCents: integer("amount_cents").notNull(),

    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    check(
      "job_items_description_valid",
      sql`length(trim(${table.description})) between 1 and 500`,
    ),

    check("job_items_amount_cents_valid", sql`${table.amountCents} >= 0`),

    index("job_items_job_id_idx").on(table.jobId, table.createdAt, table.id),
  ],
);
