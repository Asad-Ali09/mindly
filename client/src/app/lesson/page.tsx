'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import Whiteboard from "@/components/Whiteboard";
import LessonOutlineOverlay from "@/components/LessonOutlineOverlay";
import { Avatar } from "@/components/Avatar";
import { LessonResponse } from "@/types/lesson";
import { useLearningStore } from "@/store/learningStore";
import { aiApi } from "@/api";
import { useFBX } from "@react-three/drei";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";

function useAnimations() {
  const breathingIdle = useFBX("/animations/Breathing Idle.fbx");
  const handsForward = useFBX("/animations/Hands Forward Gesture.fbx");
  const headNodYes = useFBX("/animations/Head Nod Yes.fbx");
  const pointing = useFBX("/animations/Pointing.fbx");
  const sarcasticNod = useFBX("/animations/Sarcastic Head Nod.fbx");
  const standingArguing = useFBX("/animations/Standing Arguing.fbx");
  const talking = useFBX("/animations/Talking.fbx");
  const talking1 = useFBX("/animations/Talking (1).fbx");
  const talking2 = useFBX("/animations/Talking (2).fbx");
  const waving = useFBX("/animations/Waving.fbx");
  const waving1 = useFBX("/animations/Waving (1).fbx");
  const yelling = useFBX("/animations/Yelling.fbx");

  return useMemo(() => {
    const clips: THREE.AnimationClip[] = [];

    const animationData = [
      { fbx: breathingIdle, name: "Breathing Idle" },
      { fbx: handsForward, name: "Hands Forward Gesture" },
      { fbx: headNodYes, name: "Head Nod Yes" },
      { fbx: pointing, name: "Pointing" },
      { fbx: sarcasticNod, name: "Sarcastic Head Nod" },
      { fbx: standingArguing, name: "Standing Arguing" },
      { fbx: talking, name: "Talking" },
      { fbx: talking1, name: "Talking (1)" },
      { fbx: talking2, name: "Talking (2)" },
      { fbx: waving, name: "Waving" },
      { fbx: waving1, name: "Waving (1)" },
      { fbx: yelling, name: "Yelling" }
    ];

    animationData.forEach(({ fbx, name }) => {
      if (fbx && fbx.animations && fbx.animations.length > 0) {
        const clip = fbx.animations[0];
        clip.name = name;
        clips.push(clip);
      }
    });

    return clips;
  }, [
    breathingIdle, handsForward, headNodYes, pointing,
    sarcasticNod, standingArguing, talking, talking1,
    talking2, waving, waving1, yelling
  ]);
}


const LessonPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [clearKey, setClearKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resetAudioKey, setResetAudioKey] = useState(0); // Key to trigger audio reset in Whiteboard
  const [audioFetchLoading, setAudioFetchLoading] = useState(false);
  const [audioFetched, setAudioFetched] = useState(0);
  const [audioTotal, setAudioTotal] = useState(0);

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

  // Load animation clips for Avatar
  const animationClips = useAnimations();

  // -- Moved states/refs from Whiteboard (so Whiteboard becomes mostly presentation) --
  // Drawing elements and caption state
  const [elements, setElements] = useState<any[]>([]);
  const [currentCaption, setCurrentCaption] = useState<string>('');

  const [activeAvatarAnimation, setActiveAvatarAnimation] = useState<string>('Breathing Idle');

  // Animation and timing refs
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseTimeRef = useRef<number>(0);

  // Audio refs and queues
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedCaptionsRef = useRef<Set<number>>(new Set());
  const audioQueueRef = useRef<Map<number, string>>(new Map());

  // Canvas/container sizing (moved)
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;
  const [canvasWidth, setCanvasWidth] = useState(BASE_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(BASE_HEIGHT);
  const [scale, setScale] = useState(1);

  // containerRef (moved) - passed down and attached to the whiteboard outer div
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleAudioFetchProgress = (fetched: number, total: number, loading: boolean) => {
    setAudioFetched(fetched);
    setAudioTotal(total);
    setAudioFetchLoading(loading);
  };

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
        lessonOutline, // Pass the lesson outline for context
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
  }, [currentSectionIndex, currentPageIndex, whiteboardContentCache]);

  const handleStart = () => {
    if (lesson) {
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    // Trigger a re-render of whiteboard to reset timing refs
    setClearKey(prev => prev + 1);
    // Trigger audio reset in Whiteboard
    setResetAudioKey(prev => prev + 1);
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
            onClick={isPlaying ? handlePause : handleStart}
            disabled={!lesson || isLoadingWhiteboard}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          > 
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            ⏹ Reset
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
          {/* Audio fetch status */}
          {(audioTotal > 0) && (
            <div className="text-sm px-3 py-1 rounded-md flex items-center gap-2"
                 style={{ background: audioFetchLoading ? 'rgba(250, 204, 21, 0.12)' : 'rgba(16,185,129,0.08)', color: audioFetchLoading ? '#b45309' : '#10b981' }}>
              {audioFetchLoading ? (
                <>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#b45309' }} />
                  <span>Loading audio: {audioFetched}/{audioTotal}</span>
                </>
              ) : (
                <span>Audio fetched: {audioFetched}/{audioTotal}</span>
              )}
            </div>
          )}
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

  {/* Main content: Whiteboard + Avatar */}
  <div className="flex-1 h-0 relative flex flex-col md:flex-row">
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

        <div className="flex-1 min-w-0">
          <Whiteboard 
            key={clearKey}
            isPlaying={isPlaying}
            onStart={handleStart}
            onStop={handlePause}
            onReset={handleReset}
            onClear={handleClear}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            lesson={lesson}
            resetAudioKey={resetAudioKey}
            onAudioFetchProgress={handleAudioFetchProgress}
            // moved states/refs
            containerRef={containerRef}
            elements={elements}
            setElements={setElements}
            currentCaption={currentCaption}
            setCurrentCaption={setCurrentCaption}
            activeAvatarAnimation={activeAvatarAnimation}
            setActiveAvatarAnimation={setActiveAvatarAnimation}
            animationRef={animationRef}
            startTimeRef={startTimeRef}
            pauseTimeRef={pauseTimeRef}
            audioRef={audioRef}
            playedCaptionsRef={playedCaptionsRef}
            audioQueueRef={audioQueueRef}
            BASE_WIDTH={BASE_WIDTH}
            BASE_HEIGHT={BASE_HEIGHT}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            setCanvasWidth={setCanvasWidth}
            setCanvasHeight={setCanvasHeight}
            scale={scale}
            setScale={setScale}
          />
        </div>

        {/* Avatar panel - shown on md+ screens next to the whiteboard */}
        <div className="hidden md:flex md:w-1/3 lg:w-1/4 items-center justify-center p-4 bg-gradient-to-tr from-gray-50 to-white">
          <div className=" w-full h-full max-w-sm max-h-[600px] rounded-lg shadow-lg bg-white/60 backdrop-blur-sm overflow-hidden">
            <Canvas camera={{ position: [0, 0.1, 3.2], fov: 40 }} className="w-full h-[420px]">
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1} />
              <Suspense fallback={null}>
                <Avatar animations={animationClips} animation={activeAvatarAnimation} position={[0, -1, 0]} />
              </Suspense>
            </Canvas>
          </div>
        </div>

        {/* Lesson Outline Overlay */}
        <LessonOutlineOverlay />
      </div>
    </div>
  )
}

export default LessonPage