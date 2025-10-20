import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import { AssessmentQuestion } from '@/api';
import { LessonResponse } from '@/types/lesson';

interface LearningState {
  // Topic state
  topic: string;
  setTopic: (topic: string) => void;
  
  // Assessment questions state
  questions: AssessmentQuestion[];
  setQuestions: (questions: AssessmentQuestion[]) => void;
  
  // User responses to assessment questions
  responses: Record<string, string[]>;
  setResponse: (questionId: string, selectedOptions: string[]) => void;
  setResponses: (responses: Record<string, string[]>) => void;
  
  // Lesson outline state
  lessonOutline: any | null;
  setLessonOutline: (outline: any) => void;
  
  // Current page tracking
  currentSectionIndex: number;
  currentPageIndex: number;
  setCurrentPage: (sectionIndex: number, pageIndex: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // Whiteboard content cache (keyed by pageId)
  whiteboardContentCache: Record<string, LessonResponse>;
  setWhiteboardContent: (pageId: string, content: LessonResponse) => void;
  clearWhiteboardCache: () => void;
  
  // Loading states
  isLoadingQuestions: boolean;
  setIsLoadingQuestions: (loading: boolean) => void;
  isLoadingOutline: boolean;
  setIsLoadingOutline: (loading: boolean) => void;
  isLoadingWhiteboard: boolean;
  setIsLoadingWhiteboard: (loading: boolean) => void;
  
  // Reset function to clear all state
  reset: () => void;
}

const initialState = {
  topic: '',
  questions: [],
  responses: {},
  lessonOutline: null,
  currentSectionIndex: 0,
  currentPageIndex: 0,
  whiteboardContentCache: {},
  isLoadingQuestions: false,
  isLoadingOutline: false,
  isLoadingWhiteboard: false,
};

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Topic actions
      setTopic: (topic: string) => set({ topic }),
      
      // Questions actions
      setQuestions: (questions: AssessmentQuestion[]) => set({ questions }),
      
      // Responses actions
      setResponse: (questionId: string, selectedOptions: string[]) =>
        set((state) => ({
          responses: {
            ...state.responses,
            [questionId]: selectedOptions,
          },
        })),
      
      setResponses: (responses: Record<string, string[]>) => set({ responses }),
      
      // Lesson outline actions
      setLessonOutline: (outline: any) => set({ lessonOutline: outline }),
      
      // Current page actions
      setCurrentPage: (sectionIndex: number, pageIndex: number) => 
        set({ currentSectionIndex: sectionIndex, currentPageIndex: pageIndex }),
      
      nextPage: () =>
        set((state) => {
          if (!state.lessonOutline || !state.lessonOutline.sections) return state;
          
          const currentSection = state.lessonOutline.sections[state.currentSectionIndex];
          if (!currentSection) return state;
          
          // Check if there's a next page in current section
          if (state.currentPageIndex < currentSection.pages.length - 1) {
            return {
              currentPageIndex: state.currentPageIndex + 1,
            };
          }
          
          // Check if there's a next section
          if (state.currentSectionIndex < state.lessonOutline.sections.length - 1) {
            return {
              currentSectionIndex: state.currentSectionIndex + 1,
              currentPageIndex: 0,
            };
          }
          
          // Already at the last page
          return state;
        }),
      
      previousPage: () =>
        set((state) => {
          if (!state.lessonOutline || !state.lessonOutline.sections) return state;
          
          // Check if there's a previous page in current section
          if (state.currentPageIndex > 0) {
            return {
              currentPageIndex: state.currentPageIndex - 1,
            };
          }
          
          // Check if there's a previous section
          if (state.currentSectionIndex > 0) {
            const prevSection = state.lessonOutline.sections[state.currentSectionIndex - 1];
            return {
              currentSectionIndex: state.currentSectionIndex - 1,
              currentPageIndex: prevSection.pages.length - 1,
            };
          }
          
          // Already at the first page
          return state;
        }),
      
      // Whiteboard content cache actions
      setWhiteboardContent: (pageId: string, content: LessonResponse) =>
        set((state) => ({
          whiteboardContentCache: {
            ...state.whiteboardContentCache,
            [pageId]: content,
          },
        })),
      
      clearWhiteboardCache: () => set({ whiteboardContentCache: {} }),
      
      // Loading actions
      setIsLoadingQuestions: (loading: boolean) => set({ isLoadingQuestions: loading }),
      setIsLoadingOutline: (loading: boolean) => set({ isLoadingOutline: loading }),
      setIsLoadingWhiteboard: (loading: boolean) => set({ isLoadingWhiteboard: loading }),
      
      // Reset action
      reset: () => set(initialState),
    }),
    {
      name: 'learning-storage', // LocalStorage key
      partialize: (state) => ({
        topic: state.topic,
        questions: state.questions,
        responses: state.responses,
        lessonOutline: state.lessonOutline,
        currentSectionIndex: state.currentSectionIndex,
        currentPageIndex: state.currentPageIndex,
        whiteboardContentCache: state.whiteboardContentCache,
      }), // Only persist these fields
    }
  )
);

// Helper hook to check if store has been hydrated from localStorage
export const useStoreHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for store to hydrate from localStorage
    const unsubHydrate = useLearningStore.persist.onHydrate(() => {
      setHydrated(false);
    });
    
    const unsubFinishHydration = useLearningStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Set hydrated to true if already hydrated
    setHydrated(true);

    return () => {
      unsubHydrate?.();
      unsubFinishHydration?.();
    };
  }, []);

  return hydrated;
};
