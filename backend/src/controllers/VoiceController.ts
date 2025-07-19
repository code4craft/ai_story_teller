import { Request, Response } from 'express';
import Voice, { IVoice } from '../models/Voice';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { TTSService } from '../services/TTSService';

export class VoiceController {
  private ttsService: TTSService;

  constructor() {
    this.ttsService = new TTSService();
  }

  // 获取所有音色
  getAllVoices = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, gender, age_type, provider } = req.query;
    
    const query: any = {};
    if (gender) query.gender = gender;
    if (age_type) query.age_type = age_type;
    if (provider) query.provider = provider;

    const voices = await Voice.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ created_at: -1 });

    const total = await Voice.countDocuments(query);

    res.json({
      success: true,
      data: voices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });

  // 获取单个音色
  getVoiceById = asyncHandler(async (req: Request, res: Response) => {
    const voice = await Voice.findById(req.params.id);
    
    if (!voice) {
      throw createError('音色未找到', 404);
    }

    res.json({
      success: true,
      data: voice
    });
  });

  // 创建音色
  createVoice = asyncHandler(async (req: Request, res: Response) => {
    const voice = await Voice.create(req.body);

    res.status(201).json({
      success: true,
      data: voice,
      message: '音色创建成功'
    });
  });

  // 更新音色
  updateVoice = asyncHandler(async (req: Request, res: Response) => {
    const voice = await Voice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!voice) {
      throw createError('音色未找到', 404);
    }

    res.json({
      success: true,
      data: voice,
      message: '音色更新成功'
    });
  });

  // 删除音色
  deleteVoice = asyncHandler(async (req: Request, res: Response) => {
    const voice = await Voice.findById(req.params.id);

    if (!voice) {
      throw createError('音色未找到', 404);
    }

    await voice.deleteOne();

    res.json({
      success: true,
      message: '音色删除成功'
    });
  });

  // 测试音色
  testVoice = asyncHandler(async (req: Request, res: Response) => {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      throw createError('请提供测试文本', 400);
    }

    const voice = await Voice.findById(req.params.id);
    
    if (!voice) {
      throw createError('音色未找到', 404);
    }

    try {
      // 调用TTS服务生成音频
      const audioBuffer = await this.ttsService.textToSpeech(text, voice.voice_id);
      
      // 设置响应头
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error('TTS测试失败:', error);
      throw createError('语音合成失败', 500);
    }
  });

  // 搜索音色
  searchVoices = asyncHandler(async (req: Request, res: Response) => {
    const { q, page = 1, limit = 20, gender, age_type, provider } = req.query;
    
    if (!q) {
      throw createError('请提供搜索关键词', 400);
    }

    const searchRegex = new RegExp(q as string, 'i');
    const query: any = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { voice_id: searchRegex },
        { style: searchRegex }
      ]
    };

    // 添加额外的过滤条件
    if (gender) query.gender = gender;
    if (age_type) query.age_type = age_type;
    if (provider) query.provider = provider;

    const voices = await Voice.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ created_at: -1 });

    const total = await Voice.countDocuments(query);

    res.json({
      success: true,
      data: voices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });
}