import mongoose, { Document, Schema } from 'mongoose';
import { IStorySeries } from './StorySeries';
import { ICharacter } from './Character';

export interface IChapter extends Document {
  story_series_id: mongoose.Types.ObjectId | IStorySeries;
  title: string;
  content: string;
  order: number;
  status: 'draft' | 'published';
  characters_used: (mongoose.Types.ObjectId | ICharacter)[];
  audio_file_path?: string;
  created_at: Date;
  updated_at: Date;
}

const ChapterSchema: Schema = new Schema({
  story_series_id: {
    type: Schema.Types.ObjectId,
    ref: 'StorySeries',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  characters_used: [{
    type: Schema.Types.ObjectId,
    ref: 'Character'
  }],
  audio_file_path: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 索引
ChapterSchema.index({ story_series_id: 1, order: 1 });
ChapterSchema.index({ status: 1 });
ChapterSchema.index({ title: 1 });

// 复合唯一索引：同一个故事系列中，章节顺序不能重复
ChapterSchema.index({ story_series_id: 1, order: 1 }, { unique: true });

export default mongoose.model<IChapter>('Chapter', ChapterSchema);