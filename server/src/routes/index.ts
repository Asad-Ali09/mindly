import { Router } from 'express';
import aiRoutes from './ai.routes';
import userRoutes from './user.routes';
import quizRoutes from './quiz.routes';

const router = Router();

// Mount AI routes
router.use('/ai', aiRoutes);

// Mount User routes
router.use('/users', userRoutes);

// Mount Quiz routes
router.use('/quiz', quizRoutes);

export default router;
