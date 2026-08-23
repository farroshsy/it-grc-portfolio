ALTER TABLE `tutorial_feedback` ADD `status` enum('New','Reviewed','Planned','Closed') DEFAULT 'New' NOT NULL;--> statement-breakpoint
ALTER TABLE `tutorial_feedback` ADD `reviewNote` text;--> statement-breakpoint
ALTER TABLE `tutorial_feedback` ADD `reviewedBy` varchar(80);--> statement-breakpoint
ALTER TABLE `tutorial_feedback` ADD `reviewedAt` timestamp;--> statement-breakpoint
CREATE INDEX `tutorial_feedback_status_created_idx` ON `tutorial_feedback` (`status`,`createdAt`);