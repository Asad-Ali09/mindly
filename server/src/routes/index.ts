import { Router } from 'express';
import aiRoutes from './ai.routes';
import userRoutes from './user.routes';
import quizRoutes from './quiz.routes';
import documentRoutes from './document.routes';

const router = Router();

console.log('🔧 Initializing API routes...');

// Mount AI routes
router.use('/ai', aiRoutes);

// Mount User routes
router.use('/users', userRoutes);

// Mount Quiz routes
router.use('/quiz', quizRoutes);

// Mount Document routes
router.use('/documents', documentRoutes);

console.log('✅ All routes mounted: /ai, /users, /quiz, /documents');

export default router;
