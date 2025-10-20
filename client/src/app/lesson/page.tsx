'use client';

import { useState, useEffect } from "react";
import Whiteboard from "@/components/Whiteboard";
import LessonOutlineOverlay from "@/components/LessonOutlineOverlay";
import { LessonResponse } from "@/types/lesson";
import { useLearningStore } from "@/store/learningStore";
import { aiApi } from "@/api";

const LessonPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [clearKey, setClearKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Get lesson outline and page navigation from store
  const topic = useLearningStore((state) => state.topic);
  const lessonOutline = useLearningStore((state) => state.lessonOutline);
  const currentSectionIndex = useLearningStore((state) => state.currentSectionIndex);
  const currentPageIndex = useLearningStore((state) => state.currentPageIndex);
  const nextPage = useLearningStore((state) => state.nextPage);
  const previousPage = useLearningStore((state) => state.previousPage);
  const whiteboardContentCache = useLearningStore((state) => state.whiteboardContentCache);
  const setWhiteboardContent = useLearningStore((state) => state.setWhiteboardContent);
  const isLoadingWhiteboard = useLearningStore((state) => state.isLoadingWhiteboard);
  const setIsLoadingWhiteboard = useLearningStore((state) => state.setIsLoadingWhiteboard);

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

  // Fetch whiteboard content for current page
  const fetchWhiteboardContent = async (pageId: string, pageTitle: string, pageDescription: string, estimatedDuration: string) => {
    try {
      setIsLoadingWhiteboard(true);
      setError(null);
      
      const response = await aiApi.getWhiteboardContent({
        pageId,
        topic,
        pageTitle,
        pageDescription,
        estimatedDuration,
      });

      if (response.success && response.data) {
        setWhiteboardContent(pageId, response.data);
        setLesson(response.data);
      } else {
        setError('Failed to load whiteboard content');
      }
    } catch (err) {
      console.error('Error fetching whiteboard content:', err);
      setError('Failed to load whiteboard content. Please try again.');
    } finally {
      setIsLoadingWhiteboard(false);
    }
  };

  // Load whiteboard content when page changes
  useEffect(() => {
    if (!pageInfo) return;

    const { page } = pageInfo;
    const cachedContent = whiteboardContentCache[page.id];

    if (cachedContent) {
      // Use cached content
      setLesson(cachedContent);
    } else {
      // Fetch from API
      fetchWhiteboardContent(page.id, page.title, page.description, page.estimatedDuration);
    }

    // Reset playback state when page changes
    setIsPlaying(false);
    setCurrentTime(0);
  }, [currentSectionIndex, currentPageIndex]);

  const handleStart = () => {
    if (lesson) {
      setCurrentTime(0);
      setIsPlaying(true);
    }
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
    setClearKey(prev => prev + 1);
  };

  const handlePreviousPage = () => {
    previousPage();
    setClearKey(prev => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={isPlaying || !lesson || isLoadingWhiteboard}
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
        {/* Loading Overlay */}
        {isLoadingWhiteboard && (
          <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-700 font-medium">Loading whiteboard content...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isLoadingWhiteboard && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

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