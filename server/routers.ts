import { COOKIE_NAME } from "@shared/const";
import { novels } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { extractCharactersFromText, parseCharacterRelationships } from "./characterExtractor";
import { uploadNovelFile, uploadMultipleFiles } from "./fileUploadHandler";
import { generateCharacterAvatar } from "./avatarGenerator";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  novels: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        content: z.string().optional().default(""),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return db.createNovel(ctx.user.id, input.title, input.description || null, input.content);
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return db.getNovelsByUserId(ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ novelId: z.number() }))
      .query(async ({ input }) => {
        return db.getNovelById(input.novelId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getNovelById(input.id);
      })
  }),

  characters: router({
    create: protectedProcedure
      .input(z.object({
        novelId: z.number(),
        name: z.string(),
        identity: z.string().optional(),
        personality: z.string().optional(),
        appearance: z.string().optional(),
        motivation: z.string().optional(),
        relationships: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createCharacter(input.novelId, {
          name: input.name,
          identity: input.identity,
          personality: input.personality,
          appearance: input.appearance,
          motivation: input.motivation,
          relationships: input.relationships,
        });
      }),

    listByNovel: protectedProcedure
      .input(z.object({ novelId: z.number() }))
      .query(async ({ input }) => {
        return db.getCharactersByNovelId(input.novelId);
      }),

    update: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        name: z.string().optional(),
        identity: z.string().optional(),
        personality: z.string().optional(),
        appearance: z.string().optional(),
        motivation: z.string().optional(),
        relationships: z.string().optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { characterId, ...updates } = input;
        return db.updateCharacter(characterId, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteCharacter(input.characterId);
      }),

    get: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ input }) => {
        return db.getCharacterById(input.characterId);
      }),

    list: protectedProcedure
      .input(z.object({ novelId: z.number() }))
      .query(async ({ input }) => {
        return db.getCharactersByNovelId(input.novelId);
      }),

    getRelationships: protectedProcedure
      .input(z.object({ novelId: z.number() }))
      .query(async ({ input }) => {
        return db.getCharacterRelationshipsByNovelId(input.novelId);
      }),

    generateAvatar: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        name: z.string(),
        appearance: z.string(),
        personality: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const avatarUrl = await generateCharacterAvatar(
            input.name,
            input.appearance,
            input.personality || ""
          );
          
          await db.updateCharacter(input.characterId, {
            avatarUrl,
          });
          
          return { success: true, avatarUrl };
        } catch (error) {
          console.error("[Avatar Generation Error]", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate avatar",
          });
        }
      }),
  }),

  extraction: router({
    extractCharacters: protectedProcedure
      .input(z.object({
        novelId: z.number(),
        text: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        try {
          const extractedCharacters = await extractCharactersFromText(input.text);

          const savedCharacters = [];
          for (const character of extractedCharacters) {
            const result = await db.createCharacter(input.novelId, {
              name: character.name,
              identity: character.identity,
              personality: character.personality,
              appearance: character.appearance,
              motivation: character.motivation,
              relationships: character.relationships,
            });
            savedCharacters.push(result);
          }

          const relationships = parseCharacterRelationships(extractedCharacters);
          for (const rel of relationships) {
            const char1 = extractedCharacters.find(c => c.name === rel.characterName1);
            const char2 = extractedCharacters.find(c => c.name === rel.characterName2);
            if (char1 && char2) {
              // Placeholder for relationship creation
            }
          }

          return {
            success: true,
            characterCount: extractedCharacters.length,
            characters: extractedCharacters,
          };
        } catch (error) {
          console.error("[Extraction Error]", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to extract characters",
          });
        }
      }),
  }),

  relationships: router({
    listByNovel: protectedProcedure
      .input(z.object({ novelId: z.number() }))
      .query(async ({ input }) => {
        return db.getCharacterRelationshipsByNovelId(input.novelId);
      }),

    create: protectedProcedure
      .input(z.object({
        novelId: z.number(),
        characterId1: z.number(),
        characterId2: z.number(),
        relationshipType: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createCharacterRelationship(
          input.novelId,
          input.characterId1,
          input.characterId2,
          input.relationshipType,
          input.description
        );
      }),
  }),

  files: router({
    upload: protectedProcedure
      .input(z.object({
        novelId: z.number(),
        fileName: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return uploadNovelFile(ctx.user.id, input.novelId, input.fileName, input.content);
      }),

    uploadMultiple: protectedProcedure
      .input(z.object({
        novelId: z.number(),
        files: z.array(z.object({
          name: z.string(),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return uploadMultipleFiles(ctx.user.id, input.novelId, input.files);
      }),
  }),
});

export type AppRouter = typeof appRouter;
