import apiClient from './axios';
import { LessonResponse } from '@/types/lesson';

// Types for API requests and responses
export interface AssessmentOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: (string | AssessmentOption)[];
  correctAnswer?: string;
  explanation?: string;
}

export interface AssessmentQuestionsRequest {
  topic: string;
}

export interface AssessmentQuestionsResponse {
  success: boolean;
  data: {
    topic: string;
    questions: AssessmentQuestion[];
  };
  message?: string;
}

export interface LessonOutlineRequest {
  topic: string;
  responses: Record<string, string[]>;
  questions: AssessmentQuestion[];
}

export interface LessonOutlineResponse {
  success: boolean;
  data: any; // Define proper type based on your lesson outline structure
  message?: string;
}

export interface WhiteboardContentRequest {
  subsectionId: string;
  topic: string;
  subsectionTitle: string;
  subsectionDescription: string;
  estimatedDuration: string;
}

export interface WhiteboardContentResponse {
  success: boolean;
  data: LessonResponse;
  message?: string;
}

export interface APIError {
  success: false;
  message: string;
  error?: string;
}

/**
 * AI API client for all AI-related endpoints
 */
class AIApi {
  /**
   * Get assessment questions for a topic
   * POST /api/ai/assessment-questions
   */
  async getAssessmentQuestions(
    topic: string
  ): Promise<AssessmentQuestionsResponse> {
    const response = await apiClient.post<AssessmentQuestionsResponse>(
      '/ai/assessment-questions',
      { topic }
    );
    return response.data;
  }

  /**
   * Generate lesson outline based on assessment responses
   * POST /api/ai/lesson-outline
   */
  async getLessonOutline(
    data: LessonOutlineRequest
  ): Promise<LessonOutlineResponse> {
    const response = await apiClient.post<LessonOutlineResponse>(
      '/ai/lesson-outline',
      data
    );
    return response.data;
  }

  /**
   * Generate whiteboard content for a specific subsection
   * POST /api/ai/whiteboard-content
   */
  async getWhiteboardContent(
    data: WhiteboardContentRequest
  ): Promise<WhiteboardContentResponse> {
    const response = await apiClient.post<WhiteboardContentResponse>(
      '/ai/whiteboard-content',
      data
    );
    return response.data;
  }
}

// Export singleton instance
export const aiApi = new AIApi();

// Export default
export default aiApi;
