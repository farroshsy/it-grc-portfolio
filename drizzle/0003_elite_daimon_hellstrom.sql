CREATE TABLE `assurance_controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`controlId` varchar(40) NOT NULL,
	`systemId` varchar(40) NOT NULL,
	`title` varchar(250) NOT NULL,
	`objective` text NOT NULL,
	`owner` varchar(80) NOT NULL,
	`frequency` varchar(60) NOT NULL,
	`framework` varchar(80) NOT NULL,
	`status` enum('Evidence requested','In testing','Effective','Exception') NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `assurance_controls_id` PRIMARY KEY(`id`),
	CONSTRAINT `assurance_control_identifier_unique` UNIQUE(`controlId`)
);
--> statement-breakpoint
CREATE TABLE `assurance_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assuranceTestId` varchar(40) NOT NULL,
	`controlId` varchar(40) NOT NULL,
	`submissionId` varchar(40) NOT NULL,
	`testProcedure` text NOT NULL,
	`result` enum('Effective','Exception') NOT NULL,
	`conclusion` text NOT NULL,
	`testedBy` varchar(80) NOT NULL,
	`testedAt` timestamp NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `assurance_tests_id` PRIMARY KEY(`id`),
	CONSTRAINT `assurance_test_identifier_unique` UNIQUE(`assuranceTestId`)
);
--> statement-breakpoint
CREATE TABLE `evidence_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` varchar(40) NOT NULL,
	`controlId` varchar(40) NOT NULL,
	`status` enum('Draft','Submitted','Under review','Accepted','Rejected') NOT NULL,
	`evidenceSummary` text NOT NULL,
	`submittedBy` varchar(80) NOT NULL,
	`submittedAt` timestamp NOT NULL,
	`reviewedBy` varchar(80),
	`reviewNote` text,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `evidence_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidence_submission_identifier_unique` UNIQUE(`submissionId`)
);
--> statement-breakpoint
CREATE TABLE `github_remediation_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkId` varchar(40) NOT NULL,
	`findingId` varchar(40) NOT NULL,
	`provider` varchar(40) NOT NULL,
	`repository` varchar(160) NOT NULL,
	`issueNumber` int,
	`issueUrl` text,
	`syncStatus` enum('Not connected','Ready to create','Synced open','Synced closed','Retest required') NOT NULL,
	`lastSyncedAt` timestamp,
	`lastError` text,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `github_remediation_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_remediation_link_identifier_unique` UNIQUE(`linkId`)
);
--> statement-breakpoint
CREATE TABLE `grc_findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`findingId` varchar(40) NOT NULL,
	`assuranceTestId` varchar(40) NOT NULL,
	`controlId` varchar(40) NOT NULL,
	`title` varchar(250) NOT NULL,
	`description` text NOT NULL,
	`severity` varchar(40) NOT NULL,
	`owner` varchar(80) NOT NULL,
	`status` enum('Open','Remediation planned','In remediation','Pending retest','Closed','Risk accepted') NOT NULL,
	`treatmentChoice` enum('Remediation','Risk acceptance') NOT NULL,
	`dueDate` timestamp NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `grc_findings_id` PRIMARY KEY(`id`),
	CONSTRAINT `grc_finding_identifier_unique` UNIQUE(`findingId`)
);
--> statement-breakpoint
CREATE TABLE `grc_systems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`systemId` varchar(40) NOT NULL,
	`name` varchar(180) NOT NULL,
	`owner` varchar(80) NOT NULL,
	`criticality` varchar(32) NOT NULL,
	`dataClassification` varchar(80) NOT NULL,
	`status` varchar(40) NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `grc_systems_id` PRIMARY KEY(`id`),
	CONSTRAINT `grc_system_identifier_unique` UNIQUE(`systemId`)
);
--> statement-breakpoint
CREATE TABLE `risk_acceptances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`acceptanceId` varchar(40) NOT NULL,
	`findingId` varchar(40) NOT NULL,
	`status` enum('Proposed','Approved','Rejected','Expired') NOT NULL,
	`rationale` text NOT NULL,
	`riskOwner` varchar(80) NOT NULL,
	`approver` varchar(80) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`decisionAt` timestamp,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	CONSTRAINT `risk_acceptances_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_acceptance_identifier_unique` UNIQUE(`acceptanceId`)
);
--> statement-breakpoint
CREATE INDEX `assurance_controls_system_idx` ON `assurance_controls` (`systemId`);--> statement-breakpoint
CREATE INDEX `assurance_tests_control_idx` ON `assurance_tests` (`controlId`);--> statement-breakpoint
CREATE INDEX `assurance_tests_submission_idx` ON `assurance_tests` (`submissionId`);--> statement-breakpoint
CREATE INDEX `evidence_submissions_control_idx` ON `evidence_submissions` (`controlId`);--> statement-breakpoint
CREATE INDEX `evidence_submissions_status_idx` ON `evidence_submissions` (`status`);--> statement-breakpoint
CREATE INDEX `github_remediation_finding_idx` ON `github_remediation_links` (`findingId`);--> statement-breakpoint
CREATE INDEX `grc_findings_control_idx` ON `grc_findings` (`controlId`);--> statement-breakpoint
CREATE INDEX `grc_findings_status_idx` ON `grc_findings` (`status`);--> statement-breakpoint
CREATE INDEX `risk_acceptances_finding_idx` ON `risk_acceptances` (`findingId`);