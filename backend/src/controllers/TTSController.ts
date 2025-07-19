import { Request, Response } from 'express';
import { TTSService } from '../services/TTSService';
import Character from '../models/Character';
import Voice from '../models/Voice';
import fs from 'fs/promises';
import path from 'path';

export class TTSController {
  private ttsService: TTSService;

  constructor() {
    this.ttsService = new TTSService();
  }

  /**
   * 生成单句对话语音
   */
  generateDialogueAudio = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, characterId, voiceId } = req.body;

      // 验证输入
      if (!text || !characterId) {
        res.status(400).json({
          success: false,
          message: '文本和角色ID是必需的'
        });
        return;
      }

      // 获取角色信息
      const character = await Character.findById(characterId).populate('voice_id');
      if (!character) {
        res.status(404).json({
          success: false,
          message: '角色不存在'
        });
        return;
      }

      // 确定使用的音色
      let targetVoiceId = voiceId;
      if (!targetVoiceId) {
        const voice = character.voice_id as any;
        if (!voice) {
          res.status(400).json({
            success: false,
            message: '角色未配置音色，请指定voiceId'
          });
          return;
        }
        targetVoiceId = voice.voice_id || voice._id;
      }

      // 获取音色信息以确认voice_id
      if (!targetVoiceId.includes('_')) {
        // 如果传入的是数据库ID，需要查找对应的voice_id
        const voice = await Voice.findById(targetVoiceId);
        if (!voice) {
          res.status(404).json({
            success: false,
            message: '指定的音色不存在'
          });
          return;
        }
        targetVoiceId = voice.voice_id;
      }

      console.log(`🎵 生成对话音频: 角色=${character.name}, 音色=${targetVoiceId}, 文本=${text.substring(0, 50)}...`);

      // 生成音频
      const audioBuffer = await this.ttsService.textToSpeech(text, targetVoiceId);

      // 设置响应头
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      // 发送音频数据
      res.send(audioBuffer);

    } catch (error: any) {
      console.error('生成对话音频失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '生成音频失败'
      });
    }
  };

  /**
   * 批量生成章节音频
   */
  generateChapterAudio = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chapterId } = req.params;
      const { dialogues } = req.body;

      if (!dialogues || !Array.isArray(dialogues)) {
        res.status(400).json({
          success: false,
          message: '对话列表是必需的'
        });
        return;
      }

      console.log(`🎵 开始生成章节 ${chapterId} 的音频，共 ${dialogues.length} 句对话`);

      const audioSegments: Buffer[] = [];
      
      for (let i = 0; i < dialogues.length; i++) {
        const dialogue = dialogues[i];
        const { text, characterId, voiceId } = dialogue;

        try {
          // 获取角色信息
          const character = await Character.findById(characterId).populate('voice_id');
          if (!character) {
            console.warn(`跳过对话 ${i + 1}: 角色 ${characterId} 不存在`);
            continue;
          }

          // 确定使用的音色
          let targetVoiceId = voiceId;
          if (!targetVoiceId) {
            const voice = character.voice_id as any;
            if (!voice) {
              console.warn(`跳过对话 ${i + 1}: 角色 ${character.name} 未配置音色`);
              continue;
            }
            targetVoiceId = voice.voice_id || voice._id;
          }

          // 获取音色信息
          if (!targetVoiceId.includes('_')) {
            const voice = await Voice.findById(targetVoiceId);
            if (!voice) {
              console.warn(`跳过对话 ${i + 1}: 音色 ${targetVoiceId} 不存在`);
              continue;
            }
            targetVoiceId = voice.voice_id;
          }

          console.log(`生成对话 ${i + 1}/${dialogues.length}: ${character.name} - ${text.substring(0, 30)}...`);

          // 生成音频
          const audioBuffer = await this.ttsService.textToSpeech(text, targetVoiceId);
          audioSegments.push(audioBuffer);

          // 添加短暂停顿（1秒静音）
          if (i < dialogues.length - 1) {
            const silenceBuffer = Buffer.alloc(16000); // 约1秒的静音（假设16khz采样率）
            audioSegments.push(silenceBuffer);
          }

        } catch (error: any) {
          console.error(`生成对话 ${i + 1} 音频失败:`, error.message);
          // 继续处理下一个对话
        }
      }

      if (audioSegments.length === 0) {
        res.status(400).json({
          success: false,
          message: '没有成功生成任何音频片段'
        });
        return;
      }

      // 合并所有音频片段
      const finalAudio = Buffer.concat(audioSegments);

      // 保存到文件（可选）
      const audioDir = path.join(process.cwd(), 'uploads', 'audio', 'chapters');
      await fs.mkdir(audioDir, { recursive: true });
      const filename = `chapter_${chapterId}_${Date.now()}.mp3`;
      const filepath = path.join(audioDir, filename);
      await fs.writeFile(filepath, finalAudio);

      console.log(`✅ 章节音频生成完成: ${filename}, 大小: ${finalAudio.length} bytes`);

      // 返回音频文件信息
      res.json({
        success: true,
        data: {
          filename,
          path: filepath,
          url: `/audio/chapters/${filename}`,
          size: finalAudio.length,
          segmentsCount: audioSegments.length
        }
      });

    } catch (error: any) {
      console.error('生成章节音频失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '生成章节音频失败'
      });
    }
  };

  /**
   * TTS服务健康检查
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const isHealthy = await this.ttsService.healthCheck();
      
      res.json({
        success: true,
        data: {
          healthy: isHealthy,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'TTS服务检查失败'
      });
    }
  };
}