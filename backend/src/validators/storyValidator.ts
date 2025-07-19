import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const storySeriesSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': '故事标题不能为空',
    'any.required': '故事标题是必填项'
  }),
  description: Joi.string().trim().allow('').optional(),
  order: Joi.number().integer().min(0).default(0).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft').optional()
});

export const validateStorySeries = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = storySeriesSchema.validate(req.body, {
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