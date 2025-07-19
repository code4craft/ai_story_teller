import { Request, Response } from 'express';
import ConversionTask, { IConversionTask } from '../models/ConversionTask';
import Chapter from '../models/Chapter';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ConversionService } from '../services/ConversionService';

export class ConversionController {
  private conversionService: ConversionService;

  constructor() {
    this.conversionService = new ConversionService();
  }

  // 获取所有转换任务
  getAllTasks = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status, type } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const tasks = await ConversionTask.find(query)
      .populate('chapter_id', 'title story_series_id')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ created_at: -1 });

    const total = await ConversionTask.countDocuments(query);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });

  // 获取单个转换任务
  getTaskById = asyncHandler(async (req: Request, res: Response) => {
    const task = await ConversionTask.findById(req.params.id)
      .populate('chapter_id', 'title content story_series_id');
    
    if (!task) {
      throw createError('转换任务未找到', 404);
    }

    res.json({
      success: true,
      data: task
    });
  });

  // 创建转换任务
  createTask = asyncHandler(async (req: Request, res: Response) => {
    const { chapter_id } = req.body;
    
    // 验证章节是否存在
    const chapter = await Chapter.findById(chapter_id);
    if (!chapter) {
      throw createError('章节不存在', 404);
    }

    // 检查是否已有进行中的任务
    const existingTask = await ConversionTask.findOne({
      chapter_id,
      status: { $in: ['pending', 'processing'] }
    });

    if (existingTask) {
      throw createError('该章节已有进行中的转换任务', 400);
    }

    const task = await ConversionTask.create(req.body);
    
    const populatedTask = await ConversionTask.findById(task._id)
      .populate('chapter_id', 'title story_series_id');

    res.status(201).json({
      success: true,
      data: populatedTask,
      message: '转换任务创建成功'
    });
  });

  // 删除转换任务
  deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await ConversionTask.findById(req.params.id);

    if (!task) {
      throw createError('转换任务未找到', 404);
    }

    // 不能删除进行中的任务
    if (task.status === 'processing') {
      throw createError('不能删除正在进行中的任务', 400);
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: '转换任务删除成功'
    });
  });

  // 启动转换任务
  startTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await ConversionTask.findById(req.params.id)
      .populate('chapter_id');

    if (!task) {
      throw createError('转换任务未找到', 404);
    }

    if (task.status !== 'pending') {
      throw createError('只能启动等待中的任务', 400);
    }

    try {
      // 更新任务状态为处理中
      await ConversionTask.findByIdAndUpdate(task._id, {
        status: 'processing',
        progress: 0
      });

      // 启动转换过程（异步）
      this.conversionService.startConversion(String(task._id)).catch(error => {
        console.error('转换任务执行失败:', error);
        // 更新任务状态为失败
        ConversionTask.findByIdAndUpdate(String(task._id), {
          status: 'failed',
          error_message: error.message
        }).catch(console.error);
      });

      res.json({
        success: true,
        message: '转换任务已启动'
      });
    } catch (error: any) {
      throw createError(`启动转换任务失败: ${error.message}`, 500);
    }
  });

  // 取消转换任务
  cancelTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await ConversionTask.findById(req.params.id);

    if (!task) {
      throw createError('转换任务未找到', 404);
    }

    if (!['pending', 'processing'].includes(task.status)) {
      throw createError('只能取消等待中或进行中的任务', 400);
    }

    await ConversionTask.findByIdAndUpdate(task._id, {
      status: 'failed',
      error_message: '用户取消'
    });

    res.json({
      success: true,
      message: '转换任务已取消'
    });
  });

  // 获取指定章节的转换任务
  getTasksByChapter = asyncHandler(async (req: Request, res: Response) => {
    const { chapterId } = req.params;
    
    const tasks = await ConversionTask.find({ chapter_id: chapterId })
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: tasks
    });
  });
}