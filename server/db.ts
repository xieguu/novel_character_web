import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, novels, characters, characterRelationships, InsertCharacter } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Novel queries
export async function createNovel(userId: number, title: string, description: string | null, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(novels).values({
    userId,
    title,
    description,
    content,
  });
  return result;
}

export async function getNovelsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(novels).where(eq(novels.userId, userId));
}

export async function getNovelById(novelId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
  return result[0];
}

// Character queries
export async function createCharacter(novelId: number, characterData: Omit<InsertCharacter, 'novelId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(characters).values({
    novelId,
    ...characterData,
  });
}

export async function getCharactersByNovelId(novelId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(characters).where(eq(characters.novelId, novelId));
}

export async function updateCharacter(characterId: number, updates: Partial<InsertCharacter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(characters).set(updates).where(eq(characters.id, characterId));
}

export async function deleteCharacter(characterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(characters).where(eq(characters.id, characterId));
}

export async function getCharacterById(characterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(characters).where(eq(characters.id, characterId)).limit(1);
  return result[0];
}

// Character relationship queries
export async function createCharacterRelationship(novelId: number, characterId1: number, characterId2: number, relationshipType: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(characterRelationships).values({
    novelId,
    characterId1,
    characterId2,
    relationshipType,
    description,
  });
}

export async function getCharacterRelationshipsByNovelId(novelId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(characterRelationships).where(eq(characterRelationships.novelId, novelId));
}
