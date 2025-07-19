import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const conversionTaskSchema = Joi.object({
  chapter_id: Joi.string().hex().length(24).required().messages({
    'string.hex': '章节ID格式不正确',
    'string.length': '章节ID长度不正确',
    'any.required': '章节ID是必填项'
  }),
  type: Joi.string().valid('chapter', 'dialogue').default('chapter').optional(),
  settings: Joi.object({
    voice_speed: Joi.number().min(0.5).max(2.0).default(1.0).optional(),
    voice_volume: Joi.number().min(0.1).max(2.0).default(1.0).optional(),
    voice_pitch: Joi.number().min(0.5).max(2.0).default(1.0).optional()
  }).default({
    voice_speed: 1.0,
    voice_volume: 1.0,
    voice_pitch: 1.0
  }).optional()
});

export const validateConversionTask = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = conversionTaskSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors
    });
    return;
  }

  req.body = value;
  next();
};