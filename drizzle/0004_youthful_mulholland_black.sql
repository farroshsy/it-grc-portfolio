CREATE TABLE `evidence_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attachmentId` varchar(40) NOT NULL,
	`submissionId` varchar(40) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`contentType` varchar(120) NOT NULL,
	`byteSize` int NOT NULL,
	`storageKey` text NOT NULL,
	`storageUrl` text NOT NULL,
	`uploadedBy` varchar(80) NOT NULL,
	`uploadedAt` timestamp NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `evidence_attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidence_attachment_identifier_unique` UNIQUE(`attachmentId`)
);
--> statement-breakpoint
CREATE TABLE `flowguard_control_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` varchar(40) NOT NULL,
	`controlKey` varchar(40) NOT NULL,
	`mappedControlId` varchar(40) NOT NULL,
	`process` varchar(120) NOT NULL,
	`contractYaml` text NOT NULL,
	`provenanceSource` varchar(160) NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flowguard_control_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `flowguard_contract_identifier_unique` UNIQUE(`contractId`),
	CONSTRAINT `flowguard_control_key_unique` UNIQUE(`controlKey`)
);
--> statement-breakpoint
CREATE TABLE `flowguard_control_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` varchar(40) NOT NULL,
	`contractId` varchar(40) NOT NULL,
	`controlKey` varchar(40) NOT NULL,
	`mappedControlId` varchar(40) NOT NULL,
	`verdict` enum('PASS','FAIL','INCONCLUSIVE') NOT NULL,
	`traceId` varchar(160) NOT NULL,
	`evidenceHash` varchar(160) NOT NULL,
	`firstFinding` text,
	`occurredAt` timestamp NOT NULL,
	`provenanceSource` varchar(160) NOT NULL,
	`biOjkEvidenceReference` varchar(160),
	`iso27001EvidenceReference` varchar(160),
	`mappingInterpretationNote` text,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `flowguard_control_executions_id` PRIMARY KEY(`id`),
	CONSTRAINT `flowguard_execution_identifier_unique` UNIQUE(`executionId`),
	CONSTRAINT `flowguard_evidence_hash_unique` UNIQUE(`evidenceHash`)
);
--> statement-breakpoint
CREATE TABLE `flowguard_exceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exceptionId` varchar(40) NOT NULL,
	`executionId` varchar(40) NOT NULL,
	`linkedFindingId` varchar(40),
	`title` varchar(250) NOT NULL,
	`owner` varchar(80) NOT NULL,
	`dueDate` timestamp,
	`remediation` text NOT NULL,
	`retestStatus` varchar(60) NOT NULL,
	`status` varchar(60) NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `flowguard_exceptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `flowguard_exception_identifier_unique` UNIQUE(`exceptionId`)
);
--> statement-breakpoint
CREATE TABLE `grc_user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceRole` enum('control_owner','grc_analyst','risk_approver') NOT NULL,
	`assignedBy` varchar(80) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grc_user_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `grc_user_role_unique` UNIQUE(`userId`,`workspaceRole`)
);
--> statement-breakpoint
CREATE INDEX `evidence_attachments_submission_idx` ON `evidence_attachments` (`submissionId`);--> statement-breakpoint
CREATE INDEX `flowguard_contract_mapped_control_idx` ON `flowguard_control_contracts` (`mappedControlId`);--> statement-breakpoint
CREATE INDEX `flowguard_execution_control_idx` ON `flowguard_control_executions` (`mappedControlId`);--> statement-breakpoint
CREATE INDEX `flowguard_execution_occurred_idx` ON `flowguard_control_executions` (`occurredAt`);--> statement-breakpoint
CREATE INDEX `flowguard_exception_execution_idx` ON `flowguard_exceptions` (`executionId`);--> statement-breakpoint
CREATE INDEX `grc_user_roles_user_idx` ON `grc_user_roles` (`userId`);