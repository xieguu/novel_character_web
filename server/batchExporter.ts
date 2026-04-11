import { Character } from "@shared/types";

/**
 * 生成单个人物的 Markdown 内容
 */
export function generateCharacterMarkdown(character: Character): string {
  return `# ${character.name}

## 基本信息
- **身份**: ${character.identity || "未知"}
- **性格**: ${character.personality || "未知"}

## 外貌描写
${character.appearance || "暂无描写"}

## 核心动机
${character.motivation || "暂无信息"}

## 人物关系
${character.relationships || "暂无关系信息"}

---
*生成时间: ${new Date().toLocaleString('zh-CN')}*
`;
}

/**
 * 生成所有人物的 Markdown 内容（合并为一个文件）
 */
export function generateAllCharactersMarkdown(
  characters: Character[],
  novelTitle: string
): string {
  const content = `# ${novelTitle} - 人物档案

## 人物列表 (共 ${characters.length} 人)

${characters.map((c) => `- [${c.name}](#${c.name})`).join("\n")}

---

${characters.map((c) => generateCharacterMarkdown(c)).join("\n\n---\n\n")}
`;

  return content;
}

/**
 * 生成 CSV 格式的人物数据
 */
export function generateCharactersCSV(characters: Character[]): string {
  const headers = ["姓名", "身份", "性格", "外貌", "动机", "关系"];
  const rows = characters.map((c) => [
    c.name,
    c.identity || "",
    c.personality || "",
    c.appearance || "",
    c.motivation || "",
    c.relationships || "",
  ]);

  // 处理 CSV 转义
  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

/**
 * 生成 JSON 格式的人物数据
 */
export function generateCharactersJSON(
  characters: Character[],
  novelTitle: string
): string {
  const data = {
    novel: novelTitle,
    exportTime: new Date().toISOString(),
    totalCharacters: characters.length,
    characters: characters.map((c) => ({
      name: c.name,
      identity: c.identity || "",
      personality: c.personality || "",
      appearance: c.appearance || "",
      motivation: c.motivation || "",
      relationships: c.relationships || "",
      avatarUrl: c.avatarUrl || "",
    })),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * 创建导出数据包（返回多个文件的内容）
 */
export function createExportPackage(
  characters: Character[],
  novelTitle: string
): Record<string, string> {
  const files: Record<string, string> = {};

  // 添加每个人物的单独 Markdown 文件
  characters.forEach((character) => {
    const markdown = generateCharacterMarkdown(character);
    files[`${character.name}.md`] = markdown;
  });

  // 添加合并的 Markdown 文件
  const allMarkdown = generateAllCharactersMarkdown(characters, novelTitle);
  files["全部人物.md"] = allMarkdown;

  // 添加 CSV 文件
  const csv = generateCharactersCSV(characters);
  files["人物数据.csv"] = csv;

  // 添加 JSON 文件
  const json = generateCharactersJSON(characters, novelTitle);
  files["人物数据.json"] = json;

  return files;
}

/**
 * 下载文件到用户电脑（客户端使用）
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
