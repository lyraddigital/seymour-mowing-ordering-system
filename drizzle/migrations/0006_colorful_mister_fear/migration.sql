CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "invoice_items_description_valid" CHECK(length(trim("invoice_items"."description")) between 1 and 500),
	CONSTRAINT "invoice_items_amount_cents_valid" CHECK("invoice_items"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `invoice_items_invoice_id_idx` ON `invoice_items` (`invoice_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issued_at` integer,
	`voided_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "invoices_status_valid" CHECK("invoices"."status" in ('draft', 'issued', 'voided')),
	CONSTRAINT "invoices_issued_at_valid" CHECK(
        ("invoices"."status" = 'draft' and "invoices"."issued_at" is null)
        or
        ("invoices"."status" in ('issued', 'voided') and "invoices"."issued_at" is not null)
      ),
	CONSTRAINT "invoices_voided_at_valid" CHECK(
        ("invoices"."status" != 'voided' and "invoices"."voided_at" is null)
        or
        ("invoices"."status" = 'voided' and "invoices"."voided_at" is not null)
      )
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoices_job_id_idx` ON `invoices` (`job_id`);--> statement-breakpoint
CREATE INDEX `invoices_customer_id_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);