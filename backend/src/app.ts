// 首先加载环境变量
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// 路由导入
import voiceRoutes from './routes/voices';
import characterRoutes from './routes/characters';
import storyRoutes from './routes/stories';
import chapterRoutes from './routes/chapters';
import conversionRoutes from './routes/conversions';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（音频文件）
app.use('/audio', express.static('uploads/audio'));

// API路由
app.use('/api/voices', voiceRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/conversions', conversionRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📖 API文档: http://localhost:${PORT}/api`);
      console.log(`💾 数据库: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_story_teller'}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，准备关闭服务器...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，准备关闭服务器...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;