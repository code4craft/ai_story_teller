import mongoose, { Document, Schema } from 'mongoose';
import { IVoice } from './Voice';

export interface ICharacter extends Document {
  name: string;
  gender: 'male' | 'female' | 'mixed' | 'neutral';
  age_type: string;
  personality: string[];
  voice_id: mongoose.Types.ObjectId | IVoice;
  description: string;
  story_series: string;
  category: string;
  created_at: Date;
  updated_at: Date;
}

const CharacterSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'mixed', 'neutral']
  },
  age_type: {
    type: String,
    required: true,
    trim: true
  },
  personality: [{
    type: String,
    trim: true
  }],
  voice_id: {
    type: Schema.Types.ObjectId,
    ref: 'Voice',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  story_series: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 索引
CharacterSchema.index({ name: 1 });
CharacterSchema.index({ story_series: 1 });
CharacterSchema.index({ category: 1 });
CharacterSchema.index({ gender: 1, age_type: 1 });

export default mongoose.model<ICharacter>('Character', CharacterSchema);