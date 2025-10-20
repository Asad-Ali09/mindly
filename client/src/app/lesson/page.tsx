'use client';

import { useState, useEffect } from "react";
import Whiteboard from "@/components/Whiteboard";
import LessonOutlineOverlay from "@/components/LessonOutlineOverlay";
import { LessonResponse, SAMPLE_LESSON } from "@/types/lesson";
import { useLearningStore } from "@/store/learningStore";

const LessonPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [clearKey, setClearKey] = useState(0);

  // Get lesson outline and page navigation from store
  const lessonOutline = useLearningStore((state) => state.lessonOutline);
  const currentSectionIndex = useLearningStore((state) => state.currentSectionIndex);
  const currentPageIndex = useLearningStore((state) => state.currentPageIndex);
  const nextPage = useLearningStore((state) => state.nextPage);
  const previousPage = useLearningStore((state) => state.previousPage);

  // Calculate if we can navigate
  const canGoPrevious = currentSectionIndex > 0 || currentPageIndex > 0;
  const canGoNext = lessonOutline && lessonOutline.sections && (
    currentSectionIndex < lessonOutline.sections.length - 1 ||
    (currentSectionIndex === lessonOutline.sections.length - 1 &&
     currentPageIndex < lessonOutline.sections[currentSectionIndex].pages.length - 1)
  );

  // Get current page info
  const getCurrentPageInfo = () => {
    if (!lessonOutline || !lessonOutline.sections) return null;
    const section = lessonOutline.sections[currentSectionIndex];
    if (!section || !section.pages) return null;
    const page = section.pages[currentPageIndex];
    return page ? { section, page } : null;
  };

  const pageInfo = getCurrentPageInfo();

  const handleStart = () => {
    setLesson(SAMPLE_LESSON);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setLesson(null);
  };

  const handleClear = () => {
    setClearKey(prev => prev + 1);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleNextPage = () => {
    nextPage();
    setIsPlaying(false);
    setCurrentTime(0);
    setClearKey(prev => prev + 1);
    // TODO: Load whiteboard content for the new page
  };

  const handlePreviousPage = () => {
    previousPage();
    setIsPlaying(false);
    setCurrentTime(0);
    setClearKey(prev => prev + 1);
    // TODO: Load whiteboard content for the new page
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={isPlaying}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          > 
            {isPlaying ? '▶ Playing...' : '▶ Start'}
          </button>
          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            ⏸ 
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            ⏹ 
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-3">
          {pageInfo && (
            <div className="text-sm bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400">Section {currentSectionIndex + 1}, Page {currentPageIndex + 1}:</span>
              <span className="ml-2 font-semibold">{pageInfo.page.title}</span>
            </div>
          )}
          <button
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!canGoNext}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {lesson && (
        <div className="bg-gray-700 px-6 py-2">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm min-w-[80px]">
              {currentTime.toFixed(1)}s / {lesson.totalDuration}s
            </span>
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / lesson.totalDuration) * 100}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">{lesson.topic}</span>
          </div>
        </div>
      )}

      {/* Whiteboard */}
      <div className="flex-1 h-0 relative">
        <Whiteboard 
          key={clearKey}
          isPlaying={isPlaying}
          onStart={handleStart}
          onStop={handleStop}
          onReset={handleReset}
          onClear={handleClear}
          currentTime={currentTime}
          onTimeUpdate={handleTimeUpdate}
          lesson={lesson}
        />
        
        {/* Lesson Outline Overlay */}
        <LessonOutlineOverlay />
      </div>
    </div>
  )
}

export default LessonPage