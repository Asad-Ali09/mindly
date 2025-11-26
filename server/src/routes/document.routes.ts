import { Router } from 'express';
import documentController from '../controllers/document.controller';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PPTX, and images are allowed.'));
    }
  }
});

const router = Router();

console.log('📄 Document routes initialized');

// POST /api/documents/upload - Upload document (PDF or PPTX)
router.post('/upload', upload.single('file'), documentController.uploadDocument.bind(documentController));

// GET /api/documents/:id - Get document by ID
router.get('/:id', documentController.getDocument.bind(documentController));

// DELETE /api/documents/:filename - Delete uploaded document
router.delete('/:filename', documentController.deleteDocument.bind(documentController));

export default router;
