import { Router } from 'express';
import aiController from '../controllers/ai.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/ai/assessment-questions
router.post('/assessment-questions', aiController.getAssessmentQuestions.bind(aiController));

// POST /api/ai/lesson-outline - Protected route (requires authentication)
router.post('/lesson-outline', authMiddleware, aiController.getLessonOutline.bind(aiController));

// POST /api/ai/whiteboard-content
router.post('/whiteboard-content', aiController.getWhiteboardContent.bind(aiController));

// POST /api/ai/answer-question
router.post('/answer-question', aiController.answerLessonQuestion.bind(aiController));

// GET /api/ai/lesson-outlines - Get all lesson outlines for logged-in user (Protected)
router.get('/lesson-outlines', authMiddleware, aiController.getUserLessonOutlines.bind(aiController));

// GET /api/ai/lesson-outline/:outlineId - Get specific lesson outline (Protected)
router.get('/lesson-outline/:outlineId', authMiddleware, aiController.getLessonOutlineById.bind(aiController));

// DELETE /api/ai/lesson-outline/:outlineId - Delete lesson outline (Protected)
router.delete('/lesson-outline/:outlineId', authMiddleware, aiController.deleteLessonOutline.bind(aiController));

export default router;
