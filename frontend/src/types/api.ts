// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 音色类型
export interface Voice {
  _id: string;
  voice_id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age_type: 'child' | 'young_adult' | 'adult' | 'middle_aged' | 'elderly' | 'divine' | 'narrator';
  description?: string;
  language: string;
  style?: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

// 角色类型
export interface Character {
  _id: string;
  name: string;
  gender: 'male' | 'female' | 'mixed' | 'neutral';
  age_type: string;
  personality: string[];
  voice_id: string | Voice;
  description?: string;
  story_series?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

// 故事系列类型
export interface StorySeries {
  _id: string;
  title: string;
  description?: string;
  order: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

// 章节类型
export interface Chapter {
  _id: string;
  story_series_id: string | StorySeries;
  title: string;
  content: string;
  order: number;
  status: 'draft' | 'published';
  characters_used: (string | Character)[];
  audio_file_path?: string;
  created_at: string;
  updated_at: string;
}

// 转换任务类型
export interface ConversionTask {
  _id: string;
  chapter_id: string | Chapter;
  type: 'chapter' | 'dialogue';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  output_file_path?: string;
  error_message?: string;
  settings: {
    voice_speed: number;
    voice_volume: number;
    voice_pitch: number;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// 对话解析结果
export interface DialogueLine {
  character: string;
  text: string;
  line_number: number;
  character_id?: string;
}

// 章节解析结果
export interface ChapterParseResult {
  dialogues: DialogueLine[];
  characters_detected: string[];
  unmatched_characters: string[];
}