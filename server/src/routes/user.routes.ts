import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes - no authentication required
router.post('/signup', userController.signup);
router.post('/login', userController.login);

// Protected routes - authentication required
router.get('/profile/:userId', authMiddleware, userController.getProfile);
router.get('/me', optionalAuthMiddleware, userController.getCurrentUser);

export default router;
