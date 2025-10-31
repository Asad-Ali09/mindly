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
import socketService from "@/lib/socketService";

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
  
  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  const [showTextBox, setShowTextBox] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [questionAnswer, setQuestionAnswer] = useState<{
    question: string;
    totalDuration: number;
    captions: Array<{
      timestamp: number;
      text: string;
      duration: number;
      position?: 'bottom' | 'top' | 'middle';
    }>;
    animations: Array<{
      id: string;
      name?: string;
      start: number;
      duration: number;
      loop?: boolean;
    }>;
  } | null>(null);
  const [answerPlayback, setAnswerPlayback] = useState({
    isPlaying: false,
    currentTime: 0,
  });
  const answerAnimationRef = useRef<number | null>(null);
  const answerStartTimeRef = useRef<number | null>(null);
  const answerPauseTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  
  // Audio refs for answer playback (similar to Whiteboard)
  const answerAudioRef = useRef<HTMLAudioElement | null>(null);
  const playedAnswerCaptionsRef = useRef<Set<number>>(new Set());
  const answerAudioQueueRef = useRef<Map<number, string>>(new Map());

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

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setSpokenText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
    
    // Initialize socket connection
    socketService.connect();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Clean up socket listeners
      socketService.removeAllListeners('audio-response');
      socketService.removeAllListeners('tts-error');
    };
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Pause the lecture when user wants to ask a question
      if (isPlaying) {
        setIsPlaying(false);
      }
      setShowTextBox(true);
      setSpokenText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendQuestion = async () => {
    if (!spokenText.trim()) return;

    try {
      setIsSubmittingQuestion(true);
      setError(null);

      // Get completed pages (all pages before current one)
      const completedPages: string[] = [];
      if (lessonOutline && lessonOutline.sections) {
        for (let i = 0; i < lessonOutline.sections.length; i++) {
          const section = lessonOutline.sections[i];
          if (i < currentSectionIndex) {
            // All pages from previous sections
            completedPages.push(...section.pages.map((p: any) => p.id));
          } else if (i === currentSectionIndex) {
            // Pages before current page in current section
            completedPages.push(...section.pages.slice(0, currentPageIndex).map((p: any) => p.id));
          }
        }
      }

      const currentPageId = pageInfo?.page.id || '';

      const response = await aiApi.answerLessonQuestion({
        lessonOutline,
        completedPages,
        currentPageId,
        question: spokenText,
      });

      if (response.success && response.data) {
        const answerData = {
          question: response.data.question,
          totalDuration: response.data.totalDuration,
          captions: response.data.captions,
          animations: response.data.animations,
        };
        setQuestionAnswer(answerData);
        
        // Pre-fetch audio for all answer captions (similar to Whiteboard)
        answerAudioQueueRef.current.clear();
        playedAnswerCaptionsRef.current.clear();
        
        const totalCaptions = answerData.captions.length;
        let fetchedCount = 0;
        
        answerData.captions.forEach((caption, index) => {
          setTimeout(() => {
            socketService.requestTextToSpeech(
              caption.text,
              (audioData) => {
                if (caption.text === audioData.text) {
                  answerAudioQueueRef.current.set(index, audioData.audio);
                  fetchedCount++;
                  console.log(`✓ Answer audio cached for caption ${index} (${fetchedCount}/${totalCaptions})`);
                  
                  // Start playback when all audio is fetched
                  if (fetchedCount === totalCaptions) {
                    console.log('🎬 All answer audio fetched, starting playback...');
                    setAnswerPlayback({ isPlaying: true, currentTime: 0 });
                  }
                }
              },
              (error) => {
                console.error(`✗ Failed to get answer audio for caption ${index}:`, error.message);
                fetchedCount++;
                
                // Even if some audio fails, start playback when all requests complete
                if (fetchedCount === totalCaptions) {
                  console.log('🎬 Audio fetching complete (some may have failed), starting playback...');
                  setAnswerPlayback({ isPlaying: true, currentTime: 0 });
                }
              }
            );
          }, index * 100); // Stagger requests
        });
      } else {
        setError('Failed to get answer. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      setError('Failed to get answer. Please try again.');
    } finally {
      setIsSubmittingQuestion(false);
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  const handleCancelQuestion = () => {
    setShowTextBox(false);
    setSpokenText('');
    setQuestionAnswer(null);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleCloseAnswer = () => {
    setQuestionAnswer(null);
    setShowTextBox(false);
    setSpokenText('');
    setAnswerPlayback({ isPlaying: false, currentTime: 0 });
    
    // Stop audio playback
    if (answerAudioRef.current) {
      answerAudioRef.current.pause();
      answerAudioRef.current = null;
    }
    
    // Clear audio queues
    answerAudioQueueRef.current.clear();
    playedAnswerCaptionsRef.current.clear();
    
    // Cancel animation frame
    if (answerAnimationRef.current !== null) {
      cancelAnimationFrame(answerAnimationRef.current);
      answerAnimationRef.current = null;
    }
    
    // Reset time refs
    answerStartTimeRef.current = null;
    answerPauseTimeRef.current = 0;
  };

  // Animation loop for answer playback
  useEffect(() => {
    if (!answerPlayback.isPlaying || !questionAnswer) {
      if (answerAnimationRef.current !== null) {
        cancelAnimationFrame(answerAnimationRef.current);
        answerAnimationRef.current = null;
      }
      return;
    }

    // When resuming or starting, calculate the correct start time
    if (answerStartTimeRef.current === null) {
      answerStartTimeRef.current = performance.now() - (answerPauseTimeRef.current * 1000);
    }

    const animate = (timestamp: number) => {
      if (!answerStartTimeRef.current) return;

      const elapsed = (timestamp - answerStartTimeRef.current) / 1000;
      setAnswerPlayback(prev => ({ ...prev, currentTime: elapsed }));

      // Update avatar animation based on current time
      const currentAnimation = questionAnswer.animations.find(
        anim => elapsed >= anim.start && elapsed < anim.start + anim.duration
      );
      if (currentAnimation) {
        setActiveAvatarAnimation(currentAnimation.name || currentAnimation.id);
      }

      // Play audio for captions (similar to Whiteboard)
      questionAnswer.captions.forEach((caption, index) => {
        const captionStart = caption.timestamp;
        const captionEnd = caption.timestamp + caption.duration;
        
        if (elapsed >= captionStart && elapsed < captionEnd) {
          // Check if we just entered this caption's timeframe
          const justEntered = elapsed >= captionStart && elapsed < captionStart + 0.1;
          
          if (justEntered && !playedAnswerCaptionsRef.current.has(index)) {
            playedAnswerCaptionsRef.current.add(index);
            
            // Check if audio is available in queue
            const audioBase64 = answerAudioQueueRef.current.get(index);
            
            if (audioBase64) {
              console.log(`🔊 Playing answer audio for caption ${index}: "${caption.text.substring(0, 50)}..."`);
              
              // Stop any currently playing audio
              if (answerAudioRef.current) {
                answerAudioRef.current.pause();
                answerAudioRef.current = null;
              }
              
              // Play the audio
              try {
                const byteCharacters = atob(audioBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/wav' });

                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                answerAudioRef.current = audio;
                
                audio.play().catch((error) => {
                  console.error('Error playing answer audio:', error);
                });

                audio.onended = () => {
                  URL.revokeObjectURL(audioUrl);
                  if (answerAudioRef.current === audio) {
                    answerAudioRef.current = null;
                  }
                };
              } catch (error) {
                console.error('Error in answer audio playback:', error);
              }
            } else {
              console.warn(`⚠ Answer audio not yet available for caption ${index}, requesting now...`);
              // Request audio on-demand if not in queue
              socketService.requestTextToSpeech(
                caption.text,
                (audioData) => {
                  if (caption.text === audioData.text) {
                    answerAudioQueueRef.current.set(index, audioData.audio);
                    console.log(`✓ Answer audio fetched on-demand for caption ${index}`);
                  }
                },
                (error) => {
                  console.error(`✗ Failed to get answer audio for caption ${index}:`, error.message);
                }
              );
            }
          }
        }
      });

      // Stop when reaching total duration
      if (elapsed >= questionAnswer.totalDuration) {
        setAnswerPlayback({ isPlaying: false, currentTime: questionAnswer.totalDuration });
        answerStartTimeRef.current = null;
        answerPauseTimeRef.current = questionAnswer.totalDuration;
        return;
      }

      answerAnimationRef.current = requestAnimationFrame(animate);
    };

    answerAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (answerAnimationRef.current !== null) {
        cancelAnimationFrame(answerAnimationRef.current);
        answerAnimationRef.current = null;
      }
    };
  }, [answerPlayback.isPlaying, questionAnswer]);

  // Handle pause/stop for answer playback
  useEffect(() => {
    if (!answerPlayback.isPlaying && answerStartTimeRef.current !== null) {
      // Store pause time when pausing
      answerPauseTimeRef.current = answerPlayback.currentTime;
      
      if (answerAnimationRef.current !== null) {
        cancelAnimationFrame(answerAnimationRef.current);
        answerAnimationRef.current = null;
      }
      if (answerAudioRef.current) {
        answerAudioRef.current.pause();
        answerAudioRef.current = null;
      }
      // Reset time ref so it recalculates on resume
      answerStartTimeRef.current = null;
    }
  }, [answerPlayback.isPlaying, answerPlayback.currentTime]);

  // Get current caption for answer
  const getCurrentAnswerCaption = () => {
    if (!questionAnswer) return '';
    
    const currentTime = answerPlayback.currentTime;
    for (const caption of questionAnswer.captions) {
      if (currentTime >= caption.timestamp && currentTime < caption.timestamp + caption.duration) {
        return caption.text;
      }
    }
    return '';
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
    <div className="h-screen flex flex-col bg-[#141712]">
      {/* Header */}
      <div className="bg-[#141712] border-b border-[#bf3a0d]/20 text-[#ffffff] px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex gap-3">
          <button
            onClick={isPlaying ? handlePause : handleStart}
            disabled={!lesson || isLoadingWhiteboard}
            className="px-4 py-2 bg-[#bf3a0d] hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed rounded-lg transition-colors"
          > 
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-[#bf3a0d]/70 hover:bg-[#bf3a0d] rounded-lg transition-colors"
          >
            ⏹ Reset
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-[#ffffff]/10 hover:bg-[#ffffff]/20 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-3">
          {/* Mic Button */}
          <button
            onClick={handleMicClick}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-[#bf3a0d] hover:bg-[#bf3a0d]/90'
            }`}
            title="Ask a question"
          >
            {isListening ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                Ask
              </>
            )}
          </button>
          {/* Audio fetch status */}
          {(audioTotal > 0) && (
            <div className="text-sm px-3 py-1 rounded-md flex items-center gap-2"
                 style={{ background: audioFetchLoading ? 'rgba(191, 58, 13, 0.15)' : 'rgba(191, 58, 13, 0.1)', color: audioFetchLoading ? '#bf3a0d' : '#bf3a0d' }}>
              {audioFetchLoading ? (
                <>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#bf3a0d' }} />
                  <span>Loading audio: {audioFetched}/{audioTotal}</span>
                </>
              ) : (
                <span>Audio fetched: {audioFetched}/{audioTotal}</span>
              )}
            </div>
          )}
          {pageInfo && (
            <div className="text-sm bg-[#ffffff]/10 px-4 py-2 rounded-lg">
              <span className="text-[#ffffff]/60">Section {currentSectionIndex + 1}, Page {currentPageIndex + 1}:</span>
              <span className="ml-2 font-semibold text-[#ffffff]">{pageInfo.page.title}</span>
            </div>
          )}
          <button
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
            className="px-4 py-2 bg-[#bf3a0d] hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!canGoNext}
            className="px-4 py-2 bg-[#bf3a0d] hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
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
        <div className="bg-[#141712] border-b border-[#bf3a0d]/20 px-6 py-2">
          <div className="flex items-center gap-4">
            <span className="text-[#ffffff] text-sm min-w-[80px]">
              {currentTime.toFixed(1)}s / {lesson.totalDuration}s
            </span>
            <div className="flex-1 bg-[#ffffff]/10 rounded-full h-2">
              <div
                className="bg-[#bf3a0d] h-2 rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / lesson.totalDuration) * 100}%` }}
              />
            </div>
            <span className="text-[#ffffff] text-sm font-medium">{lesson.topic}</span>
          </div>
        </div>
      )}

  {/* Main content: Whiteboard + Avatar */}
  <div className="flex-1 h-0 relative flex flex-col md:flex-row bg-[#141712]">
        {/* Loading Overlay */}
        {isLoadingWhiteboard && (
          <div className="absolute inset-0 bg-[#141712]/80 z-40 flex items-center justify-center">
            <div className="bg-[#141712] border border-[#bf3a0d] rounded-lg p-6 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#bf3a0d] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#ffffff] font-medium">Loading whiteboard content...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isLoadingWhiteboard && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-[#bf3a0d]/10 border border-[#bf3a0d] text-[#bf3a0d] px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-[#bf3a0d] hover:text-[#bf3a0d]/70"
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
        <div className="hidden md:flex md:w-1/3 lg:w-1/4 items-center justify-center p-4 bg-[#141712] border-l border-[#bf3a0d]/20">
          <div className=" w-full h-full max-w-sm max-h-[600px] rounded-lg shadow-lg bg-[#141712] border border-[#bf3a0d]/30 backdrop-blur-sm overflow-hidden">
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

      {/* Speech Recognition Text Box */}
      {showTextBox && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#141712] border-t border-[#bf3a0d]/30 p-4 shadow-2xl z-50">
          <div className="max-w-4xl mx-auto">
            {!questionAnswer ? (
              // Question input view
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[#ffffff]/60 text-sm mb-2">
                    {isListening ? 'Listening...' : 'Your Question'}
                  </label>
                  <textarea
                    value={spokenText}
                    onChange={(e) => setSpokenText(e.target.value)}
                    placeholder="Speak or type your question..."
                    className="w-full px-4 py-3 bg-[#ffffff]/10 border border-[#bf3a0d]/30 rounded-lg text-[#ffffff] placeholder-[#ffffff]/40 focus:outline-none focus:border-[#bf3a0d] focus:ring-1 focus:ring-[#bf3a0d] resize-none"
                    rows={3}
                    disabled={isSubmittingQuestion}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSendQuestion}
                    disabled={!spokenText.trim() || isSubmittingQuestion}
                    className="px-6 py-3 bg-[#bf3a0d] hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    {isSubmittingQuestion ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#ffffff] border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        Send
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelQuestion}
                    disabled={isSubmittingQuestion}
                    className="px-6 py-3 bg-[#ffffff]/10 hover:bg-[#ffffff]/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Answer display view with animated captions
              <div className="space-y-4">
                <div>
                  <label className="block text-[#ffffff]/60 text-sm mb-2">Your Question:</label>
                  <div className="px-4 py-3 bg-[#ffffff]/5 border border-[#bf3a0d]/20 rounded-lg text-[#ffffff]">
                    {spokenText}
                  </div>
                </div>
                
                {/* Progress bar for answer playback */}
                <div className="flex items-center gap-4">
                  <span className="text-[#ffffff] text-sm min-w-[80px]">
                    {answerPlayback.currentTime.toFixed(1)}s / {questionAnswer.totalDuration}s
                  </span>
                  <div className="flex-1 bg-[#ffffff]/10 rounded-full h-2">
                    <div
                      className="bg-[#bf3a0d] h-2 rounded-full transition-all duration-100"
                      style={{ width: `${(answerPlayback.currentTime / questionAnswer.totalDuration) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Current caption display */}
                <div className="min-h-[100px]">
                  <label className="block text-[#ffffff]/60 text-sm mb-2">Answer:</label>
                  <div className="px-4 py-3 bg-[#bf3a0d]/10 border border-[#bf3a0d]/30 rounded-lg text-[#ffffff] min-h-[80px] flex items-center">
                    {getCurrentAnswerCaption() || (
                      <span className="text-[#ffffff]/40 italic">
                        {answerPlayback.currentTime >= questionAnswer.totalDuration 
                          ? 'Answer completed' 
                          : 'Preparing answer...'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {answerPlayback.currentTime < questionAnswer.totalDuration && (
                    <button
                      onClick={() => setAnswerPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
                      className="px-6 py-3 bg-[#bf3a0d]/70 hover:bg-[#bf3a0d] rounded-lg transition-colors font-medium"
                    >
                      {answerPlayback.isPlaying ? '⏸ Pause' : '▶ Resume'}
                    </button>
                  )}
                  <button
                    onClick={handleCloseAnswer}
                    className="px-6 py-3 bg-[#bf3a0d] hover:bg-[#bf3a0d]/90 rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LessonPage