CREATE TABLE `job_items` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "job_items_description_valid" CHECK(length(trim("job_items"."description")) between 1 and 500),
	CONSTRAINT "job_items_amount_cents_valid" CHECK("job_items"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `job_items_job_id_idx` ON `job_items` (`job_id`,`created_at`,`id`);