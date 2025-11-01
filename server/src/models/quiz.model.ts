import mongoose, { Document, Schema } from 'mongoose';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface IQuiz extends Document {
  lessonOutlineId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
  topic: string;
  questions: QuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => v.length >= 2,
      message: 'At least 2 options are required',
    },
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
  },
}, { _id: false });

const quizSchema = new Schema<IQuiz>(
  {
    lessonOutlineId: {
      type: Schema.Types.ObjectId,
      ref: 'LessonOutline',
      required: [true, 'Lesson outline ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    sectionId: {
      type: String,
      required: [true, 'Section ID is required'],
    },
    sectionTitle: {
      type: String,
      required: [true, 'Section title is required'],
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    questions: {
      type: [quizQuestionSchema],
      required: true,
      validate: {
        validator: (v: QuizQuestion[]) => v.length > 0,
        message: 'At least one question is required',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for faster queries
quizSchema.index({ lessonOutlineId: 1, sectionIndex: 1 });
quizSchema.index({ userId: 1, createdAt: -1 });

const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);

export default Quiz;
