import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { jobs } from "./jobs";
import { users } from "./users";

export const jobStatusHistory = sqliteTable(
  "job_status_history",
  {
    id: text("id").primaryKey().notNull(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id),
    status: text("status", {
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
    }).notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    check(
      "job_status_history_status_valid",
      sql`${table.status} in ('scheduled', 'in_progress', 'completed', 'cancelled')`,
    ),
    index("job_status_history_latest_idx").on(
      table.jobId,
      table.createdAt,
      table.id,
    ),
  ],
);

