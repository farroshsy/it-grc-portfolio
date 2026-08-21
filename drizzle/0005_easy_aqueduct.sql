CREATE TABLE `flowguard_trace_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importId` varchar(40) NOT NULL,
	`executionId` varchar(40) NOT NULL,
	`sourceName` varchar(160) NOT NULL,
	`sourceShape` varchar(32) NOT NULL,
	`spanCount` int NOT NULL,
	`traceId` varchar(160) NOT NULL,
	`ingestedBy` varchar(80) NOT NULL,
	`ingestedAt` timestamp NOT NULL,
	`rawTraceStored` boolean NOT NULL DEFAULT false,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `flowguard_trace_imports_id` PRIMARY KEY(`id`),
	CONSTRAINT `flowguard_trace_import_identifier_unique` UNIQUE(`importId`),
	CONSTRAINT `flowguard_trace_import_execution_unique` UNIQUE(`executionId`)
);
--> statement-breakpoint
ALTER TABLE `evidence_attachments` ADD `retentionUntil` timestamp;--> statement-breakpoint
ALTER TABLE `evidence_attachments` ADD `retentionStatus` enum('Active','Expired','Legal hold') DEFAULT 'Active' NOT NULL;--> statement-breakpoint
ALTER TABLE `evidence_attachments` ADD `expiredAt` timestamp;--> statement-breakpoint
ALTER TABLE `evidence_attachments` ADD `retentionNote` text;--> statement-breakpoint
UPDATE `evidence_attachments` SET `retentionUntil` = DATE_ADD(`uploadedAt`, INTERVAL 365 DAY) WHERE `retentionUntil` IS NULL;--> statement-breakpoint
ALTER TABLE `evidence_attachments` MODIFY `retentionUntil` timestamp NOT NULL;--> statement-breakpoint
CREATE INDEX `flowguard_trace_imported_at_idx` ON `flowguard_trace_imports` (`ingestedAt`);--> statement-breakpoint
CREATE INDEX `evidence_attachments_retention_idx` ON `evidence_attachments` (`retentionUntil`,`retentionStatus`);
