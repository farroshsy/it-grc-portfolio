CREATE TABLE `retention_review_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` varchar(40) NOT NULL,
	`scheduleId` varchar(40) NOT NULL,
	`executedAt` timestamp NOT NULL,
	`dueAttachmentCount` int NOT NULL,
	`overdueAttachmentCount` int NOT NULL,
	`status` varchar(40) NOT NULL,
	CONSTRAINT `retention_review_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `retention_review_run_identifier_unique` UNIQUE(`runId`)
);
--> statement-breakpoint
CREATE TABLE `retention_review_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` varchar(40) NOT NULL,
	`active` boolean NOT NULL DEFAULT false,
	`cronExpression` varchar(80) NOT NULL,
	`thresholdDays` int NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`lastRunAt` timestamp,
	`lastRunReminderCount` int NOT NULL DEFAULT 0,
	`configuredBy` varchar(80) NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `retention_review_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `retention_review_schedule_identifier_unique` UNIQUE(`scheduleId`)
);
--> statement-breakpoint
CREATE INDEX `retention_review_runs_schedule_idx` ON `retention_review_runs` (`scheduleId`,`executedAt`);--> statement-breakpoint
CREATE INDEX `retention_review_schedule_task_uid_idx` ON `retention_review_schedules` (`scheduleCronTaskUid`);