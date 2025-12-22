import apiClient from './axios';

export interface LessonPageRequest {
  pageNumber: number;
  lessonTitle: string;
  imageUrl?: string;
  imageBase64?: string;
  additionalContext?: string;
}

export interface CaptionSegment {
  timestamp: number;
  text: string;
  duration: number;
  position: 'bottom' | 'top' | 'middle';
}

export interface AvatarAnimation {
  id: string;
  name: string;
  start: number;
  duration: number;
  loop: boolean;
}

export interface LessonPage {
  pageNumber: number;
  title: string;
  totalDuration: number;
  captions: CaptionSegment[];
  animations: AvatarAnimation[];
}

export interface LessonPageResponse {
  success: boolean;
  data: LessonPage;
}

export interface MultiplePagesRequest {
  lessonTitle: string;
  pages: Array<{
    pageNumber: number;
    imageUrl?: string;
    imageBase64?: string;
    additionalContext?: string;
  }>;
}

export interface MultiplePagesResponse {
  success: boolean;
  data: LessonPage[];
}

export interface CompleteLessonRequest {
  lessonTitle: string;
  pages: Array<{
    pageNumber: number;
    imageUrl?: string;
    imageBase64?: string;
    additionalContext?: string;
  }>;
}

export interface CompleteLessonResponse {
  success: boolean;
  data: {
    lessonTitle: string;
    totalPages: number;
    startingPage: number;
    pages: LessonPage[];
  };
}

const lessonGeneratorApi = {
  /**
   * Generate content for a single lesson page
   */
  generatePage: async (request: LessonPageRequest): Promise<LessonPageResponse> => {
    const response = await apiClient.post<LessonPageResponse>(
      '/lesson-generator/generate-page',
      request
    );
    return response.data;
  },

  /**
   * Generate content for multiple lesson pages
   */
  generateMultiplePages: async (request: MultiplePagesRequest): Promise<MultiplePagesResponse> => {
    const response = await apiClient.post<MultiplePagesResponse>(
      '/lesson-generator/generate-multiple-pages',
      request
    );
    return response.data;
  },

  /**
   * Generate a complete lesson with all pages
   */
  generateCompleteLesson: async (request: CompleteLessonRequest): Promise<CompleteLessonResponse> => {
    const response = await apiClient.post<CompleteLessonResponse>(
      '/lesson-generator/generate-lesson',
      request
    );
    return response.data;
  },
};

export default lessonGeneratorApi;
