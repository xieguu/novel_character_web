import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateRandomCharacter } from "./randomCharacterGenerator";

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

describe("randomCharacterGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a character with all required fields", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "李明",
              identity: "武侠小说中的侠客",
              personality: "勇敢、正义、热血",
              appearance: "高大魁梧，黑发黑眼，面容坚毅",
              motivation: "为了保护弱者，伸张正义",
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockLLMResponse);

    const character = await generateRandomCharacter();

    expect(character).toBeDefined();
    expect(character.name).toBeDefined();
    expect(typeof character.name).toBe("string");
    expect(character.name.length).toBeGreaterThan(0);
    
    expect(character.identity).toBeDefined();
    expect(typeof character.identity).toBe("string");
    
    expect(character.personality).toBeDefined();
    expect(typeof character.personality).toBe("string");
    
    expect(character.appearance).toBeDefined();
    expect(typeof character.appearance).toBe("string");
    
    expect(character.motivation).toBeDefined();
    expect(typeof character.motivation).toBe("string");
  });

  it("should handle LLM errors gracefully", async () => {
    (invokeLLM as any).mockRejectedValue(new Error("LLM service error"));

    await expect(generateRandomCharacter()).rejects.toThrow("LLM service error");
  });

  it("should handle invalid JSON response from LLM", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: "invalid json",
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockLLMResponse);

    await expect(generateRandomCharacter()).rejects.toThrow();
  });

  it("should generate character with valid personality traits", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "王芳",
              identity: "医生",
              personality: "温柔、细心、善良",
              appearance: "身材匀称，温柔的眼神",
              motivation: "治病救人，帮助他人",
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockLLMResponse);

    const character = await generateRandomCharacter();

    expect(character.personality).toBeDefined();
    expect(typeof character.personality).toBe("string");
    expect(character.personality.length).toBeGreaterThan(0);
  });

  it("should generate character with valid occupation", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "张三",
              identity: "商人",
              personality: "精明、果断",
              appearance: "穿着得体，气质沉稳",
              motivation: "积累财富，建立商业帝国",
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockLLMResponse);

    const character = await generateRandomCharacter();

    expect(character.identity).toBeDefined();
    expect(typeof character.identity).toBe("string");
    expect(character.identity.length).toBeGreaterThan(0);
  });

  it("should include all required fields in generated character", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "测试人物",
              identity: "测试身份",
              personality: "测试性格",
              appearance: "测试外貌",
              motivation: "测试动机",
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockLLMResponse);

    const character = await generateRandomCharacter();

    expect(character).toHaveProperty("name");
    expect(character).toHaveProperty("identity");
    expect(character).toHaveProperty("personality");
    expect(character).toHaveProperty("appearance");
    expect(character).toHaveProperty("motivation");
  });

  it("should handle empty response from LLM", async () => {
    const mockLLMResponse = {
      choices: [],
    };

    (invokeLLM as any).mockResolvedValue(mockLLMResponse);

    await expect(generateRandomCharacter()).rejects.toThrow();
  });

  it("should generate character with non-empty strings for all fields", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "李四",
              identity: "侠客",
              personality: "勇敢",
              appearance: "高大",
              motivation: "伸张正义",
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockLLMResponse);

    const character = await generateRandomCharacter();

    expect(character.name.length).toBeGreaterThan(0);
    expect(character.identity.length).toBeGreaterThan(0);
    expect(character.personality.length).toBeGreaterThan(0);
    expect(character.appearance.length).toBeGreaterThan(0);
    expect(character.motivation.length).toBeGreaterThan(0);
  });
});
