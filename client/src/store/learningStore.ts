import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import { AssessmentQuestion } from '@/api';

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
  
  // Loading states
  isLoadingQuestions: boolean;
  setIsLoadingQuestions: (loading: boolean) => void;
  isLoadingOutline: boolean;
  setIsLoadingOutline: (loading: boolean) => void;
  
  // Reset function to clear all state
  reset: () => void;
}

const initialState = {
  topic: '',
  questions: [],
  responses: {},
  lessonOutline: null,
  isLoadingQuestions: false,
  isLoadingOutline: false,
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
      
      // Loading actions
      setIsLoadingQuestions: (loading: boolean) => set({ isLoadingQuestions: loading }),
      setIsLoadingOutline: (loading: boolean) => set({ isLoadingOutline: loading }),
      
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
