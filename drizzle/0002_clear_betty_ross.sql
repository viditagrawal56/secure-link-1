CREATE TABLE `protected_url_authorized_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`short_url_id` text NOT NULL,
	`email` text NOT NULL,
	FOREIGN KEY (`short_url_id`) REFERENCES `short_url`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `url_access_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`short_url_id` text NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`short_url_id`) REFERENCES `short_url`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `url_access_verification_token_unique` ON `url_access_verification` (`token`);--> statement-breakpoint
ALTER TABLE `short_url` ADD `is_protected` integer DEFAULT false NOT NULL;