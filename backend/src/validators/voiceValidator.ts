import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const voiceSchema = Joi.object({
  voice_id: Joi.string().trim().required().messages({
    'string.empty': '音色ID不能为空',
    'any.required': '音色ID是必填项'
  }),
  name: Joi.string().trim().required().messages({
    'string.empty': '音色名称不能为空', 
    'any.required': '音色名称是必填项'
  }),
  gender: Joi.string().valid('male', 'female', 'neutral').required().messages({
    'any.only': '性别必须是 male、female 或 neutral',
    'any.required': '性别是必填项'
  }),
  age_type: Joi.string().valid(
    'child', 'young_adult', 'adult', 'middle_aged', 'elderly', 'divine', 'narrator'
  ).required().messages({
    'any.only': '年龄类型必须是 child、young_adult、adult、middle_aged、elderly、divine 或 narrator',
    'any.required': '年龄类型是必填项'
  }),
  description: Joi.string().trim().allow('').optional(),
  language: Joi.string().trim().default('zh').optional(),
  style: Joi.string().trim().allow('').optional(),
  provider: Joi.string().trim().default('volcengine').optional()
});

export const validateVoice = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = voiceSchema.validate(req.body, {
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