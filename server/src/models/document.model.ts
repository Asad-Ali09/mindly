import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'pptx' | 'image';
  mimeType: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  cloudinaryFolder: string;
  thumbnailUrl?: string;
  pageImages?: string[];
  isPublic: boolean;
  metadata?: {
    pageCount?: number;
    width?: number;
    height?: number;
    format?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'pptx', 'image'],
      required: [true, 'File type is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
      unique: true,
    },
    cloudinaryUrl: {
      type: String,
      required: [true, 'Cloudinary URL is required'],
    },
    cloudinaryFolder: {
      type: String,
      required: [true, 'Cloudinary folder is required'],
    },
    thumbnailUrl: {
      type: String,
    },
    pageImages: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    metadata: {
      pageCount: Number,
      width: Number,
      height: Number,
      format: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user document queries
documentSchema.index({ userId: 1, createdAt: -1 });

const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

export default DocumentModel;
