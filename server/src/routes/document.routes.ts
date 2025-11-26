import { Router } from 'express';
import documentController from '../controllers/document.controller';
import multer from 'multer';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';

// Configure multer for file uploads using memory storage
// Files will be uploaded to Cloudinary from memory instead of disk
const storage = multer.memoryStorage();

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

// POST /api/documents/upload - Upload document (requires authentication)
router.post('/upload', authMiddleware, upload.single('file'), documentController.uploadDocument.bind(documentController));

// GET /api/documents - Get all documents for authenticated user
router.get('/', authMiddleware, documentController.getUserDocuments.bind(documentController));

// GET /api/documents/:id - Get document by ID (optional auth - checks ownership or public status)
router.get('/:id', optionalAuthMiddleware, documentController.getDocument.bind(documentController));

// PATCH /api/documents/:id/visibility - Toggle document visibility (requires authentication)
router.patch('/:id/visibility', authMiddleware, documentController.toggleDocumentVisibility.bind(documentController));

// DELETE /api/documents/:id - Delete document (requires authentication)
router.delete('/:id', authMiddleware, documentController.deleteDocument.bind(documentController));

export default router;
