CREATE TABLE `tutorial_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedbackId` varchar(40) NOT NULL,
	`userId` int NOT NULL,
	`category` enum('Suggestion','Issue','Question') NOT NULL,
	`message` text NOT NULL,
	`contactEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutorial_feedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `tutorial_feedback_identifier_unique` UNIQUE(`feedbackId`)
);
--> statement-breakpoint
CREATE TABLE `user_experience_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`adminDarkMode` boolean NOT NULL DEFAULT false,
	`onboardingSteps` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_experience_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_experience_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `tutorial_feedback_user_created_idx` ON `tutorial_feedback` (`userId`,`createdAt`);