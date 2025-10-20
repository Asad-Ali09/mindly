'use client';

import React, { useState } from 'react';
import { useLearningStore } from '@/store/learningStore';

interface LessonPage {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string;
}

interface LessonSection {
  id: string;
  title: string;
  description: string;
  pages: LessonPage[];
}

interface LessonOutline {
  topic: string;
  overallObjective: string;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  totalEstimatedDuration: string;
  sections: LessonSection[];
}

const LessonOutlineOverlay = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const lessonOutline = useLearningStore((state) => state.lessonOutline) as LessonOutline | null;

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  if (!lessonOutline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 px-4 py-2 bg-gray-800/90 hover:bg-gray-700/90 text-white rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
        aria-label={isExpanded ? 'Collapse outline' : 'Expand outline'}
      >
        <span className="text-sm font-medium">Lesson Outline</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Outline Panel */}
      <div
        className={`bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ width: isExpanded ? '380px' : '0px' }}
      >
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-1">{lessonOutline.topic}</h2>
            <p className="text-sm text-gray-600 mb-2">{lessonOutline.overallObjective}</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {lessonOutline.knowledgeLevel}
              </span>
              <span className="text-gray-500">⏱ {lessonOutline.totalEstimatedDuration}</span>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {lessonOutline.sections.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-600 transition-transform duration-200 flex-shrink-0 ${
                      expandedSections.has(section.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Section Content */}
                <div
                  className={`transition-all duration-200 overflow-hidden ${
                    expandedSections.has(section.id) ? 'max-h-[500px]' : 'max-h-0'
                  }`}
                >
                  <div className="px-3 py-2 bg-white">
                    <p className="text-xs text-gray-600 mb-2">{section.description}</p>
                    
                    {/* Pages */}
                    {section.pages && section.pages.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {section.pages.map((page, pageIndex) => (
                          <div
                            key={page.id}
                            className="pl-3 border-l-2 border-blue-300 py-1"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-blue-600 font-medium flex-shrink-0">
                                {index + 1}.{pageIndex + 1}
                              </span>
                              <div className="flex-1">
                                <h4 className="text-xs font-medium text-gray-800">{page.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{page.description}</p>
                                <span className="text-xs text-gray-400 mt-1 inline-block">
                                  ⏱ {page.estimatedDuration}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonOutlineOverlay;
