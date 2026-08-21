CREATE TABLE `artifact_rows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` int NOT NULL,
	`sortOrder` int NOT NULL,
	`record` json NOT NULL,
	CONSTRAINT `artifact_rows_id` PRIMARY KEY(`id`),
	CONSTRAINT `artifact_row_order_unique` UNIQUE(`artifactId`,`sortOrder`)
);
--> statement-breakpoint
CREATE TABLE `artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int NOT NULL,
	`type` enum('Risk Register','Control Matrix','Gap Analysis','Regulatory Mapping','Control Testing','Remediation Plan') NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	`columns` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artifacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `artifact_type_per_case_unique` UNIQUE(`caseStudyId`,`type`)
);
--> statement-breakpoint
CREATE TABLE `case_studies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(96) NOT NULL,
	`title` varchar(160) NOT NULL,
	`shortTitle` varchar(72) NOT NULL,
	`summary` text NOT NULL,
	`scenario` text NOT NULL,
	`provenance` enum('Academic','Independent Research','Simulated Case Study') NOT NULL,
	`accent` varchar(20) NOT NULL,
	`featured` boolean NOT NULL DEFAULT true,
	`codeLanguage` varchar(32),
	`code` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `case_studies_id` PRIMARY KEY(`id`),
	CONSTRAINT `case_studies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `case_study_frameworks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int NOT NULL,
	`framework` enum('ISO 27001','PCI DSS','BI/OJK','NIST','Cloud') NOT NULL,
	CONSTRAINT `case_study_frameworks_id` PRIMARY KEY(`id`),
	CONSTRAINT `case_study_framework_unique` UNIQUE(`caseStudyId`,`framework`)
);
--> statement-breakpoint
CREATE TABLE `case_study_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int NOT NULL,
	`sectionTitle` varchar(32) NOT NULL,
	`body` text NOT NULL,
	`displayOrder` int NOT NULL,
	CONSTRAINT `case_study_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `case_study_section_order_unique` UNIQUE(`caseStudyId`,`displayOrder`)
);
--> statement-breakpoint
CREATE TABLE `control_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int NOT NULL,
	`testId` varchar(40) NOT NULL,
	`controlId` varchar(40) NOT NULL,
	`result` varchar(40) NOT NULL,
	`severity` varchar(40) NOT NULL,
	CONSTRAINT `control_tests_id` PRIMARY KEY(`id`),
	CONSTRAINT `control_test_identifier_unique` UNIQUE(`testId`)
);
--> statement-breakpoint
CREATE TABLE `controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int NOT NULL,
	`controlId` varchar(40) NOT NULL,
	`title` varchar(250) NOT NULL,
	`domain` varchar(80) NOT NULL,
	`owner` varchar(80) NOT NULL,
	`status` varchar(40) NOT NULL,
	`effectiveness` int NOT NULL,
	CONSTRAINT `controls_id` PRIMARY KEY(`id`),
	CONSTRAINT `control_identifier_unique` UNIQUE(`controlId`)
);
--> statement-breakpoint
CREATE TABLE `job_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requirement` varchar(255) NOT NULL,
	`evidence` varchar(255) NOT NULL,
	`caseStudySlug` varchar(96) NOT NULL,
	`displayOrder` int NOT NULL,
	CONSTRAINT `job_mappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_mapping_order_unique` UNIQUE(`displayOrder`)
);
--> statement-breakpoint
CREATE TABLE `remediation_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int NOT NULL,
	`actionId` varchar(40) NOT NULL,
	`title` varchar(250) NOT NULL,
	`linkedRiskId` varchar(32) NOT NULL,
	`owner` varchar(80) NOT NULL,
	`status` varchar(40) NOT NULL,
	`severity` varchar(40) NOT NULL,
	`dueDate` timestamp NOT NULL,
	CONSTRAINT `remediation_actions_id` PRIMARY KEY(`id`),
	CONSTRAINT `remediation_action_identifier_unique` UNIQUE(`actionId`)
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int NOT NULL,
	`riskId` varchar(32) NOT NULL,
	`title` varchar(250) NOT NULL,
	`category` varchar(80) NOT NULL,
	`businessUnit` varchar(80) NOT NULL,
	`likelihood` int NOT NULL,
	`impact` int NOT NULL,
	`inherentRisk` int NOT NULL,
	`residualRisk` int NOT NULL,
	`owner` varchar(80) NOT NULL,
	`status` varchar(32) NOT NULL,
	`dueDate` timestamp,
	CONSTRAINT `risks_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_identifier_unique` UNIQUE(`riskId`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseStudyId` int,
	`authority` varchar(120) NOT NULL,
	`publication` varchar(300) NOT NULL,
	`versionDate` varchar(100) NOT NULL,
	`url` text NOT NULL,
	`note` text NOT NULL,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `artifact_rows_artifact_id_idx` ON `artifact_rows` (`artifactId`);--> statement-breakpoint
CREATE INDEX `artifacts_case_study_id_idx` ON `artifacts` (`caseStudyId`);--> statement-breakpoint
CREATE INDEX `case_study_frameworks_case_study_id_idx` ON `case_study_frameworks` (`caseStudyId`);--> statement-breakpoint
CREATE INDEX `case_study_sections_case_study_id_idx` ON `case_study_sections` (`caseStudyId`);--> statement-breakpoint
CREATE INDEX `control_tests_case_study_id_idx` ON `control_tests` (`caseStudyId`);--> statement-breakpoint
CREATE INDEX `controls_case_study_id_idx` ON `controls` (`caseStudyId`);--> statement-breakpoint
CREATE INDEX `remediation_case_study_id_idx` ON `remediation_actions` (`caseStudyId`);--> statement-breakpoint
CREATE INDEX `risks_case_study_id_idx` ON `risks` (`caseStudyId`);--> statement-breakpoint
CREATE INDEX `sources_case_study_id_idx` ON `sources` (`caseStudyId`);