import api from './api';
import { ConversionTask, ApiResponse, PaginatedResponse } from '../types/api';

export interface ConversionQueryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  type?: 'chapter' | 'dialogue';
}

export interface CreateConversionTaskData {
  chapter_id: string;
  type: 'chapter' | 'dialogue';
  settings?: {
    voice_speed?: number;
    voice_volume?: number;
    voice_pitch?: number;
  };
}

class ConversionService {
  // 获取转换任务列表
  async getConversionTasks(params?: ConversionQueryParams): Promise<PaginatedResponse<ConversionTask>> {
    const response = await api.get('/conversions', { params });
    return response.data;
  }

  // 获取单个转换任务
  async getConversionTaskById(id: string): Promise<ApiResponse<ConversionTask>> {
    const response = await api.get(`/conversions/${id}`);
    return response.data;
  }

  // 创建转换任务
  async createConversionTask(data: CreateConversionTaskData): Promise<ApiResponse<ConversionTask>> {
    const response = await api.post('/conversions', data);
    return response.data;
  }

  // 启动转换任务
  async startConversionTask(id: string): Promise<ApiResponse> {
    const response = await api.post(`/conversions/${id}/start`);
    return response.data;
  }

  // 取消转换任务
  async cancelConversionTask(id: string): Promise<ApiResponse> {
    const response = await api.post(`/conversions/${id}/cancel`);
    return response.data;
  }

  // 删除转换任务
  async deleteConversionTask(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/conversions/${id}`);
    return response.data;
  }

  // 获取指定章节的转换任务
  async getConversionTasksByChapter(chapterId: string): Promise<ApiResponse<ConversionTask[]>> {
    const response = await api.get(`/conversions/chapter/${chapterId}`);
    return response.data;
  }
}

export default new ConversionService();