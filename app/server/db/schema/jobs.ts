import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { customers } from "./customers";

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey().notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    name: text("name").notNull(),
    description: text("description").notNull(),
    scheduledDate: text("scheduled_date").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    check(
      "jobs_name_valid",
      sql`length(trim(${table.name})) between 1 and 200`,
    ),
    check(
      "jobs_description_valid",
      sql`length(trim(${table.description})) between 1 and 2000`,
    ),
    index("jobs_customer_id_idx").on(table.customerId),
    index("jobs_scheduled_date_idx").on(table.scheduledDate, table.id),
  ],
);
