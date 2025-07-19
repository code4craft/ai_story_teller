import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const characterSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': '角色名称不能为空',
    'any.required': '角色名称是必填项'
  }),
  gender: Joi.string().valid('male', 'female', 'mixed', 'neutral').required().messages({
    'any.only': '性别必须是 male、female、mixed 或 neutral',
    'any.required': '性别是必填项'
  }),
  age_type: Joi.string().trim().required().messages({
    'string.empty': '年龄类型不能为空',
    'any.required': '年龄类型是必填项'
  }),
  personality: Joi.array().items(Joi.string().trim()).default([]).optional(),
  voice_id: Joi.string().hex().length(24).required().messages({
    'string.hex': '音色ID格式不正确',
    'string.length': '音色ID长度不正确',
    'any.required': '音色ID是必填项'
  }),
  description: Joi.string().trim().allow('').optional(),
  story_series: Joi.string().trim().allow('').optional(),
  category: Joi.string().trim().allow('').optional()
});

export const validateCharacter = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = characterSchema.validate(req.body, {
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