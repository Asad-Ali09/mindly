import { Router } from 'express';
import aiRoutes from './ai.routes';

const router = Router();

// Mount AI routes
router.use('/ai', aiRoutes);

export default router;
