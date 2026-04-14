import { getDb } from "./db";
import { characterTemplates, characters } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get all public templates
 */
export async function getPublicTemplates() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const templates = await db
      .select()
      .from(characterTemplates)
      .where(eq(characterTemplates.isPublic, 1));
    return templates;
  } catch (error) {
    throw new Error(`Failed to get public templates: ${error}`);
  }
}

/**
 * Get user's private templates
 */
export async function getUserTemplates(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const templates = await db
      .select()
      .from(characterTemplates)
      .where(
        and(
          eq(characterTemplates.userId, userId),
          eq(characterTemplates.isPublic, 0)
        )
      );
    return templates;
  } catch (error) {
    throw new Error(`Failed to get user templates: ${error}`);
  }
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const templates = await db
      .select()
      .from(characterTemplates)
      .where(
        and(
          eq(characterTemplates.category, category),
          eq(characterTemplates.isPublic, 1)
        )
      );
    return templates;
  } catch (error) {
    throw new Error(`Failed to get templates by category: ${error}`);
  }
}

/**
 * Create a new template
 */
export async function createTemplate(
  name: string,
  description: string | undefined,
  category: string,
  identity: string | undefined,
  personality: string | undefined,
  appearance: string | undefined,
  motivation: string | undefined,
  isPublic: number,
  userId?: number
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(characterTemplates).values({
      name,
      description,
      category,
      identity,
      personality,
      appearance,
      motivation,
      isPublic,
      userId,
    });
    return { success: true, id: (result as any).insertId };
  } catch (error) {
    throw new Error(`Failed to create template: ${error}`);
  }
}

/**
 * Create a character from template
 */
export async function createCharacterFromTemplate(
  novelId: number,
  templateId: number,
  characterName: string,
  overrides?: Partial<{
    identity: string;
    personality: string;
    appearance: string;
    motivation: string;
  }>
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get template
    const templates = await db
      .select()
      .from(characterTemplates)
      .where(eq(characterTemplates.id, templateId));

    if (templates.length === 0) {
      throw new Error("Template not found");
    }

    const template = templates[0];

    // Create character with template data + overrides
    const result = await db.insert(characters).values({
      novelId,
      name: characterName,
      identity: overrides?.identity || template.identity || undefined,
      personality: overrides?.personality || template.personality || undefined,
      appearance: overrides?.appearance || template.appearance || undefined,
      motivation: overrides?.motivation || template.motivation || undefined,
      relationships: undefined,
    });

    return { success: true, characterId: (result as any).insertId };
  } catch (error) {
    throw new Error(`Failed to create character from template: ${error}`);
  }
}

/**
 * Get predefined template categories
 */
export function getTemplateCategories(): string[] {
  return [
    "protagonist",
    "antagonist",
    "supporting",
    "mentor",
    "love_interest",
    "comic_relief",
    "villain",
    "hero",
    "anti_hero",
    "sidekick",
  ];
}

/**
 * Initialize default templates
 */
export async function initializeDefaultTemplates() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const defaultTemplates = [
      {
        name: "Classic Protagonist",
        description: "A heroic character with strong moral values",
        category: "protagonist",
        identity: "Hero",
        personality: "Brave, determined, compassionate",
        appearance: "Athletic build, noble bearing",
        motivation: "To save the world and protect loved ones",
        isPublic: 1,
      },
      {
        name: "Dark Antagonist",
        description: "A powerful villain with complex motivations",
        category: "antagonist",
        identity: "Villain",
        personality: "Cunning, ambitious, ruthless",
        appearance: "Imposing presence, mysterious aura",
        motivation: "To achieve power and dominance",
        isPublic: 1,
      },
      {
        name: "Wise Mentor",
        description: "An experienced guide who helps the protagonist",
        category: "mentor",
        identity: "Mentor/Teacher",
        personality: "Wise, patient, mysterious",
        appearance: "Aged, carries an air of knowledge",
        motivation: "To pass on wisdom and guide the next generation",
        isPublic: 1,
      },
      {
        name: "Comic Relief",
        description: "A humorous character who lightens the mood",
        category: "comic_relief",
        identity: "Jester/Comedian",
        personality: "Witty, funny, lighthearted",
        appearance: "Expressive features, animated",
        motivation: "To make others laugh and enjoy life",
        isPublic: 1,
      },
      {
        name: "Love Interest",
        description: "A romantic character who captures hearts",
        category: "love_interest",
        identity: "Romantic Partner",
        personality: "Charming, passionate, empathetic",
        appearance: "Attractive, warm presence",
        motivation: "To find true love and connection",
        isPublic: 1,
      },
    ];

    for (const template of defaultTemplates) {
      const existing = await db
        .select()
        .from(characterTemplates)
        .where(eq(characterTemplates.name, template.name));

      if (existing.length === 0) {
        await db.insert(characterTemplates).values(template);
      }
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to initialize default templates: ${error}`);
  }
}
