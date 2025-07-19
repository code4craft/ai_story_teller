import { Request, Response } from 'express';
import StorySeries, { IStorySeries } from '../models/StorySeries';
import Chapter from '../models/Chapter';
import { asyncHandler, createError } from '../middleware/errorHandler';

export class StoryController {
  // 获取所有故事系列
  getAllStorySeries = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status } = req.query;
    
    const query: any = {};
    if (status) query.status = status;

    const stories = await StorySeries.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ order: 1, created_at: -1 });

    const total = await StorySeries.countDocuments(query);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });

  // 获取单个故事系列
  getStorySeriesById = asyncHandler(async (req: Request, res: Response) => {
    const story = await StorySeries.findById(req.params.id);
    
    if (!story) {
      throw createError('故事系列未找到', 404);
    }

    res.json({
      success: true,
      data: story
    });
  });

  // 创建故事系列
  createStorySeries = asyncHandler(async (req: Request, res: Response) => {
    const story = await StorySeries.create(req.body);

    res.status(201).json({
      success: true,
      data: story,
      message: '故事系列创建成功'
    });
  });

  // 更新故事系列
  updateStorySeries = asyncHandler(async (req: Request, res: Response) => {
    const story = await StorySeries.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!story) {
      throw createError('故事系列未找到', 404);
    }

    res.json({
      success: true,
      data: story,
      message: '故事系列更新成功'
    });
  });

  // 删除故事系列
  deleteStorySeries = asyncHandler(async (req: Request, res: Response) => {
    const story = await StorySeries.findById(req.params.id);

    if (!story) {
      throw createError('故事系列未找到', 404);
    }

    // 检查是否有关联的章节
    const chapterCount = await Chapter.countDocuments({ story_series_id: req.params.id });
    if (chapterCount > 0) {
      throw createError('无法删除：该故事系列下还有章节', 400);
    }

    await story.deleteOne();

    res.json({
      success: true,
      message: '故事系列删除成功'
    });
  });

  // 获取故事系列的所有章节
  getChaptersByStory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // 验证故事系列是否存在
    const story = await StorySeries.findById(id);
    if (!story) {
      throw createError('故事系列未找到', 404);
    }

    const chapters = await Chapter.find({ story_series_id: id })
      .populate('characters_used', 'name gender age_type voice_id')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ order: 1 });

    const total = await Chapter.countDocuments({ story_series_id: id });

    res.json({
      success: true,
      data: {
        story,
        chapters
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });
}