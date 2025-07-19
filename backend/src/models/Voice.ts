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
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 索引
VoiceSchema.index({ voice_id: 1 });
VoiceSchema.index({ gender: 1, age_type: 1 });
VoiceSchema.index({ provider: 1 });

export default mongoose.model<IVoice>('Voice', VoiceSchema);