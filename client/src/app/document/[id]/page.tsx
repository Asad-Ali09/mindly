'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { Avatar } from '@/components/Avatar';
import { useAuthStore } from '@/store';
import { documentApi, lessonGeneratorApi } from '@/api';
import { useFBX } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import socketService from '@/lib/socketService';

type FileType = 'pdf' | 'pptx' | 'image' | null;

interface DocumentData {
  // Support both old and new formats for backward compatibility
  id?: string;
  _id?: string;
  fileName: string;
  fileSize: number;
  fileType: FileType;
  // Old format
  fileUrl?: string;
  images?: string[];
  // New format
  cloudinaryUrl?: string;
  pageImages?: string[];
  thumbnailUrl?: string;
  isPublic?: boolean;
  createdAt: string;
}

interface LessonPage {
  pageNumber: number;
  title: string;
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
}

interface LessonData {
  lessonTitle: string;
  totalPages: number;
  pages: LessonPage[];
}

// Hook to load animations
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

const DocumentViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  const { user } = useAuthStore();
  
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [viewMode, setViewMode] = useState<'images' | 'browser'>('images');
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);
  const [isDragging, setIsDragging] = useState(false);

  // Lecture mode states
  const [lectureMode, setLectureMode] = useState(false);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<string>('Breathing Idle');
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const [currentAudioElement, setCurrentAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState({ loaded: 0, total: 0 });

  // Animation and timing refs
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseTimeRef = useRef<number>(0);

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedCaptionsRef = useRef<Set<number>>(new Set());
  const audioQueueRef = useRef<Map<number, string>>(new Map());
  const audioLoadedCountRef = useRef<number>(0);
  const expectedAudioCountRef = useRef<number>(0);

  // Load animation clips
  const animationClips = useAnimations();

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const windowWidth = window.innerWidth;
    const newWidth = (e.clientX / windowWidth) * 100;
    
    if (newWidth >= 20 && newWidth <= 60) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Initialize socket connection for TTS
  useEffect(() => {
    socketService.connect();
    return () => {
      socketService.removeAllListeners('audio-response');
      socketService.removeAllListeners('tts-error');
    };
  }, []);

  // Fetch document data
  useEffect(() => {
    let isMounted = true;
    
    const fetchDocument = async () => {
      if (!documentId) return;
      
      // Start with loading state
      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }
      
      // Check if document data is in sessionStorage (from fresh upload)
      const cachedData = sessionStorage.getItem(`document_${documentId}`);
      if (cachedData) {
        try {
          const data = JSON.parse(cachedData);
          if (isMounted) {
            setDocumentData(data);
            setError(null);
            setIsLoading(false);
          }
          // Remove from sessionStorage after use
          sessionStorage.removeItem(`document_${documentId}`);
          return;
        } catch (e) {
          // If parsing fails, fall through to API fetch
        }
      }
      
      // Fetch from API with retry logic
      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await documentApi.getDocument(documentId);
          
          if (!isMounted) return;
          
          // Cloudinary URLs are already absolute, no need to prepend base URL
          const data: DocumentData = {
            _id: response.data._id,
            id: response.data._id, // Backward compatibility
            fileName: response.data.fileName,
            fileSize: response.data.fileSize,
            fileType: response.data.fileType as FileType,
            cloudinaryUrl: response.data.cloudinaryUrl,
            pageImages: response.data.pageImages || [],
            thumbnailUrl: response.data.thumbnailUrl,
            isPublic: response.data.isPublic,
            createdAt: response.data.createdAt,
            // Legacy fields for backward compatibility
            fileUrl: response.data.cloudinaryUrl,
            images: response.data.pageImages || [],
          };
          
          setDocumentData(data);
          setError(null);
          setIsLoading(false);
          return; // Success, exit retry loop
          
        } catch (err: any) {
          if (!isMounted) return;
          
          // If not the last attempt, wait and retry
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          
          // Last attempt failed
          const errorMessage = err.response?.data?.message || 'Failed to load document';
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    fetchDocument();
    
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (documentData?.images && currentImageIndex < documentData.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  // Lecture mode functions
  const getCurrentPage = (): LessonPage | null => {
    if (!lectureMode || !lessonData) return null;
    // Find page matching current image index (pageNumber 1 = image index 0)
    return lessonData.pages.find(p => p.pageNumber === currentImageIndex + 1) || null;
  };

  const handleStartLecture = async () => {
    if (!documentData?.images || documentData.images.length === 0) {
      setGenerationError('No pages available to generate lesson');
      return;
    }

    try {
      setIsGeneratingLesson(true);
      setGenerationError(null);
      
      // Get the first page image URL
      const firstPageImageUrl = documentData.images[0];
      
      // Generate lesson content for the first page
      const response = await lessonGeneratorApi.generatePage({
        pageNumber: 1,
        lessonTitle: documentData.fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        imageUrl: firstPageImageUrl,
        additionalContext: 'Create engaging educational content for this page'
      });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to generate lesson content');
      }

      // Set the lesson data with the first page
      setLessonData({
        lessonTitle: documentData.fileName,
        totalPages: documentData.images.length,
        pages: [response.data]
      });

      setIsGeneratingLesson(false);
      setLectureMode(true);
      setIsPlaying(false); // Don't play yet
      setCurrentImageIndex(0); // Start at first page
      setCurrentTime(0);
      pauseTimeRef.current = 0;
      startTimeRef.current = null;
      playedCaptionsRef.current.clear();
      audioQueueRef.current.clear();
      
      // Pre-fetch audio for first page
      const firstPage = response.data;
      if (firstPage) {
        setIsLoadingAudio(true);
        audioLoadedCountRef.current = 0;
        expectedAudioCountRef.current = firstPage.captions.length;
        setAudioProgress({ loaded: 0, total: firstPage.captions.length });
        
        const audioPromises = firstPage.captions.map((caption, index) => {
          return new Promise<void>((resolve) => {
            socketService.requestTextToSpeech(
              caption.text,
              (data) => {
                audioQueueRef.current.set(index, data.audio);
                audioLoadedCountRef.current++;
                setAudioProgress({ 
                  loaded: audioLoadedCountRef.current, 
                  total: expectedAudioCountRef.current 
                });
                resolve();
              },
              (error) => {
                console.error('Error loading audio:', error);
                audioLoadedCountRef.current++;
                setAudioProgress({ 
                  loaded: audioLoadedCountRef.current, 
                  total: expectedAudioCountRef.current 
                });
                resolve();
              }
            );
          });
        });
        
        // Wait for all audio to load
        await Promise.all(audioPromises);
        setIsLoadingAudio(false);
        // Now start playing
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error generating lesson:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate lesson content');
      setIsGeneratingLesson(false);
    }
  };

  const handlePauseLecture = () => {
    setIsPlaying(false);
    setActiveAnimation('Breathing Idle');
  };

  const handleResumeLecture = () => {
    setIsPlaying(true);
  };

  const handleStopLecture = () => {
    setIsPlaying(false);
    setLectureMode(false);
    setCurrentTime(0);
    setCurrentImageIndex(0); // Reset to first page
    setActiveAnimation('Breathing Idle');
    setCurrentCaption('');
    pauseTimeRef.current = 0;
    startTimeRef.current = null;
    playedCaptionsRef.current.clear();
    audioQueueRef.current.clear();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setCurrentAudioElement(null);
    }
    
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // Animation loop for lecture playback
  useEffect(() => {
    if (!isPlaying || !lectureMode) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const currentPage = getCurrentPage();
    if (!currentPage) return;

    // When resuming or starting, calculate the correct start time
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now() - (pauseTimeRef.current * 1000);
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) return;

      const elapsed = (timestamp - startTimeRef.current) / 1000;
      setCurrentTime(elapsed);

      // Update avatar animation based on current time
      const currentAnimation = currentPage.animations.find(
        anim => elapsed >= anim.start && elapsed < anim.start + anim.duration
      );
      if (currentAnimation) {
        setActiveAnimation(currentAnimation.name || currentAnimation.id);
      } else {
        setActiveAnimation('Breathing Idle');
      }

      // Update caption
      const currentCaptionObj = currentPage.captions.find(
        caption => elapsed >= caption.timestamp && elapsed < caption.timestamp + caption.duration
      );
      setCurrentCaption(currentCaptionObj?.text || '');

      // Play audio for captions
      currentPage.captions.forEach((caption, index) => {
        const captionStart = caption.timestamp;
        const captionEnd = caption.timestamp + caption.duration;
        
        if (elapsed >= captionStart && elapsed < captionEnd) {
          if (!playedCaptionsRef.current.has(index)) {
            playedCaptionsRef.current.add(index);
            
            const audioData = audioQueueRef.current.get(index);
            if (audioData) {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              
              const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
              audioRef.current = audio;
              setCurrentAudioElement(audio);
              
              audio.play().catch(err => {
                console.error('Error playing audio:', err);
              });
            }
          }
        }
      });

      // Check if page is complete and move to next
      if (elapsed >= currentPage.totalDuration) {
        const nextImageIndex = currentImageIndex + 1;
        const nextPageNumber = nextImageIndex + 1;
        
        if (nextImageIndex < (documentData?.images?.length || 0)) {
          // Pause playback and show transition
          setIsPlaying(false);
          setIsPageTransitioning(true);
          setActiveAnimation('Breathing Idle');
          
          // Cancel current animation frame
          if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
          
          // Generate content for next page
          const generateAndLoadNextPage = async () => {
            try {
              setIsLoadingAudio(true);
              setAudioProgress({ loaded: 0, total: 1 });
              
              // Check if we already have this page in lessonData
              let nextPage = lessonData?.pages.find(p => p.pageNumber === nextPageNumber);
              
              if (!nextPage && documentData?.images) {
                // Generate lesson content for next page
                const response = await lessonGeneratorApi.generatePage({
                  pageNumber: nextPageNumber,
                  lessonTitle: documentData.fileName.replace(/\.[^/.]+$/, ''),
                  imageUrl: documentData.images[nextImageIndex],
                  additionalContext: 'Create engaging educational content for this page'
                });
                
                if (response.success && response.data) {
                  nextPage = response.data;
                  // Add to lesson data
                  setLessonData(prev => prev ? {
                    ...prev,
                    pages: [...prev.pages, response.data]
                  } : null);
                }
              }
              
              if (nextPage) {
                // Load audio for next page
                audioLoadedCountRef.current = 0;
                expectedAudioCountRef.current = nextPage.captions.length;
                setAudioProgress({ loaded: 0, total: nextPage.captions.length });
                
                const audioPromises = nextPage.captions.map((caption, index) => {
                  return new Promise<void>((resolve) => {
                    socketService.requestTextToSpeech(
                      caption.text,
                      (data) => {
                        audioQueueRef.current.set(index, data.audio);
                        audioLoadedCountRef.current++;
                        setAudioProgress({ 
                          loaded: audioLoadedCountRef.current, 
                          total: expectedAudioCountRef.current 
                        });
                        resolve();
                      },
                      (error) => {
                        console.error('Error loading audio:', error);
                        audioLoadedCountRef.current++;
                        setAudioProgress({ 
                          loaded: audioLoadedCountRef.current, 
                          total: expectedAudioCountRef.current 
                        });
                        resolve();
                      }
                    );
                  });
                });
                
                // Wait for audio and then transition
                await Promise.all(audioPromises);
                setIsLoadingAudio(false);
                
                // Wait a bit for transition animation
                setTimeout(() => {
                  // Move to next page
                  setCurrentImageIndex(nextImageIndex);
                  setCurrentTime(0);
                  pauseTimeRef.current = 0;
                  startTimeRef.current = null;
                  playedCaptionsRef.current.clear();
                  
                  // End transition and resume playback
                  setTimeout(() => {
                    setIsPageTransitioning(false);
                    setIsPlaying(true);
                  }, 500);
                }, 300);
              }
            } catch (error) {
              console.error('Error generating next page:', error);
              setIsLoadingAudio(false);
              setIsPageTransitioning(false);
              setIsPlaying(false);
              setGenerationError('Failed to generate next page content');
            }
          };
          
          generateAndLoadNextPage();
        } else {
          // Lecture complete
          setIsPlaying(false);
          setActiveAnimation('Breathing Idle');
          startTimeRef.current = null;
          pauseTimeRef.current = 0;
        }
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, lectureMode, currentImageIndex, lessonData]);

  // Handle pause/stop
  useEffect(() => {
    if (!isPlaying && startTimeRef.current !== null) {
      pauseTimeRef.current = currentTime;
      setActiveAnimation('Breathing Idle');
      
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setCurrentAudioElement(null);
      }
      startTimeRef.current = null;
    }
  }, [isPlaying, currentTime]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0B09]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#bf3a0d] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#ffffff] text-lg">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0B09]">
        <div className="text-center max-w-md">
          <p className="text-[#bf3a0d] text-xl mb-4">{error || 'Document not found'}</p>
          <Link href="/studybynotes">
            <button className="px-6 py-3 bg-[#bf3a0d] text-[#ffffff] rounded-lg hover:bg-[#bf3a0d]/90">
              Upload New Document
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0A0B09] overflow-hidden">
      {/* Header */}
      <header className="relative z-20 bg-[#0A0B09]/95 border-b border-[#bf3a0d]/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-bold text-[#ffffff]">
              Mindly
            </Link>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/studybynotes">
              <button className="px-4 py-2 text-[#ffffff]/70 hover:text-[#ffffff] transition-colors">
                Upload New Document
              </button>
            </Link>
            
            {/* Lecture Mode Toggle */}
            {documentData?.images && documentData.images.length > 0 && (
              <button
                onClick={() => {
                  if (lectureMode) {
                    handleStopLecture();
                  } else {
                    handleStartLecture();
                  }
                }}
                disabled={isGeneratingLesson}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  lectureMode
                    ? 'bg-[#bf3a0d] text-[#ffffff]'
                    : 'bg-[#141712] text-[#ffffff]/70 hover:text-[#ffffff] border border-[#bf3a0d]/30'
                }`}
              >
                {isGeneratingLesson ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : lectureMode ? 'Exit Lecture Mode' : 'Start Lecture'}
              </button>
            )}
            
            {/* View Mode Toggle */}
            {!lectureMode && (documentData?.pageImages || documentData?.images) && (documentData.pageImages?.length || documentData.images?.length || 0) > 1 && (
              <div className="flex items-center gap-2 border-l border-[#bf3a0d]/30 pl-4">
                <span className="text-[#ffffff]/70 text-sm">View:</span>
                <button
                  onClick={() => setViewMode('images')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'images'
                      ? 'bg-[#bf3a0d] text-[#ffffff]'
                      : 'bg-[#141712] text-[#ffffff]/70 hover:text-[#ffffff]'
                  }`}
                >
                  Page-by-Page
                </button>
                <button
                  onClick={() => setViewMode('browser')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'browser'
                      ? 'bg-[#bf3a0d] text-[#ffffff]'
                      : 'bg-[#141712] text-[#ffffff]/70 hover:text-[#ffffff]'
                  }`}
                >
                  PDF Viewer
                </button>
              </div>
            )}
            
            {user ? (
              <Link href="/dashboard">
                <button className="px-6 py-2 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors">
                  Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="px-6 py-2 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors">
                  Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side - 3D Character */}
        <div 
          className="relative bg-[#0A0B09] flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="absolute inset-0">
            <Canvas
              shadows
              camera={{ position: [0, 0, 8], fov: 42 }}
              style={{ background: '#0A0B09' }}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <directionalLight
                  position={[5, 10, 5]}
                  intensity={1}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                />
                <Avatar
                  position={[0, -1.75, 5]}
                  scale={2}
                  animation={activeAnimation}
                  animations={animationClips}
                  script=""
                  lipsync={[]}
                  audioElement={currentAudioElement}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Lecture Controls and Caption */}
          {lectureMode && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0B09] to-transparent p-6">
              {/* Generation Error */}
              {generationError && (
                <div className="mb-4 bg-red-900/90 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
                  <p className="text-white text-center">{generationError}</p>
                </div>
              )}
              
              {/* Loading Audio Indicator */}
              {isLoadingAudio && (
                <div className="mb-4 bg-[#141712]/90 backdrop-blur-sm border border-[#bf3a0d]/30 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#bf3a0d] border-t-transparent"></div>
                    <p className="text-[#ffffff] text-center">
                      Loading audio... ({audioProgress.loaded}/{audioProgress.total})
                    </p>
                  </div>
                </div>
              )}
              
              {/* Caption Display */}
              {!isLoadingAudio && currentCaption && (
                <div className="mb-4 bg-[#141712]/90 backdrop-blur-sm border border-[#bf3a0d]/30 rounded-lg p-4">
                  <p className="text-[#ffffff] text-center text-lg leading-relaxed">
                    {currentCaption}
                  </p>
                </div>
              )}

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-3">
                {!isPlaying ? (
                  <button
                    onClick={handleResumeLecture}
                    disabled={isLoadingAudio || isPageTransitioning}
                    className="px-6 py-3 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Play
                  </button>
                ) : (
                  <button
                    onClick={handlePauseLecture}
                    disabled={isLoadingAudio || isPageTransitioning}
                    className="px-6 py-3 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                    </svg>
                    Pause
                  </button>
                )}
                
                <button
                  onClick={handleStopLecture}
                  disabled={isLoadingAudio}
                  className="px-6 py-3 bg-[#141712] text-[#ffffff] font-semibold rounded-lg hover:bg-[#141712]/80 border border-[#bf3a0d]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stop
                </button>
              </div>

              {/* Progress Info */}
              <div className="mt-3 text-center">
                <p className="text-[#ffffff]/70 text-sm">
                  Lesson Page {getCurrentPage()?.pageNumber || 1} of {lessonData?.totalPages || 1} • {currentTime.toFixed(1)}s / {getCurrentPage()?.totalDuration.toFixed(1) || '0.0'}s
                </p>
              </div>
            </div>
          )}

          {/* Ask Question Button - Only show when not in lecture mode */}
          {!lectureMode && (
            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-center">
              <button
                className="max-w-[400px] w-full py-4 px-6 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors flex items-center justify-center gap-3"
                onClick={() => {}}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Ask a Question
              </button>
            </div>
          )}
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 bg-[#bf3a0d]/30 hover:bg-[#bf3a0d] cursor-col-resize relative group transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
            <div className="w-1 h-16 bg-[#bf3a0d] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Right Side - Document Viewer */}
        <div 
          className="relative bg-[#141712] flex flex-col"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Document Display */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {viewMode === 'browser' && (documentData.cloudinaryUrl || documentData.fileUrl) && (documentData.fileType === 'pdf' || documentData.fileType === 'pptx') ? (
              <div className="flex-1 w-full">
                <iframe
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/proxy/pdf?url=${encodeURIComponent(documentData.cloudinaryUrl || documentData.fileUrl || '')}`}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                />
              </div>
            ) : viewMode === 'browser' && (documentData.pageImages || documentData.images) && (documentData.pageImages?.length || documentData.images?.length || 0) > 0 ? (
              <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {(documentData.pageImages || documentData.images || []).map((imageUrl, index) => (
                    <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`Page ${index + 1}`}
                        className="w-full h-auto"
                      />
                      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                        Page {index + 1} of {(documentData.pageImages || documentData.images || []).length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : documentData.images && documentData.images.length > 0 ? (
              <div className={`flex-1 flex justify-center items-start p-4 overflow-y-auto overflow-x-hidden bg-gray-100 transition-opacity duration-500 ${isPageTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <img
                  src={documentData.images[currentImageIndex]}
                  alt={`Page ${currentImageIndex + 1}`}
                  className="object-contain transition-opacity duration-300"
                  style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
                />
              </div>
            ) : null}
          </div>

          {/* Document Info & Navigation */}
          <div className="border-t border-[#bf3a0d]/30 p-4 bg-[#0A0B09]/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ffffff] font-medium">{documentData.fileName}</p>
                {lectureMode && getCurrentPage() && (
                  <p className="text-[#bf3a0d] text-sm mt-1">
                    {getCurrentPage()?.title}
                  </p>
                )}
                <p className="text-[#ffffff]/50 text-sm">
                  {documentData.fileType?.toUpperCase()} • {(documentData.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              {/* Navigation Controls - Only show in image view mode and not in lecture mode */}
              {viewMode === 'images' && !lectureMode && documentData.images && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePrevImage}
                    disabled={currentImageIndex === 0}
                    className="p-2 bg-[#bf3a0d] text-[#ffffff] rounded-lg hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentImageIndex + 1}
                      onChange={(e) => {
                        const page = parseInt(e.target.value) - 1;
                        if (page >= 0 && page < documentData.images!.length) {
                          setCurrentImageIndex(page);
                        }
                      }}
                      className="w-14 px-2 py-1 bg-[#141712] text-[#ffffff] text-center rounded-lg border border-[#bf3a0d]/30 focus:border-[#bf3a0d] outline-none text-sm"
                      min={1}
                      max={documentData.images.length}
                    />
                    <span className="text-[#ffffff] text-sm">/ {documentData.images.length}</span>
                  </div>
                  
                  <button
                    onClick={handleNextImage}
                    disabled={currentImageIndex === documentData.images.length - 1}
                    className="p-2 bg-[#bf3a0d] text-[#ffffff] rounded-lg hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewPage;
