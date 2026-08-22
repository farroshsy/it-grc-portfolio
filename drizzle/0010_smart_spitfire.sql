ALTER TABLE `retention_review_notifications` ADD `deliveryAttemptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `retention_review_notifications` ADD `deliveredAt` timestamp;--> statement-breakpoint
ALTER TABLE `retention_review_notifications` ADD `deliveryError` varchar(160);