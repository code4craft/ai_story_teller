import express from 'express';
import { ChapterController } from '../controllers/ChapterController';
import { validateChapter } from '../validators/chapterValidator';

const router = express.Router();
const chapterController = new ChapterController();

// GET /api/chapters - 获取所有章节
router.get('/', chapterController.getAllChapters);

// GET /api/chapters/:id - 获取单个章节
router.get('/:id', chapterController.getChapterById);

// POST /api/chapters - 创建新章节
router.post('/', validateChapter, chapterController.createChapter);

// PUT /api/chapters/:id - 更新章节
router.put('/:id', validateChapter, chapterController.updateChapter);

// DELETE /api/chapters/:id - 删除章节
router.delete('/:id', chapterController.deleteChapter);

// POST /api/chapters/:id/parse - 解析章节内容，提取对话和角色
router.post('/:id/parse', chapterController.parseChapter);

export default router;