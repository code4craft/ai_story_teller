import path from 'path';
import fs from 'fs/promises';
import ConversionTask from '../models/ConversionTask';
import Chapter from '../models/Chapter';
import Character from '../models/Character';
import Voice from '../models/Voice';
import { TTSService } from './TTSService';
import { ScriptParserService } from './ScriptParserService';

export class ConversionService {
  private ttsService: TTSService;
  private scriptParser: ScriptParserService;
  private outputDir: string;

  constructor() {
    this.ttsService = new TTSService();
    this.scriptParser = new ScriptParserService();
    this.outputDir = path.join(process.cwd(), 'uploads', 'audio');
    
    // 确保输出目录存在
    this.ensureOutputDir();
  }

  private async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('创建输出目录失败:', error);
    }
  }

  /**
   * 启动转换任务
   * @param taskId 任务ID
   */
  async startConversion(taskId: string): Promise<void> {
    const task = await ConversionTask.findById(taskId)
      .populate('chapter_id');
    
    if (!task) {
      throw new Error('转换任务不存在');
    }

    try {
      await this.updateTaskProgress(taskId, 10, 'processing');

      // 获取章节和解析内容
      const chapter = await Chapter.findById(task.chapter_id)
        .populate('story_series_id', 'title');
      
      if (!chapter) {
        throw new Error('章节不存在');
      }

      await this.updateTaskProgress(taskId, 20);

      // 解析章节内容
      const parseResult = await this.scriptParser.parseChapterContent(chapter.content);
      
      await this.updateTaskProgress(taskId, 30);

      // 生成音频文件
      const audioFiles: Buffer[] = [];
      const totalDialogues = parseResult.dialogues.length;
      
      for (let i = 0; i < parseResult.dialogues.length; i++) {
        const dialogue = parseResult.dialogues[i];
        
        try {
          // 查找角色对应的音色
          const character = await Character.findOne({ name: dialogue.character })
            .populate('voice_id');
          
          let voice;
          
          if (character && character.voice_id) {
            // 使用角色配置的音色
            voice = character.voice_id as any;
          } else {
            // 如果是旁白或未找到角色，使用默认的旁白音色
            if (dialogue.character === '旁白') {
              console.log(`使用默认旁白音色为: ${dialogue.character}`);
              voice = await this.getDefaultNarratorVoice();
              
              if (!voice) {
                console.warn(`未找到适合的旁白音色，跳过`);
                continue;
              }
            } else {
              // 其他角色没有配音时，使用默认配音
              console.log(`角色 ${dialogue.character} 未找到或未配置音色，使用默认配音`);
              voice = await this.getDefaultCharacterVoice();
              
              if (!voice) {
                console.warn(`未找到默认配音，跳过角色 ${dialogue.character}`);
                continue;
              }
            }
          }
          
          // 生成音频
          const audioBuffer = await this.ttsService.textToSpeech(
            dialogue.text,
            voice.voice_id,
            {
              speed: task.settings.voice_speed,
              volume: task.settings.voice_volume,
              pitch: task.settings.voice_pitch
            }
          );
          
          audioFiles.push(audioBuffer);
          
          // 更新进度
          const progress = 30 + Math.floor((i + 1) / totalDialogues * 60);
          await this.updateTaskProgress(taskId, progress);
          
        } catch (error) {
          console.error(`生成音频失败 (${dialogue.character}): ${error}`);
          // 继续处理下一个对话
        }
      }

      await this.updateTaskProgress(taskId, 90);

      // 合并音频文件（这里简化处理，实际应该用ffmpeg等工具）
      if (audioFiles.length > 0) {
        const mergedAudio = Buffer.concat(audioFiles);
        
        // 生成文件名
        const storyTitle = (chapter.story_series_id as any)?.title || 'unknown';
        const fileName = `${storyTitle}-${chapter.title}-${Date.now()}.mp3`;
        const outputPath = path.join(this.outputDir, fileName);
        
        // 保存文件
        await fs.writeFile(outputPath, mergedAudio);
        
        // 构建完整的音频文件URL
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const audioUrl = `${baseUrl}/audio/${fileName}`;
        
        // 更新任务和章节
        await ConversionTask.findByIdAndUpdate(taskId, {
          status: 'completed',
          progress: 100,
          output_file_path: audioUrl,
          completed_at: new Date()
        });

        await Chapter.findByIdAndUpdate(chapter._id, {
          audio_file_path: audioUrl
        });
      } else {
        throw new Error('没有生成任何音频文件');
      }

    } catch (error: any) {
      console.error('转换失败:', error);
      await ConversionTask.findByIdAndUpdate(taskId, {
        status: 'failed',
        error_message: error.message
      });
      throw error;
    }
  }

  /**
   * 更新任务进度
   * @param taskId 任务ID
   * @param progress 进度百分比
   * @param status 状态
   */
  private async updateTaskProgress(
    taskId: string, 
    progress: number, 
    status?: string
  ): Promise<void> {
    const updateData: any = { progress };
    if (status) {
      updateData.status = status;
    }
    
    await ConversionTask.findByIdAndUpdate(taskId, updateData);
  }

  /**
   * 获取转换统计信息
   */
  async getConversionStats(): Promise<any> {
    const [totalTasks, pendingTasks, processingTasks, completedTasks, failedTasks] = await Promise.all([
      ConversionTask.countDocuments(),
      ConversionTask.countDocuments({ status: 'pending' }),
      ConversionTask.countDocuments({ status: 'processing' }),
      ConversionTask.countDocuments({ status: 'completed' }),
      ConversionTask.countDocuments({ status: 'failed' })
    ]);

    return {
      total: totalTasks,
      pending: pendingTasks,
      processing: processingTasks,
      completed: completedTasks,
      failed: failedTasks
    };
  }

  /**
   * 清理过期的音频文件
   * @param daysOld 删除多少天前的文件
   */
  async cleanupOldAudioFiles(daysOld: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.outputDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`删除过期音频文件: ${file}`);
        }
      }
    } catch (error) {
      console.error('清理音频文件失败:', error);
    }
  }

  /**
   * 获取默认旁白音色
   */
  private async getDefaultNarratorVoice(): Promise<any> {
    const Voice = require('../models/Voice').default;
    
    // 查找适合做旁白的音色，优先选择成人男声
    const voice = await Voice.findOne({ 
      age_type: 'adult',
      gender: 'male'
    }).sort({ created_at: 1 });
    
    return voice;
  }

  /**
   * 获取默认角色音色
   */
  private async getDefaultCharacterVoice(): Promise<any> {
    const Voice = require('../models/Voice').default;
    
    // 使用指定的默认配音
    const voice = await Voice.findOne({ 
      voice_id: 'zh_female_shaoergushi_mars_bigtts'
    });
    
    if (!voice) {
      // 如果指定的音色不存在，则使用任何可用的音色
      console.warn('指定的默认音色不存在，使用其他可用音色');
      return await Voice.findOne().sort({ created_at: 1 });
    }
    
    return voice;
  }
}