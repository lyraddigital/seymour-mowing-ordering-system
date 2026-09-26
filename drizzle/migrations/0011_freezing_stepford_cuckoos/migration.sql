DROP INDEX `payments_invoice_id_idx`;--> statement-breakpoint
ALTER TABLE `payments` ADD `payment_date` text NOT NULL;--> statement-breakpoint
CREATE INDEX `payments_payment_date_idx` ON `payments` (`payment_date`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `payments_invoice_id_idx` ON `payments` (`invoice_id`,`payment_date`,`created_at`,`id`);--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `received_at`;