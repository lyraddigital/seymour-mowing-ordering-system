PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`job_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "invoice_items_description_valid" CHECK(length(trim("__new_invoice_items"."description")) between 1 and 500),
	CONSTRAINT "invoice_items_quantity_valid" CHECK("__new_invoice_items"."quantity" > 0),
	CONSTRAINT "invoice_items_unit_price_cents_valid" CHECK("__new_invoice_items"."unit_price_cents" >= 0),
	CONSTRAINT "invoice_items_amount_cents_valid" CHECK("__new_invoice_items"."amount_cents" = "__new_invoice_items"."quantity" * "__new_invoice_items"."unit_price_cents")
);
--> statement-breakpoint
INSERT INTO `__new_invoice_items`("id", "invoice_id", "job_id", "description", "quantity", "unit_price_cents", "amount_cents", "created_at") SELECT "id", "invoice_id", "job_id", "description", 1, "amount_cents", "amount_cents", "created_at" FROM `invoice_items`;--> statement-breakpoint
DROP TABLE `invoice_items`;--> statement-breakpoint
ALTER TABLE `__new_invoice_items` RENAME TO `invoice_items`;--> statement-breakpoint
CREATE INDEX `invoice_items_invoice_id_idx` ON `invoice_items` (`invoice_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `invoice_items_job_id_idx` ON `invoice_items` (`job_id`);--> statement-breakpoint
CREATE TABLE `__new_invoice_jobs` (
	`invoice_id` text NOT NULL,
	`job_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	`released_at` integer,
	PRIMARY KEY(`invoice_id`, `job_id`),
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `__new_invoice_jobs`("invoice_id", "job_id", "completed_at", "released_at")
SELECT
	ij."invoice_id",
	ij."job_id",
	coalesce(
		(
			SELECT max(h."created_at")
			FROM `job_status_history` h
			WHERE h."job_id" = ij."job_id"
				AND h."status" = 'completed'
				AND h."created_at" <= i."created_at"
		),
		(
			SELECT max(h."created_at")
			FROM `job_status_history` h
			WHERE h."job_id" = ij."job_id"
				AND h."status" = 'completed'
		),
		i."created_at"
	),
	ij."released_at"
FROM `invoice_jobs` ij
INNER JOIN `invoices` i ON i."id" = ij."invoice_id";--> statement-breakpoint
DROP TABLE `invoice_jobs`;--> statement-breakpoint
ALTER TABLE `__new_invoice_jobs` RENAME TO `invoice_jobs`;--> statement-breakpoint
CREATE INDEX `invoice_jobs_invoice_id_idx` ON `invoice_jobs` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_jobs_job_id_idx` ON `invoice_jobs` (`job_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_jobs_active_job_unique` ON `invoice_jobs` (`job_id`) WHERE `released_at` is null;--> statement-breakpoint
PRAGMA foreign_keys=ON;
