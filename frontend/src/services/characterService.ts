import api from './api';
import { Character, ApiResponse, PaginatedResponse } from '../types/api';

export interface CharacterQueryParams {
  page?: number;
  limit?: number;
  gender?: string;
  age_type?: string;
  story_series?: string;
  category?: string;
  q?: string; // 搜索关键词
}

export interface CreateCharacterData {
  name: string;
  gender: 'male' | 'female' | 'mixed' | 'neutral';
  age_type: string;
  personality: string[];
  voice_id: string;
  description?: string;
  story_series?: string;
  category?: string;
}

class CharacterService {
  // 获取角色列表
  async getCharacters(params?: CharacterQueryParams): Promise<PaginatedResponse<Character>> {
    const response = await api.get('/characters', { params });
    return response.data;
  }

  // 搜索角色
  async searchCharacters(params: CharacterQueryParams): Promise<PaginatedResponse<Character>> {
    const response = await api.get('/characters/search', { params });
    return response.data;
  }

  // 获取单个角色
  async getCharacterById(id: string): Promise<ApiResponse<Character>> {
    const response = await api.get(`/characters/${id}`);
    return response.data;
  }

  // 创建角色
  async createCharacter(data: CreateCharacterData): Promise<ApiResponse<Character>> {
    const response = await api.post('/characters', data);
    return response.data;
  }

  // 更新角色
  async updateCharacter(id: string, data: Partial<CreateCharacterData>): Promise<ApiResponse<Character>> {
    const response = await api.put(`/characters/${id}`, data);
    return response.data;
  }

  // 删除角色
  async deleteCharacter(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/characters/${id}`);
    return response.data;
  }

  // 获取故事系列列表（用于筛选）
  async getStorySeries(): Promise<string[]> {
    try {
      const response = await api.get('/characters/story-series');
      return response.data.data || [];
    } catch (error) {
      console.warn('获取故事系列列表失败:', error);
      return [];
    }
  }

  // 获取角色分类列表（用于筛选）
  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get('/characters/categories');
      return response.data.data || [];
    } catch (error) {
      console.warn('获取角色分类列表失败:', error);
      return [];
    }
  }

  // 更新角色配音
  async updateCharacterVoice(characterId: string, voiceId: string): Promise<ApiResponse<Character>> {
    const response = await api.patch(`/characters/${characterId}/voice`, { voice_id: voiceId });
    return response.data;
  }
}

export default new CharacterService();