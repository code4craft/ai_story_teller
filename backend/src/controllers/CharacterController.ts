import { Request, Response } from 'express';
import Character, { ICharacter } from '../models/Character';
import { asyncHandler, createError } from '../middleware/errorHandler';

export class CharacterController {
  // 获取所有角色
  getAllCharacters = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, story_series, category, gender } = req.query;
    
    const query: any = {};
    if (story_series) query.story_series = story_series;
    if (category) query.category = category;
    if (gender) query.gender = gender;

    const characters = await Character.find(query)
      .populate('voice_id', 'name voice_id gender age_type')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ created_at: -1 });

    const total = await Character.countDocuments(query);

    res.json({
      success: true,
      data: characters,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });

  // 获取单个角色
  getCharacterById = asyncHandler(async (req: Request, res: Response) => {
    const character = await Character.findById(req.params.id)
      .populate('voice_id', 'name voice_id gender age_type description');
    
    if (!character) {
      throw createError('角色未找到', 404);
    }

    res.json({
      success: true,
      data: character
    });
  });

  // 创建角色
  createCharacter = asyncHandler(async (req: Request, res: Response) => {
    const character = await Character.create(req.body);
    
    // 返回时包含关联的音色信息
    const populatedCharacter = await Character.findById(character._id)
      .populate('voice_id', 'name voice_id gender age_type');

    res.status(201).json({
      success: true,
      data: populatedCharacter,
      message: '角色创建成功'
    });
  });

  // 更新角色
  updateCharacter = asyncHandler(async (req: Request, res: Response) => {
    const character = await Character.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('voice_id', 'name voice_id gender age_type');

    if (!character) {
      throw createError('角色未找到', 404);
    }

    res.json({
      success: true,
      data: character,
      message: '角色更新成功'
    });
  });

  // 删除角色
  deleteCharacter = asyncHandler(async (req: Request, res: Response) => {
    const character = await Character.findById(req.params.id);

    if (!character) {
      throw createError('角色未找到', 404);
    }

    await character.deleteOne();

    res.json({
      success: true,
      message: '角色删除成功'
    });
  });

  // 搜索角色
  searchCharacters = asyncHandler(async (req: Request, res: Response) => {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      throw createError('请提供搜索关键词', 400);
    }

    const searchRegex = new RegExp(q as string, 'i');
    const query = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { story_series: searchRegex },
        { category: searchRegex },
        { personality: { $in: [searchRegex] } }
      ]
    };

    const characters = await Character.find(query)
      .populate('voice_id', 'name voice_id gender age_type')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ created_at: -1 });

    const total = await Character.countDocuments(query);

    res.json({
      success: true,
      data: characters,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });

  // 获取指定故事系列的角色
  getCharactersByStory = asyncHandler(async (req: Request, res: Response) => {
    const { storySeriesId } = req.params;
    
    const characters = await Character.find({ story_series: storySeriesId })
      .populate('voice_id', 'name voice_id gender age_type')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: characters
    });
  });

  // 获取所有故事系列列表
  getStorySeries = asyncHandler(async (req: Request, res: Response) => {
    const storySeries = await Character.distinct('story_series').exec();
    
    // 过滤掉空值和null值
    const validStorySeries = storySeries.filter(series => series && series.trim() !== '');
    
    res.json({
      success: true,
      data: validStorySeries.sort()
    });
  });

  // 获取所有角色分类列表
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await Character.distinct('category').exec();
    
    // 过滤掉空值和null值
    const validCategories = categories.filter(category => category && category.trim() !== '');
    
    res.json({
      success: true,
      data: validCategories.sort()
    });
  });

  // 更新角色配音
  updateCharacterVoice = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { voice_id } = req.body;

    if (!voice_id) {
      throw createError('音色ID是必需的', 400);
    }

    const character = await Character.findByIdAndUpdate(
      id,
      { voice_id },
      { new: true, runValidators: true }
    ).populate('voice_id', 'name voice_id gender age_type');

    if (!character) {
      throw createError('角色未找到', 404);
    }

    res.json({
      success: true,
      data: character,
      message: '角色配音更新成功'
    });
  });
}