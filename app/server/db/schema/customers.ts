import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    suburb: text("suburb"),
    state: text("state"),
    postcode: text("postcode"),
    notes: text("notes"),
    archivedAt: integer("archived_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    check("customers_name_required", sql`length(trim(${table.name})) > 0`),
  ],
);
