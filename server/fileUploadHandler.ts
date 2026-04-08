import { storagePut } from "./storage";

/**
 * 处理文件上传并返回 S3 URL
 */
export async function uploadNovelFile(
  userId: number,
  novelId: number,
  fileName: string,
  fileContent: string
): Promise<{ url: string; key: string }> {
  // 生成唯一的文件键，防止枚举
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileKey = `novels/${userId}/${novelId}/${timestamp}-${randomSuffix}-${fileName}`;

  try {
    const result = await storagePut(fileKey, fileContent, "text/plain");
    return result;
  } catch (error) {
    console.error("[File Upload Error]", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * 处理批量文件上传
 */
export async function uploadMultipleFiles(
  userId: number,
  novelId: number,
  files: Array<{ name: string; content: string }>
): Promise<Array<{ fileName: string; url: string; key: string }>> {
  const results = [];

  for (const file of files) {
    try {
      const result = await uploadNovelFile(userId, novelId, file.name, file.content);
      results.push({
        fileName: file.name,
        url: result.url,
        key: result.key,
      });
    } catch (error) {
      console.error(`[Upload Error] Failed to upload ${file.name}:`, error);
      // 继续处理其他文件，不中断
    }
  }

  return results;
}
