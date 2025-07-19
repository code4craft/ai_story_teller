import { Request, Response } from 'express';
import Chapter, { IChapter } from '../models/Chapter';
import Character from '../models/Character';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ScriptParserService } from '../services/ScriptParserService';

export class ChapterController {
  private scriptParser: ScriptParserService;

  constructor() {
    this.scriptParser = new ScriptParserService();
  }

  // 获取所有章节
  getAllChapters = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, story_series_id, status } = req.query;
    
    const query: any = {};
    if (story_series_id) query.story_series_id = story_series_id;
    if (status) query.status = status;

    const chapters = await Chapter.find(query)
      .populate('story_series_id', 'title')
      .populate('characters_used', 'name gender voice_id')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ story_series_id: 1, order: 1 });

    const total = await Chapter.countDocuments(query);

    res.json({
      success: true,
      data: chapters,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });

  // 获取单个章节
  getChapterById = asyncHandler(async (req: Request, res: Response) => {
    const chapter = await Chapter.findById(req.params.id)
      .populate('story_series_id', 'title description')
      .populate('characters_used', 'name gender age_type voice_id personality');
    
    if (!chapter) {
      throw createError('章节未找到', 404);
    }

    res.json({
      success: true,
      data: chapter
    });
  });

  // 创建章节
  createChapter = asyncHandler(async (req: Request, res: Response) => {
    const chapter = await Chapter.create(req.body);
    
    // 返回时包含关联信息
    const populatedChapter = await Chapter.findById(chapter._id)
      .populate('story_series_id', 'title')
      .populate('characters_used', 'name gender voice_id');

    res.status(201).json({
      success: true,
      data: populatedChapter,
      message: '章节创建成功'
    });
  });

  // 更新章节
  updateChapter = asyncHandler(async (req: Request, res: Response) => {
    // 先获取现有章节数据
    const existingChapter = await Chapter.findById(req.params.id);
    if (!existingChapter) {
      throw createError('章节未找到', 404);
    }

    // 合并更新数据，确保 story_series_id 不被覆盖为空
    const updateData = {
      ...req.body,
      story_series_id: req.body.story_series_id || existingChapter.story_series_id
    };

    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('story_series_id', 'title')
      .populate('characters_used', 'name gender voice_id');

    res.json({
      success: true,
      data: chapter,
      message: '章节更新成功'
    });
  });

  // 删除章节
  deleteChapter = asyncHandler(async (req: Request, res: Response) => {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      throw createError('章节未找到', 404);
    }

    await chapter.deleteOne();

    res.json({
      success: true,
      message: '章节删除成功'
    });
  });

  // 解析章节内容
  parseChapter = asyncHandler(async (req: Request, res: Response) => {
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      throw createError('章节未找到', 404);
    }

    try {
      // 解析章节内容
      const parseResult = await this.scriptParser.parseChapterContent(chapter.content);
      
      // 匹配角色
      const matchedCharacters = [];
      const unmatchedCharacters = [];
      
      for (const characterName of parseResult.characters_detected) {
        const character = await Character.findOne({ name: characterName });
        if (character) {
          matchedCharacters.push(character._id);
        } else {
          unmatchedCharacters.push(characterName);
        }
      }
      
      // 更新章节的使用角色
      await Chapter.findByIdAndUpdate(chapter._id, {
        characters_used: matchedCharacters
      });

      res.json({
        success: true,
        data: {
          dialogues: parseResult.dialogues,
          characters_detected: parseResult.characters_detected,
          matched_characters: matchedCharacters,
          unmatched_characters: unmatchedCharacters
        },
        message: '章节解析完成'
      });
    } catch (error: any) {
      throw createError(`章节解析失败: ${error.message}`, 500);
    }
  });
}