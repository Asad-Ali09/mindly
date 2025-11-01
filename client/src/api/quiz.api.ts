import apiClient from "./axios";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  _id: string;
  lessonOutlineId: string;
  userId: string;
  sectionId: string;
  sectionIndex: number;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  grade: string;
  feedback: string;
  recommendations: string[];
  results: Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

export const quizApi = {
  // Generate a quiz for a specific section of a lesson
  generateQuiz: async (lessonOutlineId: string, sectionId: string): Promise<Quiz> => {
    const response = await apiClient.post("/quiz/generate", {
      lessonOutlineId,
      sectionId,
    });
    return response.data.data;
  },

  // Get a specific quiz by ID
  getQuizById: async (quizId: string): Promise<Quiz> => {
    const response = await apiClient.get(`/quiz/${quizId}`);
    return response.data.data;
  },

  // Get all quizzes for a specific lesson
  getQuizzesByLesson: async (lessonOutlineId: string): Promise<Quiz[]> => {
    const response = await apiClient.get(`/quiz/lesson/${lessonOutlineId}`);
    return response.data.data;
  },

  // Get quiz for a specific section
  getQuizBySection: async (lessonOutlineId: string, sectionId: string): Promise<Quiz> => {
    const response = await apiClient.get(
      `/quiz/section/${lessonOutlineId}/${sectionId}`
    );
    return response.data.data;
  },

  // Submit quiz answers and get results
  submitQuiz: async (quizId: string, answers: Record<string, string>): Promise<QuizResult> => {
    const response = await apiClient.post(`/quiz/${quizId}/submit`, { answers });
    return response.data.data;
  },

  // Delete a quiz
  deleteQuiz: async (quizId: string): Promise<void> => {
    await apiClient.delete(`/quiz/${quizId}`);
  },
};
