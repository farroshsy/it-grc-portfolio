CREATE TABLE `grc_saved_audit_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` varchar(48) NOT NULL,
	`ownerUserId` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`workspaceRole` varchar(40),
	`assignedBy` varchar(80),
	`createdAt` timestamp NOT NULL,
	`lastUsedAt` timestamp,
	CONSTRAINT `grc_saved_audit_views_id` PRIMARY KEY(`id`),
	CONSTRAINT `grc_saved_audit_view_identifier_unique` UNIQUE(`viewId`),
	CONSTRAINT `grc_saved_audit_view_owner_title_unique` UNIQUE(`ownerUserId`,`title`)
);
--> statement-breakpoint
CREATE TABLE `retention_review_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`emailEnabled` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `retention_review_notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `retention_review_notification_preference_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `grc_saved_audit_view_owner_idx` ON `grc_saved_audit_views` (`ownerUserId`,`createdAt`);