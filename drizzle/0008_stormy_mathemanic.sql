CREATE TABLE `retention_review_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` varchar(56) NOT NULL,
	`runId` varchar(40) NOT NULL,
	`recipientUserId` int NOT NULL,
	`channel` varchar(24) NOT NULL,
	`status` varchar(40) NOT NULL,
	`dueAttachmentCount` int NOT NULL,
	`overdueAttachmentCount` int NOT NULL,
	`createdAt` timestamp NOT NULL,
	`readAt` timestamp,
	CONSTRAINT `retention_review_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `retention_review_notification_identifier_unique` UNIQUE(`notificationId`),
	CONSTRAINT `retention_review_notification_delivery_unique` UNIQUE(`runId`,`recipientUserId`,`channel`)
);
--> statement-breakpoint
CREATE INDEX `retention_review_notification_recipient_idx` ON `retention_review_notifications` (`recipientUserId`,`readAt`,`createdAt`);