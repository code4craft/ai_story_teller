import express from 'express';
import { StoryController } from '../controllers/StoryController';
import { validateStorySeries } from '../validators/storyValidator';

const router = express.Router();
const storyController = new StoryController();

// GET /api/stories - 获取所有故事系列
router.get('/', storyController.getAllStorySeries);

// GET /api/stories/:id - 获取单个故事系列
router.get('/:id', storyController.getStorySeriesById);

// POST /api/stories - 创建新故事系列
router.post('/', validateStorySeries, storyController.createStorySeries);

// PUT /api/stories/:id - 更新故事系列
router.put('/:id', validateStorySeries, storyController.updateStorySeries);

// DELETE /api/stories/:id - 删除故事系列
router.delete('/:id', storyController.deleteStorySeries);

// GET /api/stories/:id/chapters - 获取故事系列的所有章节
router.get('/:id/chapters', storyController.getChaptersByStory);

export default router;