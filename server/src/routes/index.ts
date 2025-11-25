import { Router } from 'express';
import aiRoutes from './ai.routes';
import userRoutes from './user.routes';
import quizRoutes from './quiz.routes';
import authRoutes from './auth.routes';
import classroomRoutes from './classroom.routes';

const router = Router();

// Mount AI routes
router.use('/ai', aiRoutes);

// Mount User routes
router.use('/users', userRoutes);

// Mount Quiz routes
router.use('/quiz', quizRoutes);

// Mount Auth routes (Google OAuth)
router.use('/auth', authRoutes);

// Mount Classroom routes
router.use('/classroom', classroomRoutes);

export default router;
