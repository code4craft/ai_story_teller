import express from 'express';
import { CharacterController } from '../controllers/CharacterController';
import { validateCharacter } from '../validators/characterValidator';

const router = express.Router();
const characterController = new CharacterController();

// GET /api/characters - 获取所有角色
router.get('/', characterController.getAllCharacters);

// GET /api/characters/:id - 获取单个角色
router.get('/:id', characterController.getCharacterById);

// POST /api/characters - 创建新角色
router.post('/', validateCharacter, characterController.createCharacter);

// PUT /api/characters/:id - 更新角色
router.put('/:id', validateCharacter, characterController.updateCharacter);

// DELETE /api/characters/:id - 删除角色
router.delete('/:id', characterController.deleteCharacter);

// GET /api/characters/search - 搜索角色
router.get('/search', characterController.searchCharacters);

// GET /api/characters/story/:storySeriesId - 获取指定故事系列的角色
router.get('/story/:storySeriesId', characterController.getCharactersByStory);

export default router;