CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`received_at` integer NOT NULL,
	`voided_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payments_amount_cents_valid" CHECK(typeof("payments"."amount_cents") = 'integer' and "payments"."amount_cents" > 0 and "payments"."amount_cents" <= 9007199254740991)
);
--> statement-breakpoint
CREATE INDEX `payments_invoice_id_idx` ON `payments` (`invoice_id`,`received_at`,`id`);