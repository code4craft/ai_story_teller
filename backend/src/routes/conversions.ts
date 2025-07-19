import express from 'express';
import { ConversionController } from '../controllers/ConversionController';
import { validateConversionTask } from '../validators/conversionValidator';

const router = express.Router();
const conversionController = new ConversionController();

// GET /api/conversions - 获取所有转换任务
router.get('/', conversionController.getAllTasks);

// GET /api/conversions/:id - 获取单个转换任务
router.get('/:id', conversionController.getTaskById);

// POST /api/conversions - 创建新的转换任务
router.post('/', validateConversionTask, conversionController.createTask);

// DELETE /api/conversions/:id - 删除转换任务
router.delete('/:id', conversionController.deleteTask);

// POST /api/conversions/:id/start - 启动转换任务
router.post('/:id/start', conversionController.startTask);

// POST /api/conversions/:id/cancel - 取消转换任务
router.post('/:id/cancel', conversionController.cancelTask);

// GET /api/conversions/chapter/:chapterId - 获取指定章节的转换任务
router.get('/chapter/:chapterId', conversionController.getTasksByChapter);

export default router;