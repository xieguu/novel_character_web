import { invokeLLM } from "./_core/llm";

// 随机人物生成的配置
const PERSONALITY_TRAITS = [
  "乐观", "悲观", "谨慎", "大胆", "聪慧", "朴实",
  "热情", "冷漠", "幽默", "严肃", "温柔", "粗暴",
  "诚实", "狡诈", "勤奋", "懒惰", "自信", "自卑"
];

const OCCUPATIONS = [
  "医生", "律师", "教师", "工程师", "商人", "艺术家",
  "作家", "演员", "音乐家", "摄影师", "设计师", "程序员",
  "农民", "工人", "警察", "士兵", "记者", "导演",
  "科学家", "哲学家", "建筑师", "厨师", "裁缝", "木匠"
];

const IDENTITIES = [
  "主人公", "配角", "反派", "爱人", "朋友", "敌人",
  "导师", "学生", "上司", "下属", "家人", "陌生人"
];

const GENDERS = ["男", "女", "非二元"];

const AGE_RANGES = [
  { min: 5, max: 12, label: "儿童" },
  { min: 13, max: 18, label: "青少年" },
  { min: 19, max: 35, label: "青年" },
  { min: 36, max: 55, label: "中年" },
  { min: 56, max: 100, label: "老年" }
];

interface RandomCharacterParams {
  gender?: string;
  ageRange?: string;
  occupationType?: string;
  count?: number;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAge(): number {
  const range = getRandomElement(AGE_RANGES);
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function generateRandomPersonality(): string[] {
  const count = Math.floor(Math.random() * 3) + 2; // 2-4 个特征
  const traits = new Set<string>();
  while (traits.size < count) {
    traits.add(getRandomElement(PERSONALITY_TRAITS));
  }
  return Array.from(traits);
}

export async function generateRandomCharacter(params?: RandomCharacterParams) {
  const gender = params?.gender || getRandomElement(GENDERS);
  const age = getRandomAge();
  const occupation = params?.occupationType || getRandomElement(OCCUPATIONS);
  const identity = getRandomElement(IDENTITIES);
  const personality = generateRandomPersonality();

  // 构建提示词，让 LLM 生成人物档案
  const prompt = `
你是一个创意写作助手。请根据以下基本信息生成一个虚拟人物的完整档案。

基本信息：
- 性别：${gender}
- 年龄：${age}
- 职业：${occupation}
- 身份：${identity}
- 性格特征：${personality.join("、")}

请生成以下信息（JSON 格式）：
{
  "name": "人物名字（符合性别和文化背景）",
  "appearance": "外貌描写（200字以内）",
  "motivation": "核心动机和目标（150字以内）",
  "background": "背景故事（200字以内）",
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["缺点1", "缺点2", "缺点3"]
}

请确保返回有效的 JSON 格式。`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一个专业的创意写作助手，擅长创建有趣和真实的虚拟人物。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "character_profile",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "人物名字" },
              appearance: { type: "string", description: "外貌描写" },
              motivation: { type: "string", description: "核心动机" },
              background: { type: "string", description: "背景故事" },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "优点列表"
              },
              weaknesses: {
                type: "array",
                items: { type: "string" },
                description: "缺点列表"
              }
            },
            required: ["name", "appearance", "motivation", "background", "strengths", "weaknesses"],
            additionalProperties: false
          }
        }
      }
    });

    // 解析 LLM 返回的 JSON
    const messageContent = response.choices[0]?.message.content;
    if (!messageContent) {
      throw new Error("LLM 返回空内容");
    }

    let content: string;
    if (typeof messageContent === 'string') {
      content = messageContent;
    } else if (Array.isArray(messageContent)) {
      const textItem = messageContent.find(item => item.type === 'text');
      content = textItem ? (textItem as any).text : '';
    } else {
      throw new Error("无法解析 LLM 返回内容");
    }

    const characterData = JSON.parse(content);

    return {
      name: characterData.name,
      identity: identity,
      personality: personality.join("、"),
      appearance: characterData.appearance,
      motivation: characterData.motivation,
      background: characterData.background,
      gender: gender,
      age: age,
      occupation: occupation,
      strengths: characterData.strengths,
      weaknesses: characterData.weaknesses
    };
  } catch (error) {
    console.error("生成随机人物失败:", error);
    throw error;
  }
}

export async function generateMultipleRandomCharacters(count: number = 5, params?: RandomCharacterParams) {
  const characters = [];
  for (let i = 0; i < count; i++) {
    try {
      const character = await generateRandomCharacter(params);
      characters.push(character);
    } catch (error) {
      console.error(`生成第 ${i + 1} 个人物失败:`, error);
    }
  }
  return characters;
}
