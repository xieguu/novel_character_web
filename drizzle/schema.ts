import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Novels table: stores novel projects uploaded by users
 */
export const novels = mysqlTable("novels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(), // Raw novel text
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Novel = typeof novels.$inferSelect;
export type InsertNovel = typeof novels.$inferInsert;

/**
 * Characters table: stores extracted character information
 */
export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  novelId: int("novelId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  identity: text("identity"), // Role/profession
  personality: text("personality"), // Character traits
  appearance: text("appearance"), // Physical description
  motivation: text("motivation"), // Goals and motivations
  relationships: text("relationships"), // JSON string of relationships
  avatarUrl: varchar("avatarUrl", { length: 512 }), // AI-generated avatar image URL
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

/**
 * Character relationships table: stores relationship data for network visualization
 */
export const characterRelationships = mysqlTable("character_relationships", {
  id: int("id").autoincrement().primaryKey(),
  novelId: int("novelId").notNull(),
  characterId1: int("characterId1").notNull(),
  characterId2: int("characterId2").notNull(),
  relationshipType: varchar("relationshipType", { length: 100 }).notNull(), // e.g., "friend", "enemy", "family", "colleague"
  description: text("description"), // Relationship description
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CharacterRelationship = typeof characterRelationships.$inferSelect;
export type InsertCharacterRelationship = typeof characterRelationships.$inferInsert;

/**
 * Uploads table: tracks file uploads for batch processing
 */
export const uploads = mysqlTable("uploads", {
  id: int("id").autoincrement().primaryKey(),
  novelId: int("novelId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

/**
 * Project collaborators table: tracks users who have access to a novel project
 */
export const projectCollaborators = mysqlTable("project_collaborators", {
  id: int("id").autoincrement().primaryKey(),
  novelId: int("novelId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "editor", "viewer"]).default("viewer").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;
export type InsertProjectCollaborator = typeof projectCollaborators.$inferInsert;

/**
 * Project shares table: tracks shareable links for projects
 */
export const projectShares = mysqlTable("project_shares", {
  id: int("id").autoincrement().primaryKey(),
  novelId: int("novelId").notNull(),
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  role: mysqlEnum("role", ["editor", "viewer"]).default("viewer").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectShare = typeof projectShares.$inferSelect;
export type InsertProjectShare = typeof projectShares.$inferInsert;