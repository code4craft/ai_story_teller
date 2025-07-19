import express from 'express';
import { TTSController } from '../controllers/TTSController';

const router = express.Router();
const ttsController = new TTSController();

/**
 * @route POST /api/tts/generate-dialogue
 * @desc 生成单句对话语音
 * @body {
 *   text: string,           // 要转换的文本
 *   characterId: string,    // 角色ID
 *   voiceId?: string        // 可选：指定音色ID，否则使用角色默认音色
 * }
 * @response 音频流 (audio/mpeg)
 */
router.post('/generate-dialogue', ttsController.generateDialogueAudio);

/**
 * @route POST /api/tts/generate-chapter/:chapterId
 * @desc 批量生成章节音频
 * @param chapterId 章节ID
 * @body {
 *   dialogues: Array<{
 *     text: string,
 *     characterId: string,
 *     voiceId?: string
 *   }>
 * }
 * @response {
 *   success: boolean,
 *   data: {
 *     filename: string,
 *     path: string,
 *     url: string,
 *     size: number,
 *     segmentsCount: number
 *   }
 * }
 */
router.post('/generate-chapter/:chapterId', ttsController.generateChapterAudio);

/**
 * @route GET /api/tts/health
 * @desc TTS服务健康检查
 * @response {
 *   success: boolean,
 *   data: {
 *     healthy: boolean,
 *     timestamp: string
 *   }
 * }
 */
router.get('/health', ttsController.healthCheck);

export default router;