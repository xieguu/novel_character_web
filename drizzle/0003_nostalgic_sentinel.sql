CREATE TABLE `character_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`identity` text,
	`personality` text,
	`appearance` text,
	`motivation` text,
	`isPublic` int NOT NULL DEFAULT 1,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `character_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edit_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`novelId` int NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('character','relationship') NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`changes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edit_history_id` PRIMARY KEY(`id`)
);
