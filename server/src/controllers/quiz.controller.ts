import { Request, Response } from 'express';
import Quiz from '../models/quiz.model';
import LessonOutline from '../models/lessonOutline.model';
import quizService from '../services/quiz.service';

class QuizController {
  /**
   * Generate quiz for a specific section of a lesson
   * POST /api/quiz/generate
   * Body: { lessonOutlineId: string, sectionId: string, sectionIndex: number }
   * Protected Route - Requires Authentication
   */
  async generateQuiz(req: Request, res: Response) {
    try {
      const { lessonOutlineId, sectionId } = req.body;
      const user = req.user;

      // Validation
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!lessonOutlineId || typeof lessonOutlineId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'lessonOutlineId is required and must be a string',
        });
      }

      if (!sectionId || typeof sectionId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'sectionId is required and must be a string',
        });
      }

      // Find the lesson outline and verify ownership
      const lessonOutline = await LessonOutline.findOne({
        _id: lessonOutlineId,
        userId: user._id,
      });

      if (!lessonOutline) {
        return res.status(404).json({
          success: false,
          message: 'Lesson outline not found or access denied',
        });
      }

      // Find the section in the outline
      const section = lessonOutline.sections.find(
        (s: any) => s.id === sectionId
      );

      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found in lesson outline',
        });
      }

      // Check if quiz already exists for this section
      const existingQuiz = await Quiz.findOne({
        lessonOutlineId,
        sectionId,
        userId: user._id,
      });

      if (existingQuiz) {
        return res.status(200).json({
          success: true,
          data: existingQuiz,
          message: 'Quiz already exists for this section',
        });
      }

      // Generate quiz questions using Quiz service
      const questions = await quizService.generateQuizQuestions(
        lessonOutline.topic,
        section,
        lessonOutline.knowledgeLevel
      );

      // Save the quiz to database
      const quiz = await Quiz.create({
        lessonOutlineId,
        userId: user._id,
        sectionId: section.id,
        sectionTitle: section.title,
        topic: lessonOutline.topic,
        questions,
      });

      return res.status(201).json({
        success: true,
        data: quiz,
        message: 'Quiz generated successfully',
      });
    } catch (error) {
      console.error('Error in generateQuiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get quiz by ID
   * GET /api/quiz/:quizId
   * Protected Route - Requires Authentication
   */
  async getQuizById(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!quizId) {
        return res.status(400).json({
          success: false,
          message: 'Quiz ID is required',
        });
      }

      // Find the quiz and verify ownership
      const quiz = await Quiz.findOne({
        _id: quizId,
        userId: user._id,
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found or access denied',
        });
      }

      return res.status(200).json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      console.error('Error in getQuizById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all quizzes for a lesson outline
   * GET /api/quiz/lesson/:lessonOutlineId
   * Protected Route - Requires Authentication
   */
  async getQuizzesByLesson(req: Request, res: Response) {
    try {
      const { lessonOutlineId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!lessonOutlineId) {
        return res.status(400).json({
          success: false,
          message: 'Lesson outline ID is required',
        });
      }

      // Verify lesson outline ownership
      const lessonOutline = await LessonOutline.findOne({
        _id: lessonOutlineId,
        userId: user._id,
      });

      if (!lessonOutline) {
        return res.status(404).json({
          success: false,
          message: 'Lesson outline not found or access denied',
        });
      }

      // Find all quizzes for this lesson
      const quizzes = await Quiz.find({
        lessonOutlineId,
        userId: user._id,
      }).sort({ sectionIndex: 1 });

      return res.status(200).json({
        success: true,
        data: quizzes,
        count: quizzes.length,
      });
    } catch (error) {
      console.error('Error in getQuizzesByLesson:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch quizzes',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get quiz for a specific section
   * GET /api/quiz/section/:lessonOutlineId/:sectionId
   * Protected Route - Requires Authentication
   */
  async getQuizBySection(req: Request, res: Response) {
    try {
      const { lessonOutlineId, sectionId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!lessonOutlineId || !sectionId) {
        return res.status(400).json({
          success: false,
          message: 'Lesson outline ID and section ID are required',
        });
      }

      // Find the quiz
      const quiz = await Quiz.findOne({
        lessonOutlineId,
        sectionId,
        userId: user._id,
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found for this section',
        });
      }

      return res.status(200).json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      console.error('Error in getQuizBySection:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a quiz
   * DELETE /api/quiz/:quizId
   * Protected Route - Requires Authentication
   */
  async deleteQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!quizId) {
        return res.status(400).json({
          success: false,
          message: 'Quiz ID is required',
        });
      }

      // Find and delete the quiz, verifying ownership
      const deletedQuiz = await Quiz.findOneAndDelete({
        _id: quizId,
        userId: user._id,
      });

      if (!deletedQuiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found or access denied',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quiz deleted successfully',
        data: {
          deletedId: quizId,
        },
      });
    } catch (error) {
      console.error('Error in deleteQuiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Submit quiz answers and get results
   * POST /api/quiz/:quizId/submit
   * Body: { answers: Record<string, string> }
   * Protected Route - Requires Authentication
   */
  async submitQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const { answers } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!quizId) {
        return res.status(400).json({
          success: false,
          message: 'Quiz ID is required',
        });
      }

      if (!answers || typeof answers !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Answers object is required',
        });
      }

      // Find the quiz and verify ownership
      const quiz = await Quiz.findOne({
        _id: quizId,
        userId: user._id,
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found or access denied',
        });
      }

      // Validate answers and calculate score
      const validation = quizService.validateQuizAnswers(quiz.questions, answers);

      // Generate performance report
      const performanceReport = quizService.generatePerformanceReport(
        validation.score,
        validation.totalQuestions,
        'beginner' // You can get this from the lesson outline if needed
      );

      return res.status(200).json({
        success: true,
        data: {
          quizId: quiz._id,
          sectionTitle: quiz.sectionTitle,
          score: validation.score,
          totalQuestions: validation.totalQuestions,
          percentage: validation.percentage,
          grade: performanceReport.grade,
          feedback: performanceReport.feedback,
          recommendations: performanceReport.recommendations,
          results: validation.results,
        },
        message: 'Quiz submitted successfully',
      });
    } catch (error) {
      console.error('Error in submitQuiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new QuizController();
