import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonOutline extends Document {
  userId: mongoose.Types.ObjectId;
  topic: string;
  knowledgeLevel: string;
  overallObjective: string;
  totalEstimatedDuration: string;
  sections: any[];
  createdAt: Date;
  updatedAt: Date;
}

const lessonOutlineSchema = new Schema<ILessonOutline>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    knowledgeLevel: {
      type: String,
      required: [true, 'Knowledge level is required'],
      trim: true,
    },
    overallObjective: {
      type: String,
      required: [true, 'Overall objective is required'],
    },
    totalEstimatedDuration: {
      type: String,
      required: [true, 'Total estimated duration is required'],
    },
    sections: [Schema.Types.Mixed],
  },
  {
    timestamps: true,
  }
);

// Create compound index for faster queries
lessonOutlineSchema.index({ userId: 1, createdAt: -1 });

const LessonOutline = mongoose.model<ILessonOutline>('LessonOutline', lessonOutlineSchema);

export default LessonOutline;
