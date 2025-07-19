import api from './api';
import { StorySeries, Chapter, ApiResponse, PaginatedResponse } from '../types/api';

export interface StoryQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CreateStoryData {
  title: string;
  description?: string;
  order?: number;
  status?: 'draft' | 'published' | 'archived';
}

export interface ChapterQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CreateChapterData {
  story_series_id: string;
  title: string;
  content: string;
  order?: number;
  status?: 'draft' | 'published';
  characters_used?: string[];
}

class StoryService {
  // Story Series相关方法
  async getStorySeries(params?: StoryQueryParams): Promise<PaginatedResponse<StorySeries>> {
    const response = await api.get('/stories', { params });
    return response.data;
  }

  async getStorySeriesById(id: string): Promise<ApiResponse<StorySeries>> {
    const response = await api.get(`/stories/${id}`);
    return response.data;
  }

  async createStorySeries(data: CreateStoryData): Promise<ApiResponse<StorySeries>> {
    const response = await api.post('/stories', data);
    return response.data;
  }

  async updateStorySeries(id: string, data: Partial<CreateStoryData>): Promise<ApiResponse<StorySeries>> {
    const response = await api.put(`/stories/${id}`, data);
    return response.data;
  }

  async deleteStorySeries(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/stories/${id}`);
    return response.data;
  }

  // Chapter相关方法
  async getChaptersByStory(storyId: string): Promise<ApiResponse<Chapter[]>> {
    const response = await api.get(`/stories/${storyId}/chapters`);
    return response.data;
  }

  async getChapterById(chapterId: string): Promise<ApiResponse<Chapter>> {
    const response = await api.get(`/chapters/${chapterId}`);
    return response.data;
  }

  async createChapter(data: CreateChapterData): Promise<ApiResponse<Chapter>> {
    const response = await api.post('/chapters', data);
    return response.data;
  }

  async updateChapter(id: string, data: Partial<CreateChapterData>): Promise<ApiResponse<Chapter>> {
    const response = await api.put(`/chapters/${id}`, data);
    return response.data;
  }

  async deleteChapter(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/chapters/${id}`);
    return response.data;
  }

  // 解析章节内容（提取对话）
  async parseChapter(id: string): Promise<ApiResponse<any>> {
    const response = await api.post(`/chapters/${id}/parse`);
    return response.data;
  }

  // 更新章节顺序
  async updateChapterOrder(storyId: string, chapterOrders: { id: string; order: number }[]): Promise<ApiResponse> {
    const response = await api.put(`/stories/${storyId}/chapters/reorder`, { chapters: chapterOrders });
    return response.data;
  }

  // 生成单句对话语音
  async generateDialogueAudio(data: {
    text: string;
    characterId: string;
    voiceId?: string;
  }): Promise<Blob> {
    const response = await api.post('/tts/generate-dialogue', data, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new StoryService();