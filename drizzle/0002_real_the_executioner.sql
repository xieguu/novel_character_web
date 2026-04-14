CREATE TABLE `project_collaborators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`novelId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','editor','viewer') NOT NULL DEFAULT 'viewer',
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_collaborators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`novelId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`role` enum('editor','viewer') NOT NULL DEFAULT 'viewer',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_shares_shareToken_unique` UNIQUE(`shareToken`)
);
