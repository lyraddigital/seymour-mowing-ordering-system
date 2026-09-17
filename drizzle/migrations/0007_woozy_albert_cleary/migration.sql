PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_number` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`issued_at` integer,
	`voided_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "invoices_invoice_number_valid" CHECK(
    ("__new_invoices"."status" = 'draft' and "__new_invoices"."invoice_number" is null)
    or
    ("__new_invoices"."status" in ('issued', 'voided') and "__new_invoices"."invoice_number" is not null)
  ),
	CONSTRAINT "invoices_status_valid" CHECK("__new_invoices"."status" in ('draft', 'issued', 'voided')),
	CONSTRAINT "invoices_issued_at_valid" CHECK(
        ("__new_invoices"."status" = 'draft' and "__new_invoices"."issued_at" is null)
        or
        ("__new_invoices"."status" in ('issued', 'voided') and "__new_invoices"."issued_at" is not null)
      ),
	CONSTRAINT "invoices_voided_at_valid" CHECK(
        ("__new_invoices"."status" != 'voided' and "__new_invoices"."voided_at" is null)
        or
        ("__new_invoices"."status" = 'voided' and "__new_invoices"."voided_at" is not null)
      )
);
--> statement-breakpoint
INSERT INTO `__new_invoices`("id", "job_id", "customer_id", "invoice_number", "status", "issued_at", "voided_at", "created_at", "updated_at") SELECT "id", "job_id", "customer_id", "invoice_number", "status", "issued_at", "voided_at", "created_at", "updated_at" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoices_job_id_idx` ON `invoices` (`job_id`);--> statement-breakpoint
CREATE INDEX `invoices_customer_id_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);