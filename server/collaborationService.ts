import { getDb } from "./db";
import { projectCollaborators, projectShares, editHistory } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generate a unique share token
 */
export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Add a collaborator to a project
 */
export async function addCollaborator(
  novelId: number,
  userId: number,
  role: "owner" | "editor" | "viewer"
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(projectCollaborators).values({
      novelId,
      userId,
      role,
    });
    return { success: true, id: (result as any).insertId };
  } catch (error) {
    throw new Error(`Failed to add collaborator: ${error}`);
  }
}

/**
 * Remove a collaborator from a project
 */
export async function removeCollaborator(novelId: number, userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .delete(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.novelId, novelId),
          eq(projectCollaborators.userId, userId)
        )
      );
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to remove collaborator: ${error}`);
  }
}

/**
 * Update collaborator role
 */
export async function updateCollaboratorRole(
  novelId: number,
  userId: number,
  role: "owner" | "editor" | "viewer"
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .update(projectCollaborators)
      .set({ role })
      .where(
        and(
          eq(projectCollaborators.novelId, novelId),
          eq(projectCollaborators.userId, userId)
        )
      );
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update collaborator role: ${error}`);
  }
}

/**
 * Get all collaborators for a project
 */
export async function getCollaborators(novelId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const collaborators = await db
      .select()
      .from(projectCollaborators)
      .where(eq(projectCollaborators.novelId, novelId));
    return collaborators;
  } catch (error) {
    throw new Error(`Failed to get collaborators: ${error}`);
  }
}

/**
 * Create a shareable link for a project
 */
export async function createShareLink(
  novelId: number,
  role: "editor" | "viewer",
  expiresAt?: Date
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const shareToken = generateShareToken();
    const result = await db.insert(projectShares).values({
      novelId,
      shareToken,
      role,
      expiresAt,
    });
    return { success: true, shareToken, id: (result as any).insertId };
  } catch (error) {
    throw new Error(`Failed to create share link: ${error}`);
  }
}

/**
 * Verify and get share link details
 */
export async function verifyShareLink(shareToken: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const shares = await db
      .select()
      .from(projectShares)
      .where(eq(projectShares.shareToken, shareToken));

    if (shares.length === 0) {
      throw new Error("Share link not found");
    }

    const share = shares[0];

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      throw new Error("Share link has expired");
    }

    return { success: true, share };
  } catch (error) {
    throw new Error(`Failed to verify share link: ${error}`);
  }
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(shareToken: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .delete(projectShares)
      .where(eq(projectShares.shareToken, shareToken));
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to revoke share link: ${error}`);
  }
}

/**
 * Record an edit action
 */
export async function recordEdit(
  novelId: number,
  userId: number,
  entityType: "character" | "relationship",
  entityId: number,
  action: "create" | "update" | "delete",
  changes?: Record<string, any>
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(editHistory).values({
      novelId,
      userId,
      entityType,
      entityId,
      action,
      changes: changes ? JSON.stringify(changes) : null,
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to record edit: ${error}`);
  }
}

/**
 * Get edit history for a project
 */
export async function getEditHistory(novelId: number, limit = 50) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const history = await db
      .select()
      .from(editHistory)
      .where(eq(editHistory.novelId, novelId))
      .orderBy((t: any) => [t.createdAt])
      .limit(limit);

    return history.map((h: any) => ({
      ...h,
      changes: h.changes ? JSON.parse(h.changes) : null,
    }));
  } catch (error) {
    throw new Error(`Failed to get edit history: ${error}`);
  }
}

/**
 * Get edit history for a specific entity
 */
export async function getEntityEditHistory(
  novelId: number,
  entityType: "character" | "relationship",
  entityId: number
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const history = await db
      .select()
      .from(editHistory)
      .where(
        and(
          eq(editHistory.novelId, novelId),
          eq(editHistory.entityType, entityType),
          eq(editHistory.entityId, entityId)
        )
      )
      .orderBy((t: any) => [t.createdAt]);

    return history.map((h: any) => ({
      ...h,
      changes: h.changes ? JSON.parse(h.changes) : null,
    }));
  } catch (error) {
    throw new Error(`Failed to get entity edit history: ${error}`);
  }
}

/**
 * Check user permission for a project
 */
export async function checkPermission(
  novelId: number,
  userId: number,
  requiredRole: "owner" | "editor" | "viewer"
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const collaborators = await db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.novelId, novelId),
          eq(projectCollaborators.userId, userId)
        )
      );

    if (collaborators.length === 0) {
      return false;
    }
    const userRole = collaborators[0].role as "owner" | "editor" | "viewer";
    const roleHierarchy: Record<string, number> = { owner: 3, editor: 2, viewer: 1 };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  } catch (error) {
    throw new Error(`Failed to check permission: ${error}`);
  }
}
