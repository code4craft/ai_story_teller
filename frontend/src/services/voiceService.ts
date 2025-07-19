import api from './api';
import { Voice, ApiResponse, PaginatedResponse } from '../types/api';

export interface VoiceQueryParams {
  page?: number;
  limit?: number;
  gender?: string;
  age_type?: string;
  provider?: string;
  q?: string;
}

export interface CreateVoiceData {
  voice_id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age_type: 'child' | 'young_adult' | 'adult' | 'middle_aged' | 'elderly' | 'divine' | 'narrator';
  description?: string;
  language?: string;
  style?: string;
  provider?: string;
}

export interface TestVoiceData {
  text: string;
}

class VoiceService {
  // 获取音色列表
  async getVoices(params?: VoiceQueryParams): Promise<PaginatedResponse<Voice>> {
    const response = await api.get('/voices', { params });
    return response.data;
  }

  // 获取单个音色
  async getVoiceById(id: string): Promise<ApiResponse<Voice>> {
    const response = await api.get(`/voices/${id}`);
    return response.data;
  }

  // 创建音色
  async createVoice(data: CreateVoiceData): Promise<ApiResponse<Voice>> {
    const response = await api.post('/voices', data);
    return response.data;
  }

  // 更新音色
  async updateVoice(id: string, data: Partial<CreateVoiceData>): Promise<ApiResponse<Voice>> {
    const response = await api.put(`/voices/${id}`, data);
    return response.data;
  }

  // 删除音色
  async deleteVoice(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/voices/${id}`);
    return response.data;
  }

  // 测试音色
  async testVoice(id: string, data: TestVoiceData): Promise<Blob> {
    const response = await api.post(`/voices/${id}/test`, data, {
      responseType: 'blob',
    });
    return response.data;
  }

  // 搜索音色
  async searchVoices(params: VoiceQueryParams): Promise<PaginatedResponse<Voice>> {
    const response = await api.get('/voices/search', { params });
    return response.data;
  }
}

export default new VoiceService();