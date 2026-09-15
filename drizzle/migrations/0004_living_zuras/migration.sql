PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_job_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`status` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "job_status_history_status_valid" CHECK("__new_job_status_history"."status" in ('scheduled', 'in_progress', 'completed', 'cancelled'))
);
--> statement-breakpoint
INSERT INTO `__new_job_status_history`("id", "job_id", "status", "created_by_user_id", "created_at") SELECT "id", "job_id", "status", "created_by_user_id", "created_at" FROM `job_status_history`;--> statement-breakpoint
DROP TABLE `job_status_history`;--> statement-breakpoint
ALTER TABLE `__new_job_status_history` RENAME TO `job_status_history`;--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;--> statement-breakpoint
CREATE INDEX `job_status_history_latest_idx` ON `job_status_history` (`job_id`,`created_at`,`id`);
