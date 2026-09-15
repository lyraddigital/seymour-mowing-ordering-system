CREATE TABLE `job_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`status` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "job_status_history_status_valid" CHECK("job_status_history"."status" in ('scheduled', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE INDEX `job_status_history_latest_idx` ON `job_status_history` (`job_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`description` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "jobs_description_valid" CHECK(length(trim("jobs"."description")) between 1 and 2000)
);
--> statement-breakpoint
CREATE INDEX `jobs_customer_id_idx` ON `jobs` (`customer_id`);--> statement-breakpoint
CREATE INDEX `jobs_scheduled_date_idx` ON `jobs` (`scheduled_date`,`id`);