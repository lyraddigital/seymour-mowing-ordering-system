PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_job_items` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "job_items_description_valid" CHECK(length(trim("__new_job_items"."description")) between 1 and 500),
	CONSTRAINT "job_items_quantity_valid" CHECK(typeof("__new_job_items"."quantity") = 'integer' and "__new_job_items"."quantity" > 0),
	CONSTRAINT "job_items_unit_price_cents_valid" CHECK(typeof("__new_job_items"."unit_price_cents") = 'integer' and "__new_job_items"."unit_price_cents" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_job_items`("id", "job_id", "description", "quantity", "unit_price_cents", "created_at", "updated_at") SELECT "id", "job_id", "description", 1, "amount_cents", "created_at", "updated_at" FROM `job_items`;--> statement-breakpoint
DROP TABLE `job_items`;--> statement-breakpoint
ALTER TABLE `__new_job_items` RENAME TO `job_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `job_items_job_id_idx` ON `job_items` (`job_id`,`created_at`,`id`);