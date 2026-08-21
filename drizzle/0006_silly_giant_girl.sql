CREATE TABLE `evidence_retention_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` varchar(40) NOT NULL,
	`title` varchar(120) NOT NULL,
	`evidenceType` enum('Access review','Change record','Incident record','Vulnerability scan','Technical trace','General') NOT NULL,
	`retentionDays` int NOT NULL,
	`retentionNote` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_retention_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidence_retention_template_identifier_unique` UNIQUE(`templateId`)
);
--> statement-breakpoint
CREATE TABLE `flowguard_webhook_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` varchar(40) NOT NULL,
	`provider` varchar(40) NOT NULL,
	`active` boolean NOT NULL DEFAULT false,
	`endpointPath` varchar(160) NOT NULL,
	`updatedBy` varchar(80) NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `flowguard_webhook_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `flowguard_webhook_config_identifier_unique` UNIQUE(`configId`),
	CONSTRAINT `flowguard_webhook_provider_unique` UNIQUE(`provider`)
);
--> statement-breakpoint
CREATE TABLE `flowguard_webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` varchar(96) NOT NULL,
	`provider` varchar(40) NOT NULL,
	`receivedAt` timestamp NOT NULL,
	`status` varchar(40) NOT NULL,
	`executionId` varchar(40),
	CONSTRAINT `flowguard_webhook_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `flowguard_webhook_delivery_identifier_unique` UNIQUE(`deliveryId`)
);
--> statement-breakpoint
CREATE TABLE `grc_role_assignment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(40) NOT NULL,
	`batchId` varchar(40),
	`userId` int NOT NULL,
	`workspaceRole` enum('control_owner','grc_analyst','risk_approver') NOT NULL,
	`previousActive` boolean,
	`resultingActive` boolean NOT NULL,
	`assignedBy` varchar(80) NOT NULL,
	`occurredAt` timestamp NOT NULL,
	CONSTRAINT `grc_role_assignment_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `grc_role_assignment_event_identifier_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
ALTER TABLE `evidence_attachments` ADD `evidenceType` enum('Access review','Change record','Incident record','Vulnerability scan','Technical trace','General') DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE `evidence_attachments` ADD `retentionTemplateId` varchar(40);--> statement-breakpoint
CREATE INDEX `evidence_retention_template_type_idx` ON `evidence_retention_templates` (`evidenceType`,`active`);--> statement-breakpoint
CREATE INDEX `flowguard_webhook_delivery_received_idx` ON `flowguard_webhook_deliveries` (`receivedAt`);--> statement-breakpoint
CREATE INDEX `grc_role_assignment_event_user_idx` ON `grc_role_assignment_events` (`userId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `grc_role_assignment_event_batch_idx` ON `grc_role_assignment_events` (`batchId`);