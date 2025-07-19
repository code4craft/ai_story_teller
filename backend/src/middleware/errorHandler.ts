import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // 日志记录错误
  console.error(err);

  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message);
    error = createError(`输入验证失败: ${message.join(', ')}`, 400);
  }

  // Mongoose重复键错误
  if ((err as any).code === 11000) {
    const message = '该资源已存在';
    error = createError(message, 400);
  }

  // Mongoose类型转换错误
  if (err.name === 'CastError') {
    const message = '无效的资源ID';
    error = createError(message, 400);
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    const message = '无效的令牌';
    error = createError(message, 401);
  }

  // JWT过期错误
  if (err.name === 'TokenExpiredError') {
    const message = '令牌已过期';
    error = createError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const createError = (message: string, statusCode: number): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);