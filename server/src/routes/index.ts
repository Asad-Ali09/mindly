import { Router } from 'express';
import aiRoutes from './ai.routes';
import userRoutes from './user.routes';

const router = Router();

// Mount AI routes
router.use('/ai', aiRoutes);

// Mount User routes
router.use('/users', userRoutes);

export default router;
