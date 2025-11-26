import { Router } from 'express';
import {
  connectGoogleClassroom,
  googleCallback,
  disconnectGoogleClassroom,
  getGoogleConnectionStatus,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/auth/google/connect
 * @desc    Initiate Google OAuth flow for Classroom integration
 * @access  Private (requires JWT token passed as 'state' query param)
 */
router.get('/google/connect', connectGoogleClassroom);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public (OAuth callback)
 */
router.get('/google/callback', googleCallback);

/**
 * @route   POST /api/auth/google/disconnect
 * @desc    Disconnect Google Classroom integration
 * @access  Private
 */
router.post('/google/disconnect', authMiddleware, disconnectGoogleClassroom);

/**
 * @route   GET /api/auth/google/status
 * @desc    Get Google Classroom connection status
 * @access  Private
 */
router.get('/google/status', authMiddleware, getGoogleConnectionStatus);

export default router;
