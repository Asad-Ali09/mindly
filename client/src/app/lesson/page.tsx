'use client';

import { useState } from "react";
import Whiteboard from "@/components/Whiteboard";
import LessonOutlineOverlay from "@/components/LessonOutlineOverlay";
import { LessonResponse, SAMPLE_LESSON } from "@/types/lesson";

const LessonPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [clearKey, setClearKey] = useState(0);

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