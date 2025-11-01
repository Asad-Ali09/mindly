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

interface LessonOutlineOverlayProps {
  inHeader?: boolean;
}

const LessonOutlineOverlay: React.FC<LessonOutlineOverlayProps> = ({ inHeader = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const lessonOutline = useLearningStore((state) => state.lessonOutline) as LessonOutline | null;
  const currentSectionIndex = useLearningStore((state) => state.currentSectionIndex);
  const currentPageIndex = useLearningStore((state) => state.currentPageIndex);
  const setCurrentPage = useLearningStore((state) => state.setCurrentPage);
  const isLoadingWhiteboard = useLearningStore((state) => state.isLoadingWhiteboard);

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

  const handlePageClick = (sectionIndex: number, pageIndex: number) => {
    setCurrentPage(sectionIndex, pageIndex);
  };

  const isCurrentPage = (sectionIndex: number, pageIndex: number) => {
    return currentSectionIndex === sectionIndex && currentPageIndex === pageIndex;
  };

  if (!lessonOutline) {
    return null;
  }

  // When in header, return just the button component
  if (inHeader) {
    return (
      <div className="relative flex items-center">
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 bg-[#bf3a0d]/90 hover:bg-[#bf3a0d] text-[#ffffff] rounded-lg transition-all duration-300 flex items-center gap-2"
          aria-label={isExpanded ? 'Collapse outline' : 'Expand outline'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          <span className="text-sm font-medium">Outline</span>
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

        {/* Outline Panel - positioned below button */}
        {isExpanded && (
          <div className="absolute top-full right-0 mt-2 z-50">
            <div
              className="bg-[#141712]/95 backdrop-blur-md rounded-lg shadow-2xl border border-[#bf3a0d]/30 transition-all duration-300 overflow-hidden"
              style={{ width: '380px' }}
            >
              <div className="p-4 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="mb-4 pb-3 border-b border-[#bf3a0d]/30">
                  <h2 className="text-xl font-bold text-[#ffffff] mb-1">{lessonOutline.topic}</h2>
                  <p className="text-sm text-[#ffffff]/70 mb-2">{lessonOutline.overallObjective}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-1 bg-[#bf3a0d]/20 text-[#bf3a0d] rounded-full font-medium">
                      {lessonOutline.knowledgeLevel}
                    </span>
                    <span className="text-[#ffffff]/60">⏱ {lessonOutline.totalEstimatedDuration}</span>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-3">
                  {lessonOutline.sections.map((section, index) => (
                    <div key={section.id} className="border border-[#bf3a0d]/30 rounded-lg overflow-hidden">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full px-3 py-2 bg-[#ffffff]/5 hover:bg-[#bf3a0d]/10 transition-colors flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="flex-shrink-0 w-6 h-6 bg-[#bf3a0d] text-[#ffffff] rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-[#ffffff]">{section.title}</span>
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 text-[#ffffff]/60 transition-transform duration-200 flex-shrink-0 ${
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
                        className={`transition-all duration-200 ${
                          expandedSections.has(section.id) ? 'max-h-[500px]' : 'max-h-0 overflow-hidden'
                        }`}
                      >
                        <div className="px-3 py-2 bg-[#141712]">
                          <p className="text-xs text-[#ffffff]/70 mb-2">{section.description}</p>
                          
                          {/* Pages */}
                          {section.pages && section.pages.length > 0 && (
                            <div className="space-y-2 mt-2 max-h-[380px] overflow-y-auto scrollbar-hide">
                              {section.pages.map((page, pageIndex) => (
                                <div
                                  key={page.id}
                                  onClick={() => !isLoadingWhiteboard && handlePageClick(index, pageIndex)}
                                  className={`pl-3 border-l-2 py-1 transition-all ${
                                    isLoadingWhiteboard 
                                      ? 'cursor-not-allowed opacity-50' 
                                      : 'cursor-pointer'
                                  } ${
                                    isCurrentPage(index, pageIndex)
                                      ? 'border-[#bf3a0d] bg-[#bf3a0d]/10'
                                      : 'border-[#bf3a0d]/30 hover:bg-[#ffffff]/5'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className={`text-xs font-medium flex-shrink-0 ${
                                      isCurrentPage(index, pageIndex) ? 'text-[#bf3a0d]' : 'text-[#bf3a0d]/70'
                                    }`}>
                                      {index + 1}.{pageIndex + 1}
                                    </span>
                                    <div className="flex-1">
                                      <h4 className={`text-xs font-medium ${
                                        isCurrentPage(index, pageIndex) ? 'text-[#ffffff]' : 'text-[#ffffff]/80'
                                      }`}>
                                        {page.title}
                                        {isCurrentPage(index, pageIndex) && (
                                          <span className="ml-2 text-xs bg-[#bf3a0d] text-[#ffffff] px-2 py-0.5 rounded-full">
                                            Current
                                          </span>
                                        )}
                                      </h4>
                                      <p className="text-xs text-[#ffffff]/50 mt-0.5">{page.description}</p>
                                      <span className="text-xs text-[#ffffff]/40 mt-1 inline-block">
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
        )}
      </div>
    );
  }

  // Original fixed positioning for non-header usage
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col items-end">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 px-4 py-2 bg-[#bf3a0d]/90 hover:bg-[#bf3a0d] text-[#ffffff] rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
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
        className={`bg-[#141712]/95 backdrop-blur-md rounded-lg shadow-2xl border border-[#bf3a0d]/30 transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ width: isExpanded ? '380px' : '0px' }}
      >
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-4 pb-3 border-b border-[#bf3a0d]/30">
            <h2 className="text-xl font-bold text-[#ffffff] mb-1">{lessonOutline.topic}</h2>
            <p className="text-sm text-[#ffffff]/70 mb-2">{lessonOutline.overallObjective}</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-1 bg-[#bf3a0d]/20 text-[#bf3a0d] rounded-full font-medium">
                {lessonOutline.knowledgeLevel}
              </span>
              <span className="text-[#ffffff]/60">⏱ {lessonOutline.totalEstimatedDuration}</span>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {lessonOutline.sections.map((section, index) => (
              <div key={section.id} className="border border-[#bf3a0d]/30 rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-3 py-2 bg-[#ffffff]/5 hover:bg-[#bf3a0d]/10 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#bf3a0d] text-[#ffffff] rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-[#ffffff]">{section.title}</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-[#ffffff]/60 transition-transform duration-200 flex-shrink-0 ${
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
                  className={`transition-all duration-200 ${
                    expandedSections.has(section.id) ? 'max-h-[500px]' : 'max-h-0 overflow-hidden'
                  }`}
                >
                  <div className="px-3 py-2 bg-[#141712]">
                    <p className="text-xs text-[#ffffff]/70 mb-2">{section.description}</p>
                    
                    {/* Pages */}
                    {section.pages && section.pages.length > 0 && (
                      <div className="space-y-2 mt-2 max-h-[380px] overflow-y-auto scrollbar-hide">
                        {section.pages.map((page, pageIndex) => (
                          <div
                            key={page.id}
                            onClick={() => !isLoadingWhiteboard && handlePageClick(index, pageIndex)}
                            className={`pl-3 border-l-2 py-1 transition-all ${
                              isLoadingWhiteboard 
                                ? 'cursor-not-allowed opacity-50' 
                                : 'cursor-pointer'
                            } ${
                              isCurrentPage(index, pageIndex)
                                ? 'border-[#bf3a0d] bg-[#bf3a0d]/10'
                                : 'border-[#bf3a0d]/30 hover:bg-[#ffffff]/5'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`text-xs font-medium flex-shrink-0 ${
                                isCurrentPage(index, pageIndex) ? 'text-[#bf3a0d]' : 'text-[#bf3a0d]/70'
                              }`}>
                                {index + 1}.{pageIndex + 1}
                              </span>
                              <div className="flex-1">
                                <h4 className={`text-xs font-medium ${
                                  isCurrentPage(index, pageIndex) ? 'text-[#ffffff]' : 'text-[#ffffff]/80'
                                }`}>
                                  {page.title}
                                  {isCurrentPage(index, pageIndex) && (
                                    <span className="ml-2 text-xs bg-[#bf3a0d] text-[#ffffff] px-2 py-0.5 rounded-full">
                                      Current
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-[#ffffff]/50 mt-0.5">{page.description}</p>
                                <span className="text-xs text-[#ffffff]/40 mt-1 inline-block">
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
