/**
 * MongoDB 数据模型定义
 * AI故事讲述器数据结构
 */

// 音色配置 Schema
const voiceSchema = {
  _id: "ObjectId",
  voice_id: "String", // 火山引擎音色ID，如 "zh_male_dongfanghaoran_moon_bigtts"
  name: "String", // 音色名称，如 "东方豪然"
  gender: "String", // 性别: male/female/neutral
  age_type: "String", // 年龄类型: child/young_adult/adult/middle_aged/elderly/divine/narrator
  description: "String", // 音色描述
  language: "String", // 语言，如 "zh", "en"
  style: "String", // 音色风格，如 "温和", "威严", "活泼"
  provider: "String", // 提供商，如 "volcengine"
  created_at: "Date",
  updated_at: "Date"
};

// 角色配置 Schema  
const characterSchema = {
  _id: "ObjectId",
  name: "String", // 角色名称
  gender: "String", // 性别
  age_type: "String", // 年龄类型
  personality: ["String"], // 性格特点数组
  voice_id: "ObjectId", // 关联的音色ID
  description: "String", // 角色描述
  story_series: "String", // 所属故事系列
  category: "String", // 角色分类，如 "pig_family", "work_characters"
  created_at: "Date",
  updated_at: "Date"
};

// 故事系列 Schema
const storySeriesSchema = {
  _id: "ObjectId", 
  title: "String", // 故事系列标题，如 "音乐之神的故事"
  description: "String", // 故事描述
  order: "Number", // 排序号
  status: "String", // 状态: draft/published/archived
  created_at: "Date",
  updated_at: "Date"
};

// 故事章节 Schema
const chapterSchema = {
  _id: "ObjectId",
  story_series_id: "ObjectId", // 所属故事系列ID
  title: "String", // 章节标题，如 "01-没有音乐了"
  content: "String", // Markdown格式的故事内容
  order: "Number", // 章节排序号  
  status: "String", // 状态: draft/published
  characters_used: ["ObjectId"], // 本章节使用的角色ID数组
  audio_file_path: "String", // 生成的音频文件路径（可选）
  created_at: "Date",
  updated_at: "Date"
};

// 对话片段 Schema（用于存储解析后的对话）
const dialogueSchema = {
  _id: "ObjectId",
  chapter_id: "ObjectId", // 所属章节ID
  character_id: "ObjectId", // 说话角色ID
  text: "String", // 对话文本
  line_number: "Number", // 在原文中的行号
  order: "Number", // 在章节中的顺序
  audio_file_path: "String", // 该段对话的音频文件路径（可选）
  created_at: "Date"
};

// 音频转换任务 Schema
const conversionTaskSchema = {
  _id: "ObjectId",
  chapter_id: "ObjectId", // 章节ID
  type: "String", // 任务类型: "chapter"(整章) / "dialogue"(单句对话)
  status: "String", // 状态: pending/processing/completed/failed
  progress: "Number", // 进度百分比 0-100
  output_file_path: "String", // 输出音频文件路径
  error_message: "String", // 错误信息（如果失败）
  settings: {
    voice_speed: "Number", // 语速
    voice_volume: "Number", // 音量
    voice_pitch: "Number" // 音调
  },
  created_at: "Date",
  updated_at: "Date",
  completed_at: "Date"
};

// MongoDB集合定义
const collections = {
  voices: voiceSchema,
  characters: characterSchema, 
  story_series: storySeriesSchema,
  chapters: chapterSchema,
  dialogues: dialogueSchema,
  conversion_tasks: conversionTaskSchema
};

module.exports = {
  voiceSchema,
  characterSchema,
  storySeriesSchema, 
  chapterSchema,
  dialogueSchema,
  conversionTaskSchema,
  collections
};