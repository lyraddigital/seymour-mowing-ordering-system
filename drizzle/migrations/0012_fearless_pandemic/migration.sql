PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`service_price_cents` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "jobs_name_valid" CHECK(length(trim("__new_jobs"."name")) between 1 and 200),
	CONSTRAINT "jobs_description_valid" CHECK(length(trim("__new_jobs"."description")) between 1 and 2000),
	CONSTRAINT "jobs_service_price_cents_valid" CHECK("__new_jobs"."service_price_cents" is null or "__new_jobs"."service_price_cents" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_jobs`("id", "customer_id", "name", "description", "scheduled_date", "service_price_cents", "created_at", "updated_at") SELECT "id", "customer_id", "name", "description", "scheduled_date", "service_price_cents", "created_at", "updated_at" FROM `jobs`;--> statement-breakpoint
DROP TABLE `jobs`;--> statement-breakpoint
ALTER TABLE `__new_jobs` RENAME TO `jobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `jobs_customer_id_idx` ON `jobs` (`customer_id`);--> statement-breakpoint
CREATE INDEX `jobs_scheduled_date_idx` ON `jobs` (`scheduled_date`,`id`);