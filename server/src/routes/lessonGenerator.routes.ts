import { Router } from 'express';
import lessonGeneratorController from '../controllers/lessonGenerator.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/lesson-generator/generate-page
 * @desc    Generate content for a single lesson page from an image
 * @access  Private
 */
router.post('/generate-page', authMiddleware, (req, res) =>
  lessonGeneratorController.generatePage(req, res)
);

/**
 * @route   POST /api/lesson-generator/generate-multiple-pages
 * @desc    Generate content for multiple lesson pages
 * @access  Private
 */
router.post('/generate-multiple-pages', authMiddleware, (req, res) =>
  lessonGeneratorController.generateMultiplePages(req, res)
);

/**
 * @route   POST /api/lesson-generator/generate-lesson
 * @desc    Generate a complete lesson with all pages
 * @access  Private
 */
router.post('/generate-lesson', authMiddleware, (req, res) =>
  lessonGeneratorController.generateCompleteLesson(req, res)
);

export default router;
