CREATE TABLE `tutorial_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activeStep` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutorial_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `tutorial_progress_user_unique` UNIQUE(`userId`)
);
