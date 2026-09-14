CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address_line1` text,
	`address_line2` text,
	`suburb` text,
	`state` text,
	`postcode` text,
	`notes` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "customers_name_required" CHECK(length(trim("customers"."name")) > 0)
);
