CREATE TABLE `audit_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int NOT NULL,
	`requestId` varchar(40) NOT NULL,
	`title` varchar(250) NOT NULL,
	`domain` varchar(80) NOT NULL,
	`owner` varchar(80) NOT NULL,
	`status` enum('Requested','In review','Closed','Overdue') NOT NULL,
	`dueDate` timestamp NOT NULL,
	`closureEvidence` text NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `audit_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_request_identifier_unique` UNIQUE(`requestId`)
);
--> statement-breakpoint
CREATE TABLE `policy_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyId` varchar(40) NOT NULL,
	`title` varchar(180) NOT NULL,
	`domain` varchar(80) NOT NULL,
	`owner` varchar(80) NOT NULL,
	`version` varchar(24) NOT NULL,
	`reviewCycle` varchar(80) NOT NULL,
	`status` enum('Current','Review due') NOT NULL,
	`purpose` text NOT NULL,
	`operatingRules` json NOT NULL,
	`evidenceExamples` json NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `policy_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `policy_record_identifier_unique` UNIQUE(`policyId`)
);
--> statement-breakpoint
CREATE INDEX `audit_requests_case_study_id_idx` ON `audit_requests` (`caseStudyId`);--> statement-breakpoint
CREATE INDEX `audit_requests_status_idx` ON `audit_requests` (`status`);--> statement-breakpoint
CREATE INDEX `policy_records_domain_idx` ON `policy_records` (`domain`);