import mongoose, { Document, Schema } from 'mongoose';

export interface IStorySeries extends Document {
  title: string;
  description: string;
  order: number;
  status: 'draft' | 'published' | 'archived';
  created_at: Date;
  updated_at: Date;
}

const StorySeriesSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 索引
StorySeriesSchema.index({ order: 1 });
StorySeriesSchema.index({ status: 1 });
StorySeriesSchema.index({ title: 1 });

export default mongoose.model<IStorySeries>('StorySeries', StorySeriesSchema);