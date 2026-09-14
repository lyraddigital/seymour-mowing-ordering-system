import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey().notNull(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    role: text("role", { enum: ["admin", "operator"] }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    check(
      "users_email_normalized",
      sql`length(${table.email}) > 0 and ${table.email} = lower(trim(${table.email}))`,
    ),
    check("users_role_valid", sql`${table.role} in ('admin', 'operator')`),
    check("users_active_valid", sql`${table.isActive} in (0, 1)`),
  ],
);
