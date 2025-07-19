import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const chapterSchema = Joi.object({
  story_series_id: Joi.string().hex().length(24).required().messages({
    'string.hex': '故事系列ID格式不正确',
    'string.length': '故事系列ID长度不正确', 
    'any.required': '故事系列ID是必填项'
  }),
  title: Joi.string().trim().required().messages({
    'string.empty': '章节标题不能为空',
    'any.required': '章节标题是必填项'
  }),
  content: Joi.string().required().messages({
    'string.empty': '章节内容不能为空',
    'any.required': '章节内容是必填项'
  }),
  order: Joi.number().integer().min(0).default(0).optional(),
  status: Joi.string().valid('draft', 'published').default('draft').optional(),
  characters_used: Joi.array().items(
    Joi.string().hex().length(24)
  ).default([]).optional(),
  audio_file_path: Joi.string().trim().allow('').optional()
});

export const validateChapter = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = chapterSchema.validate(req.body, {
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