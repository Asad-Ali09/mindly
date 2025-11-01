import { Request, Response } from 'express';
import aiService from '../services/ai.service';
import LessonOutline from '../models/lessonOutline.model';

class AIController {
  /**
   * Get assessment questions for a topic
   * POST /api/ai/assessment-questions
   * Body: { topic: string }
   */
  async getAssessmentQuestions(req: Request, res: Response) {
    try {
      const { topic } = req.body;

      if (!topic || typeof topic !== 'string' || topic.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Topic is required and must be a non-empty string',
        });
      }

      const questions = await aiService.generateAssessmentQuestions(topic.trim());

      return res.status(200).json({
        success: true,
        data: {
          topic: topic.trim(),
          questions,
        },
      });
    } catch (error) {
      console.error('Error in getAssessmentQuestions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate assessment questions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate lesson outline based on assessment responses
   * POST /api/ai/lesson-outline
   * Body: { topic: string, responses: Record<string, string[]>, questions: AssessmentQuestion[] }
   * Protected Route - Requires Authentication
   */
  async getLessonOutline(req: Request, res: Response) {
    try {
      const { topic, responses, questions } = req.body;
      const user = req.user; // From auth middleware

      // Validation
      if (!topic || typeof topic !== 'string' || topic.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Topic is required and must be a non-empty string',
        });
      }

      if (!responses || typeof responses !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Responses are required and must be an object',
        });
      }

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Questions are required and must be a non-empty array',
        });
      }

      // Check if user is authenticated (should be guaranteed by middleware)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Generate the lesson outline
      const outline = await aiService.generateLessonOutline(
        topic.trim(),
        responses,
        questions
      );

      // Save the lesson outline to database
      const savedOutline = await LessonOutline.create({
        userId: user._id,
        topic: outline.topic,
        knowledgeLevel: outline.knowledgeLevel,
        overallObjective: outline.overallObjective,
        totalEstimatedDuration: outline.totalEstimatedDuration,
        sections: outline.sections,
      });

      return res.status(200).json({
        success: true,
        data: savedOutline,
        outlineId: savedOutline._id, // Return the saved outline ID
        message: 'Lesson outline generated and saved successfully',
      });
    } catch (error) {
      console.error('Error in getLessonOutline:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate lesson outline',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate whiteboard content for a specific page
   * POST /api/ai/whiteboard-content
   * Body: {
   *   pageId: string,
   *   topic: string,
   *   pageTitle: string,
   *   pageDescription: string,
   *   estimatedDuration: string,
   *   lessonOutline?: LessonOutline (optional, for better context)
   * }
   */
  async getWhiteboardContent(req: Request, res: Response) {
    try {
      const {
        pageId,
        topic,
        pageTitle,
        pageDescription,
        estimatedDuration,
        lessonOutline,
      } = req.body;

      // Validation
      if (!pageId || typeof pageId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'pageId is required and must be a string',
        });
      }

      if (!topic || typeof topic !== 'string' || topic.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'topic is required and must be a non-empty string',
        });
      }

      if (!pageTitle || typeof pageTitle !== 'string' || pageTitle.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'pageTitle is required and must be a non-empty string',
        });
      }

      if (!pageDescription || typeof pageDescription !== 'string' || pageDescription.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'pageDescription is required and must be a non-empty string',
        });
      }

      if (!estimatedDuration || typeof estimatedDuration !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'estimatedDuration is required and must be a string (e.g., "30 seconds")',
        });
      }

      const whiteboardContent = await aiService.generateWhiteboardContent(
        topic.trim(),
        pageTitle.trim(),
        pageDescription.trim(),
        estimatedDuration.trim(),
        lessonOutline // Pass the lesson outline if provided
      );

      // Set the page ID
      whiteboardContent.pageId = pageId;

      return res.status(200).json({
        success: true,
        data: whiteboardContent,
      });
    } catch (error) {
      console.error('Error in getWhiteboardContent:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate whiteboard content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle user interruption during lesson - answer questions based on lesson context
   * POST /api/ai/answer-question
   * Body: {
   *   lessonOutline: LessonOutline,
   *   completedPages: string[],
   *   currentPageId: string,
   *   question: string
   * }
   */
  async answerLessonQuestion(req: Request, res: Response) {
    try {
      const { lessonOutline, completedPages, currentPageId, question } = req.body;

      // Validation
      if (!lessonOutline || typeof lessonOutline !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'lessonOutline is required and must be an object',
        });
      }

      if (!completedPages || !Array.isArray(completedPages)) {
        return res.status(400).json({
          success: false,
          message: 'completedPages is required and must be an array',
        });
      }

      if (!currentPageId || typeof currentPageId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'currentPageId is required and must be a string',
        });
      }

      if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'question is required and must be a non-empty string',
        });
      }

      const answerContent = await aiService.answerLessonQuestion(
        lessonOutline,
        completedPages,
        currentPageId,
        question.trim()
      );

      return res.status(200).json({
        success: true,
        data: {
          question: question.trim(),
          totalDuration: answerContent.totalDuration,
          captions: answerContent.captions,
          animations: answerContent.animations,
          context: {
            currentPageId,
            completedPagesCount: completedPages.length,
          },
        },
      });
    } catch (error) {
      console.error('Error in answerLessonQuestion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate answer to question',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all lesson outlines for the logged-in user
   * GET /api/ai/lesson-outlines
   * Protected Route - Requires Authentication
   */
  async getUserLessonOutlines(req: Request, res: Response) {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Get all lesson outlines for this user, sorted by most recent
      const outlines = await LessonOutline.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .select('-__v')
        .lean();

      return res.status(200).json({
        success: true,
        data: outlines,
        count: outlines.length,
      });
    } catch (error) {
      console.error('Error in getUserLessonOutlines:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson outlines',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get a specific lesson outline by ID
   * GET /api/ai/lesson-outline/:outlineId
   * Protected Route - Requires Authentication
   */
  async getLessonOutlineById(req: Request, res: Response) {
    try {
      const user = req.user;
      const { outlineId } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!outlineId) {
        return res.status(400).json({
          success: false,
          message: 'Outline ID is required',
        });
      }

      // Find the outline and verify it belongs to this user
      const outline = await LessonOutline.findOne({
        _id: outlineId,
        userId: user._id,
      }).lean();

      if (!outline) {
        return res.status(404).json({
          success: false,
          message: 'Lesson outline not found or access denied',
        });
      }

      return res.status(200).json({
        success: true,
        data: outline,
      });
    } catch (error) {
      console.error('Error in getLessonOutlineById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson outline',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a lesson outline
   * DELETE /api/ai/lesson-outline/:outlineId
   * Protected Route - Requires Authentication
   */
  async deleteLessonOutline(req: Request, res: Response) {
    try {
      const user = req.user;
      const { outlineId } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!outlineId) {
        return res.status(400).json({
          success: false,
          message: 'Outline ID is required',
        });
      }

      // Find and delete the outline, verifying it belongs to this user
      const deletedOutline = await LessonOutline.findOneAndDelete({
        _id: outlineId,
        userId: user._id,
      });

      if (!deletedOutline) {
        return res.status(404).json({
          success: false,
          message: 'Lesson outline not found or access denied',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lesson outline deleted successfully',
        data: {
          deletedId: outlineId,
        },
      });
    } catch (error) {
      console.error('Error in deleteLessonOutline:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete lesson outline',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AIController();
