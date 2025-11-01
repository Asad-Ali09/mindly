import { Router } from 'express';
import quizController from '../controllers/quiz.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All quiz routes require authentication

// POST /api/quiz/generate - Generate quiz for a section
router.post('/generate', authMiddleware, quizController.generateQuiz.bind(quizController));

// POST /api/quiz/:quizId/submit - Submit quiz answers and get results
router.post('/:quizId/submit', authMiddleware, quizController.submitQuiz.bind(quizController));

// GET /api/quiz/:quizId - Get quiz by ID
router.get('/:quizId', authMiddleware, quizController.getQuizById.bind(quizController));

// GET /api/quiz/lesson/:lessonOutlineId - Get all quizzes for a lesson
router.get('/lesson/:lessonOutlineId', authMiddleware, quizController.getQuizzesByLesson.bind(quizController));

// GET /api/quiz/section/:lessonOutlineId/:sectionId - Get quiz for specific section
router.get('/section/:lessonOutlineId/:sectionId', authMiddleware, quizController.getQuizBySection.bind(quizController));

// DELETE /api/quiz/:quizId - Delete quiz
router.delete('/:quizId', authMiddleware, quizController.deleteQuiz.bind(quizController));

export default router;
