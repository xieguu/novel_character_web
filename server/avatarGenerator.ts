import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";

/**
 * 根据人物描述生成头像
 */
export async function generateCharacterAvatar(
  characterName: string,
  appearance: string,
  personality: string
): Promise<string> {
  try {
    // 构建详细的提示词
    const prompt = `Create a portrait illustration of a character named "${characterName}". 
    Appearance: ${appearance}
    Personality: ${personality}
    
    Style: anime/illustration style, professional quality, clear facial features, 
    suitable for a character profile card. The image should be a head-and-shoulders portrait.`;

    // 调用图像生成服务
    const { url: imageUrl } = await generateImage({
      prompt,
    });

    // 将生成的图像上传到 S3
    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    const fileKey = `avatars/${characterName}-${Date.now()}.png`;
    const { url: s3Url } = await storagePut(
      fileKey,
      Buffer.from(buffer),
      "image/png"
    );

    return s3Url || imageUrl;
  } catch (error) {
    console.error("[Avatar Generation Error]", error);
    throw new Error("Failed to generate character avatar");
  }
}

/**
 * 批量生成多个人物的头像
 */
export async function generateMultipleAvatars(
  characters: Array<{
    id: number;
    name: string;
    appearance?: string;
    personality?: string;
  }>
): Promise<Map<number, string>> {
  const results = new Map<number, string>();

  for (const character of characters) {
    try {
      if (!character.appearance) continue;

      const avatarUrl = await generateCharacterAvatar(
        character.name,
        character.appearance,
        character.personality || "unknown"
      );

      if (avatarUrl) {
        results.set(character.id, avatarUrl);
      }
    } catch (error) {
      console.error(
        `[Avatar Generation Error] Failed for character ${character.name}:`,
        error
      );
      // 继续处理其他人物，不中断流程
    }
  }

  return results;
}
