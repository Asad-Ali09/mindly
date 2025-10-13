import { Router } from 'express';
import aiController from '../controllers/ai.controller';

const router = Router();

// POST /api/ai/assessment-questions
router.post('/assessment-questions', aiController.getAssessmentQuestions.bind(aiController));

// POST /api/ai/lesson-outline
router.post('/lesson-outline', aiController.getLessonOutline.bind(aiController));

// POST /api/ai/whiteboard-content
router.post('/whiteboard-content', aiController.getWhiteboardContent.bind(aiController));

export default router;
