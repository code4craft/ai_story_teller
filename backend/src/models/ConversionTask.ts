import mongoose, { Document, Schema } from 'mongoose';
import { IChapter } from './Chapter';

export interface IConversionTask extends Document {
  chapter_id: mongoose.Types.ObjectId | IChapter;
  type: 'chapter' | 'dialogue';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  output_file_path?: string;
  error_message?: string;
  settings: {
    voice_speed: number;
    voice_volume: number;
    voice_pitch: number;
  };
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

const ConversionTaskSchema: Schema = new Schema({
  chapter_id: {
    type: Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['chapter', 'dialogue']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  output_file_path: {
    type: String,
    trim: true
  },
  error_message: {
    type: String,
    trim: true
  },
  settings: {
    voice_speed: {
      type: Number,
      required: true,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    voice_volume: {
      type: Number,
      required: true,
      default: 1.0,
      min: 0.1,
      max: 2.0
    },
    voice_pitch: {
      type: Number,
      required: true,
      default: 1.0,
      min: 0.5,
      max: 2.0
    }
  },
  completed_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 索引
ConversionTaskSchema.index({ chapter_id: 1 });
ConversionTaskSchema.index({ status: 1 });
ConversionTaskSchema.index({ created_at: -1 });

export default mongoose.model<IConversionTask>('ConversionTask', ConversionTaskSchema);