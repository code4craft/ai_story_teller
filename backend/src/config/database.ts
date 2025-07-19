import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_story_teller';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    throw error;
  }
};

// MongoDB连接事件监听
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose连接到MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose断开连接');
});