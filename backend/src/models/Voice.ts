import mongoose, { Document, Schema } from 'mongoose';

export interface IVoice extends Document {
  voice_id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age_type: 'child' | 'young_adult' | 'adult' | 'middle_aged' | 'elderly' | 'divine' | 'narrator';
  description: string;
  language: string;
  style: string;
  provider: string;
  sample_audio?: {
    filename: string;      // 音频文件名
    path: string;         // 音频文件路径
    url: string;          // 音频访问URL
    text: string;         // 测试时使用的文本
    created_at: Date;     // 音频生成时间
  };
  created_at: Date;
  updated_at: Date;
}

const VoiceSchema: Schema = new Schema({
  voice_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'neutral']
  },
  age_type: {
    type: String,
    required: true,
    enum: ['child', 'young_adult', 'adult', 'middle_aged', 'elderly', 'divine', 'narrator']
  },
  description: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    required: true,
    default: 'zh'
  },
  style: {
    type: String,
    trim: true
  },
  provider: {
    type: String,
    required: true,
    default: 'volcengine'
  },
  sample_audio: {
    filename: {
      type: String
    },
    path: {
      type: String
    },
    url: {
      type: String
    },
    text: {
      type: String
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 索引
VoiceSchema.index({ voice_id: 1 });
VoiceSchema.index({ gender: 1, age_type: 1 });
VoiceSchema.index({ provider: 1 });

export default mongoose.model<IVoice>('Voice', VoiceSchema);