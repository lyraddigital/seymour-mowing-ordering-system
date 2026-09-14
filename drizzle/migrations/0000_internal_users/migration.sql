CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "users_email_normalized" CHECK(length("users"."email") > 0 and "users"."email" = lower(trim("users"."email"))),
	CONSTRAINT "users_role_valid" CHECK("users"."role" in ('admin', 'operator')),
	CONSTRAINT "users_active_valid" CHECK("users"."is_active" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);