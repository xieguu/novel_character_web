import { invokeLLM } from "./_core/llm";

export interface ExtractedCharacter {
  name: string;
  identity: string;
  personality: string;
  appearance: string;
  motivation: string;
  relationships: string;
}

/**
 * 使用 LLM 从小说文本中提取人物信息
 */
export async function extractCharactersFromText(novelText: string): Promise<ExtractedCharacter[]> {
  const prompt = `你是一个专业的文学评论家和角色分析专家。请阅读以下小说片段，提取出其中所有出现的人物。

对于每一个人物，请提供以下信息（如果文中未提及，请留空或根据上下文合理推测）：
1. 姓名 (name)
2. 核心身份/职业 (identity)
3. 性格特征 (personality)
4. 外貌描写 (appearance)
5. 关键动机/目标 (motivation)
6. 与其他人物的关系 (relationships)

小说片段如下：
---
${novelText}
---

请以 JSON 格式返回结果，格式如下：
{
  "characters": [
    {
      "name": "人物姓名",
      "identity": "身份",
      "personality": "性格描述",
      "appearance": "外貌描述",
      "motivation": "动机",
      "relationships": "与其他人的关系"
    }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一个文学分析助手，擅长从文本中提取并结构化人物信息。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "character_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              characters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    identity: { type: "string" },
                    personality: { type: "string" },
                    appearance: { type: "string" },
                    motivation: { type: "string" },
                    relationships: { type: "string" },
                  },
                  required: ["name", "identity", "personality", "appearance", "motivation", "relationships"],
                  additionalProperties: false,
                },
              },
            },
            required: ["characters"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Unexpected response format from LLM");
    }

    const parsed = JSON.parse(content);
    return parsed.characters || [];
  } catch (error) {
    console.error("[Character Extraction] Error:", error);
    throw error;
  }
}

/**
 * 从提取的人物关系数据中解析关系网络
 */
export function parseCharacterRelationships(
  characters: ExtractedCharacter[]
): Array<{ characterName1: string; characterName2: string; relationshipType: string; description: string }> {
  const relationships: Array<{
    characterName1: string;
    characterName2: string;
    relationshipType: string;
    description: string;
  }> = [];

  // 简单的关系提取逻辑：从 relationships 字段中识别其他人物名字
  for (const character of characters) {
    const relationshipsText = character.relationships.toLowerCase();

    // 检查是否提及其他人物
    for (const otherCharacter of characters) {
      if (character.name !== otherCharacter.name && relationshipsText.includes(otherCharacter.name.toLowerCase())) {
        // 尝试识别关系类型
        let relationshipType = "related";
        if (relationshipsText.includes("朋友") || relationshipsText.includes("friend")) {
          relationshipType = "friend";
        } else if (relationshipsText.includes("敌人") || relationshipsText.includes("enemy")) {
          relationshipType = "enemy";
        } else if (relationshipsText.includes("家人") || relationshipsText.includes("family")) {
          relationshipType = "family";
        } else if (relationshipsText.includes("同事") || relationshipsText.includes("colleague")) {
          relationshipType = "colleague";
        } else if (relationshipsText.includes("爱") || relationshipsText.includes("love")) {
          relationshipType = "romantic";
        }

        relationships.push({
          characterName1: character.name,
          characterName2: otherCharacter.name,
          relationshipType,
          description: character.relationships,
        });
      }
    }
  }

  return relationships;
}
