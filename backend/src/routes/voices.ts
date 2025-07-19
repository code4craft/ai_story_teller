import express from 'express';
import { VoiceController } from '../controllers/VoiceController';
import { validateVoice } from '../validators/voiceValidator';

const router = express.Router();
const voiceController = new VoiceController();

// GET /api/voices - 获取所有音色
router.get('/', voiceController.getAllVoices);

// GET /api/voices/search - 搜索音色（必须在 /:id 之前）
router.get('/search', voiceController.searchVoices);

// GET /api/voices/:id - 获取单个音色
router.get('/:id', voiceController.getVoiceById);

// POST /api/voices - 创建新音色
router.post('/', validateVoice, voiceController.createVoice);

// PUT /api/voices/:id - 更新音色
router.put('/:id', validateVoice, voiceController.updateVoice);

// DELETE /api/voices/:id - 删除音色
router.delete('/:id', voiceController.deleteVoice);

// POST /api/voices/:id/test - 测试音色（输入文字试听）
router.post('/:id/test', voiceController.testVoice);

export default router;