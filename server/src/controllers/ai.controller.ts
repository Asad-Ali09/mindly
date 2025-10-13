import { Request, Response } from 'express';
import aiService from '../services/ai.service';

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
   */
  async getLessonOutline(req: Request, res: Response) {
    try {
      const { topic, responses, questions } = req.body;

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

      const outline = await aiService.generateLessonOutline(
        topic.trim(),
        responses,
        questions
      );

      return res.status(200).json({
        success: true,
        data: outline,
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
}

export default new AIController();
