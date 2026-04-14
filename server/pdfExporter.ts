import { PDFDocument, PDFPage, rgb, degrees } from "pdf-lib";

const fetch = globalThis.fetch;

interface CharacterInfo {
  id: number;
  name: string;
  identity?: string;
  personality?: string;
  appearance?: string;
  motivation?: string;
  avatarUrl?: string;
}

interface RelationshipInfo {
  characterId1: number;
  characterId2: number;
  type: string;
  description?: string;
}

/**
 * 生成单个人物的 PDF
 */
export async function generateCharacterPDF(character: CharacterInfo): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  // 设置字体
  const fontSize = 12;
  const titleFontSize = 24;
  const sectionFontSize = 14;

  let yPosition = height - 50;

  // 标题
  page.drawText(character.name, {
    x: 50,
    y: yPosition,
    size: titleFontSize,
    color: rgb(0, 0, 0),
  });
  yPosition -= 40;

  // 基本信息
  page.drawText("基本信息", {
    x: 50,
    y: yPosition,
    size: sectionFontSize,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;

  if (character.identity) {
    page.drawText(`身份/职业: ${character.identity}`, {
      x: 70,
      y: yPosition,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  }

  // 性格特征
  if (character.personality) {
    page.drawText("性格特征", {
      x: 50,
      y: yPosition,
      size: sectionFontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    const personalityLines = wrapText(character.personality, 80);
    for (const line of personalityLines) {
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
    }
  }

  // 外貌描写
  if (character.appearance) {
    page.drawText("外貌描写", {
      x: 50,
      y: yPosition,
      size: sectionFontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    const appearanceLines = wrapText(character.appearance, 80);
    for (const line of appearanceLines) {
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
    }
  }

  // 动机
  if (character.motivation) {
    page.drawText("动机", {
      x: 50,
      y: yPosition,
      size: sectionFontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    const motivationLines = wrapText(character.motivation, 80);
    for (const line of motivationLines) {
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
    }
  }

  // 添加头像（如果有）
  if (character.avatarUrl) {
    try {
      const imageResponse = await fetch(character.avatarUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBuffer);
      const imageDims = image.scale(0.3);
      page.drawImage(image, {
        x: width - 150,
        y: height - 150,
        width: imageDims.width,
        height: imageDims.height,
      });
    } catch (error) {
      console.error("Failed to embed avatar image:", error);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 生成多个人物的批量 PDF
 */
export async function generateCharactersBatchPDF(characters: CharacterInfo[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    const fontSize = 12;
    const titleFontSize = 24;
    const sectionFontSize = 14;

    let yPosition = height - 50;

    // 标题
    page.drawText(character.name, {
      x: 50,
      y: yPosition,
      size: titleFontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 40;

    // 基本信息
    page.drawText("基本信息", {
      x: 50,
      y: yPosition,
      size: sectionFontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;

    if (character.identity) {
      page.drawText(`身份/职业: ${character.identity}`, {
        x: 70,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }

    // 性格特征
    if (character.personality) {
      page.drawText("性格特征", {
        x: 50,
        y: yPosition,
        size: sectionFontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      const personalityLines = wrapText(character.personality, 80);
      for (const line of personalityLines) {
        page.drawText(line, {
          x: 70,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        yPosition -= 18;
      }
    }

    // 外貌描写
    if (character.appearance) {
      page.drawText("外貌描写", {
        x: 50,
        y: yPosition,
        size: sectionFontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      const appearanceLines = wrapText(character.appearance, 80);
      for (const line of appearanceLines) {
        page.drawText(line, {
          x: 70,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        yPosition -= 18;
      }
    }

    // 动机
    if (character.motivation) {
      page.drawText("动机", {
        x: 50,
        y: yPosition,
        size: sectionFontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      const motivationLines = wrapText(character.motivation, 80);
      for (const line of motivationLines) {
        page.drawText(line, {
          x: 70,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        yPosition -= 18;
      }
    }

    // 添加头像（如果有）
    if (character.avatarUrl) {
      try {
        const imageResponse = await fetch(character.avatarUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const image = await pdfDoc.embedPng(imageBuffer);
        const imageDims = image.scale(0.3);
        page.drawImage(image, {
          x: width - 150,
          y: height - 150,
          width: imageDims.width,
          height: imageDims.height,
        });
      } catch (error) {
        console.error("Failed to embed avatar image:", error);
      }
    }

    // 添加页码
    page.drawText(`第 ${i + 1} 页`, {
      x: width / 2 - 20,
      y: 30,
      size: 10,
      color: rgb(128, 128, 128),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 文本换行处理
 */
function wrapText(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = "";

  for (const char of text) {
    if (currentLine.length >= maxWidth) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine += char;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}
