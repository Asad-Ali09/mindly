'use client';

import React, { useRef, useEffect, useState } from 'react';
import { LessonResponse, DrawingInstruction, CaptionSegment, SAMPLE_LESSON } from '@/types/lesson';
import { socketService, audioService } from '@/lib';

interface Point {
  x: number;
  y: number;
}

interface WhiteboardProps {
  isPlaying: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onClear: () => void;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  lesson: LessonResponse | null;
}

interface DrawingElement {
  type: 
    | 'line'           // Straight lines for diagrams
    | 'curve'          // Smooth curves for natural annotations
    | 'arrow'          // Directional pointers
    | 'circle'         // Circles and highlights
    | 'rectangle'      // Boxes and shapes
    | 'text'           // Labels and explanations
    | 'polygon'        // Any multi-sided shape (triangles, pentagons, etc.)
    | 'highlighter'    // Semi-transparent emphasis
    | 'axis'           // Coordinate system
    | 'graph'          // Plot points/functions
    | 'angle'          // Angle markers with arc
    | 'dashed-line';   // Auxiliary/construction lines
  
  points?: Point[];
  start?: Point;
  end?: Point;
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color: string;
  lineWidth: number;
  opacity?: number;       // For highlighter
  fill?: boolean;         // Fill shapes or just stroke
  degrees?: number;       // For angle markers
  plotFunction?: string;  // For graph: function to plot
  xRange?: [number, number]; // For axis/graph
  yRange?: [number, number]; // For axis/graph
  dashPattern?: number[]; // For dashed lines
  animationProgress?: number; // 0 to 1, for animating the drawing
}

const Whiteboard: React.FC<WhiteboardProps> = ({ isPlaying, onStart, onStop, onReset, onClear, currentTime, onTimeUpdate, lesson }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseTimeRef = useRef<number>(0); // Track time when paused
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [audioLoadingStatus, setAudioLoadingStatus] = useState<string>('');
  const audioSegmentIndexRef = useRef<number>(0);
  const waitingForAudioRef = useRef<boolean>(false);
  const audioPlayStartTimeRef = useRef<number | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const hasStartedPlayingRef = useRef<boolean>(false);
  
  // Canvas dimensions - base size that lessons are designed for
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;
  const [canvasWidth, setCanvasWidth] = useState(BASE_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(BASE_HEIGHT);
  const [scale, setScale] = useState(1);

  // Initialize socket connection
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }
    setIsSocketConnected(socketService.isConnected());

    const socket = socketService.getSocket();
    if (socket) {
      const handleConnect = () => setIsSocketConnected(true);
      const handleDisconnect = () => setIsSocketConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  // Prefetch audio when lesson loads
  useEffect(() => {
    if (!lesson || !lesson.captions || !isSocketConnected) return;

    console.log('Prefetching audio for', lesson.captions.length, 'captions');
    setAudioLoadingStatus(`Preparing audio (0/${lesson.captions.length})...`);

    // Extract unique caption texts
    const captionTexts = lesson.captions.map(c => c.text);
    
    // Prefetch all captions
    audioService.prefetchAudios(captionTexts);

    // Monitor prefetch progress
    const checkProgress = setInterval(() => {
      const stats = audioService.getCacheStats();
      if (stats.ready + stats.errors >= captionTexts.length) {
        setAudioLoadingStatus('');
        clearInterval(checkProgress);
        console.log('Audio prefetch complete:', stats);
      } else {
        setAudioLoadingStatus(`Preparing audio (${stats.ready}/${captionTexts.length})...`);
      }
    }, 500);

    return () => {
      clearInterval(checkProgress);
    };
  }, [lesson, isSocketConnected]);

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Account for padding and borders
      // Outer container: p-2 sm:p-4 = 8px mobile, 16px desktop
      // Inner div: p-2 sm:p-4 = 8px mobile, 16px desktop  
      // Border: 4px on each side
      // Canvas border: 2px on each side
      const isMobile = window.innerWidth < 640;
      const outerPadding = isMobile ? 8 : 16;
      const innerPadding = isMobile ? 8 : 16;
      const borderWidth = 4 + 2; // outer border + canvas border
      
      const totalOffset = (outerPadding + innerPadding + borderWidth) * 2;
      const availableWidth = Math.max(containerWidth - totalOffset, 100);
      const availableHeight = Math.max(containerHeight - totalOffset, 100);

      // Calculate scale to fit container while maintaining aspect ratio
      const scaleX = availableWidth / BASE_WIDTH;
      const scaleY = availableHeight / BASE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);

      const newWidth = Math.floor(BASE_WIDTH * newScale);
      const newHeight = Math.floor(BASE_HEIGHT * newScale);

      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
      setScale(newScale);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Use timeout to ensure DOM is ready
    const timeoutId = setTimeout(updateCanvasSize, 100);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Store pause time when pausing
  useEffect(() => {
    if (!isPlaying && startTimeRef.current !== null) {
      pauseTimeRef.current = currentTime;
    }
  }, [isPlaying, currentTime]);

  // Animation loop - now driven by audio playback
  useEffect(() => {
    if (!isPlaying || !lesson) {
      return;
    }
    
    // Clear stopping flag at the start of playback
    isStoppingRef.current = false;
    
    // When resuming (or starting), calculate the correct start time ONCE
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now() - (pauseTimeRef.current * 1000);
      audioSegmentIndexRef.current = 0;
      
      // Find which audio segment we should be at based on pauseTimeRef
      if (lesson.captions && pauseTimeRef.current > 0) {
        for (let i = 0; i < lesson.captions.length; i++) {
          const caption = lesson.captions[i];
          if (pauseTimeRef.current >= caption.timestamp && 
              pauseTimeRef.current < caption.timestamp + caption.duration) {
            audioSegmentIndexRef.current = i;
            break;
          } else if (pauseTimeRef.current >= caption.timestamp + caption.duration) {
            audioSegmentIndexRef.current = i + 1;
          }
        }
      }
    }

    const playNextAudio = async () => {
      // Don't play if we're stopping
      if (isStoppingRef.current) {
        return;
      }
      
      if (!lesson.captions || audioSegmentIndexRef.current >= lesson.captions.length) {
        return;
      }

      const currentCaption = lesson.captions[audioSegmentIndexRef.current];
      const captionText = currentCaption.text;

      // Show caption immediately
      setCurrentCaption(captionText);

      // Check if audio is ready
      if (!audioService.isAudioReady(captionText)) {
        waitingForAudioRef.current = true;
        await audioService.requestAudio(captionText);
        waitingForAudioRef.current = false;
        
        // Check again if we're still playing after async operation
        if (isStoppingRef.current) {
          return;
        }
      }

      // Play the audio
      const audio = audioService.playAudio(captionText);
      if (audio) {
        currentAudioRef.current = audio;
        audioPlayStartTimeRef.current = performance.now();

        // When audio ends, move to next segment
        audio.onended = () => {
          // Check if we're still playing
          if (isStoppingRef.current) {
            return;
          }
          
          audioSegmentIndexRef.current++;
          setCurrentCaption('');
          
          // Play next audio if available
          if (audioSegmentIndexRef.current < (lesson.captions?.length || 0)) {
            playNextAudio();
          }
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          audioSegmentIndexRef.current++;
          setCurrentCaption('');
          
          // Try next segment if still playing
          if (!isStoppingRef.current && audioSegmentIndexRef.current < (lesson.captions?.length || 0)) {
            playNextAudio();
          }
        };
      } else {
        // Audio not available, use duration from caption and simulate playback
        const captionDuration = currentCaption.duration * 1000; // Convert to ms
        
        // Simulate audio playback with timeout
        setTimeout(() => {
          if (isStoppingRef.current) {
            return;
          }
          
          audioSegmentIndexRef.current++;
          setCurrentCaption('');
          
          // Play next audio if available
          if (audioSegmentIndexRef.current < (lesson.captions?.length || 0)) {
            playNextAudio();
          }
        }, captionDuration);
      }
    };

    // Start playing audio segments only once per play session
    if (startTimeRef.current !== null && !hasStartedPlayingRef.current) {
      hasStartedPlayingRef.current = true;
      playNextAudio();
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) return;
      
      // Calculate elapsed time based on audio playback
      let elapsed: number;
      
      if (waitingForAudioRef.current) {
        // If waiting for audio, don't advance time
        elapsed = pauseTimeRef.current;
      } else if (currentAudioRef.current && !currentAudioRef.current.paused) {
        // Use audio currentTime for precise synchronization
        const currentSegmentIndex = audioSegmentIndexRef.current;
        if (lesson.captions && currentSegmentIndex < lesson.captions.length) {
          const currentCaption = lesson.captions[currentSegmentIndex];
          elapsed = currentCaption.timestamp + (currentAudioRef.current.currentTime || 0);
        } else {
          elapsed = (timestamp - startTimeRef.current) / 1000;
        }
      } else {
        // Fallback to timestamp-based calculation
        // This handles cases where audio isn't available
        elapsed = (timestamp - startTimeRef.current) / 1000;
      }
      
      onTimeUpdate(elapsed);

      // Check if lesson is complete
      if (elapsed >= lesson.totalDuration) {
        onStop();
        return;
      }

      // Update drawings with animation progress based on timing
      const newElements: DrawingElement[] = [];
      lesson.drawings.forEach((instruction) => {
        if (elapsed >= instruction.timestamp) {
          const timeSinceStart = elapsed - instruction.timestamp;
          const animDuration = instruction.duration || 0.5;
          
          let progress = Math.min(timeSinceStart / animDuration, 1);
          progress = 1 - Math.pow(1 - progress, 3);
          
          newElements.push({
            ...(instruction as DrawingElement),
            animationProgress: progress
          });
        }
      });
      setElements(newElements);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Properly stop audio without causing AbortError
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current.onended = null;
          currentAudioRef.current.onerror = null;
          currentAudioRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isPlaying, lesson]); // Removed onStop and onTimeUpdate from dependencies
  
  // Handle pause/stop behavior
  useEffect(() => {
    console.log('Pause/play handler - isPlaying:', isPlaying);
    if (!isPlaying) {
      // Set flag to prevent new audio from playing
      isStoppingRef.current = true;
      hasStartedPlayingRef.current = false;
      console.log('Reset hasStartedPlayingRef to false');
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Properly stop audio to prevent AbortError
      if (currentAudioRef.current) {
        try {
          // Remove event listeners first
          currentAudioRef.current.onended = null;
          currentAudioRef.current.onerror = null;
          // Then pause
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        } catch (e) {
          // Ignore errors during cleanup
          console.debug('Audio cleanup:', e);
        }
      }
      // Reset startTimeRef so it recalculates on resume
      startTimeRef.current = null;
      audioPlayStartTimeRef.current = null;
      waitingForAudioRef.current = false;
    } else {
      // Clear stopping flag when playing starts
      isStoppingRef.current = false;
      console.log('Playing started - isStoppingRef set to false');
    }
  }, [isPlaying]);
  
  // Clear elements when lesson changes
  useEffect(() => {
    setElements([]);
    setCurrentCaption('');
    startTimeRef.current = null;
    pauseTimeRef.current = 0;
    audioSegmentIndexRef.current = 0;
    audioPlayStartTimeRef.current = null;
    waitingForAudioRef.current = false;
    isStoppingRef.current = true;
    hasStartedPlayingRef.current = false;
    
    // Clear audio cache for previous lesson
    audioService.clearCache();
    
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      } catch (e) {
        console.debug('Audio cleanup on lesson change:', e);
      }
    }
  }, [lesson]);
  
  // Handle clear action from parent
  useEffect(() => {
    // This will be triggered by key change in parent
  }, [onClear]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save the context state
    ctx.save();

    // Apply scaling transformation - all drawing coordinates are scaled
    ctx.scale(scale, scale);

    // Draw grid pattern (like a real whiteboard)
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < BASE_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, BASE_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < BASE_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(BASE_WIDTH, y);
      ctx.stroke();
    }

    // Draw all elements
    elements.forEach((element) => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const progress = element.animationProgress !== undefined ? element.animationProgress : 1;

      switch (element.type) {
        case 'line':
          if (element.points && element.points.length > 1) {
            // Animate line drawing
            const totalPoints = element.points.length;
            
            if (totalPoints === 2) {
              // Simple 2-point line - interpolate directly
              const startPoint = element.points[0];
              const endPoint = element.points[1];
              
              const currentX = startPoint.x + (endPoint.x - startPoint.x) * progress;
              const currentY = startPoint.y + (endPoint.y - startPoint.y) * progress;
              
              ctx.beginPath();
              ctx.moveTo(startPoint.x, startPoint.y);
              ctx.lineTo(currentX, currentY);
              ctx.stroke();
            } else {
              // Multi-point line - animate through points
              const pointsToShow = Math.max(2, Math.floor(totalPoints * progress));
              
              ctx.beginPath();
              ctx.moveTo(element.points[0].x, element.points[0].y);
              
              for (let i = 1; i < pointsToShow - 1; i++) {
                ctx.lineTo(element.points[i].x, element.points[i].y);
              }
              
              // Interpolate the last segment for smooth animation
              if (pointsToShow < totalPoints) {
                const lastCompleteIdx = pointsToShow - 1;
                const nextIdx = Math.min(pointsToShow, totalPoints - 1);
                const segmentProgress = (totalPoints * progress) - lastCompleteIdx;
                
                const x = element.points[lastCompleteIdx].x + 
                         (element.points[nextIdx].x - element.points[lastCompleteIdx].x) * segmentProgress;
                const y = element.points[lastCompleteIdx].y + 
                         (element.points[nextIdx].y - element.points[lastCompleteIdx].y) * segmentProgress;
                
                ctx.lineTo(x, y);
              } else {
                ctx.lineTo(element.points[totalPoints - 1].x, element.points[totalPoints - 1].y);
              }
              
              ctx.stroke();
            }
          }
          break;

        case 'circle':
          if (element.start && element.radius) {
            // Animate circle drawing (arc growing from 0 to 2π)
            const endAngle = 2 * Math.PI * progress;
            ctx.beginPath();
            ctx.arc(element.start.x, element.start.y, element.radius, 0, endAngle);
            ctx.stroke();
          }
          break;

        case 'rectangle':
          if (element.start && element.width && element.height) {
            // Animate rectangle drawing (trace the outline)
            const perimeter = 2 * (element.width + element.height);
            const drawLength = perimeter * progress;
            
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            
            if (drawLength <= element.width) {
              // Drawing top edge
              ctx.lineTo(element.start.x + drawLength, element.start.y);
            } else if (drawLength <= element.width + element.height) {
              // Drawing right edge
              ctx.lineTo(element.start.x + element.width, element.start.y);
              ctx.lineTo(element.start.x + element.width, element.start.y + (drawLength - element.width));
            } else if (drawLength <= 2 * element.width + element.height) {
              // Drawing bottom edge
              ctx.lineTo(element.start.x + element.width, element.start.y);
              ctx.lineTo(element.start.x + element.width, element.start.y + element.height);
              ctx.lineTo(element.start.x + element.width - (drawLength - element.width - element.height), 
                        element.start.y + element.height);
            } else {
              // Drawing left edge
              ctx.lineTo(element.start.x + element.width, element.start.y);
              ctx.lineTo(element.start.x + element.width, element.start.y + element.height);
              ctx.lineTo(element.start.x, element.start.y + element.height);
              ctx.lineTo(element.start.x, 
                        element.start.y + element.height - (drawLength - 2 * element.width - element.height));
            }
            
            ctx.stroke();
          }
          break;

        case 'text':
          if (element.start && element.text) {
            // Animate text appearing character by character
            const fontSize = element.fontSize || 20;
            const isTitle = element.text.includes('Theorem') || element.text.includes('Example');
            ctx.font = isTitle ? `bold ${fontSize + 4}px Arial` : `${fontSize}px Arial`;
            
            const charsToShow = Math.ceil(element.text.length * progress);
            const visibleText = element.text.substring(0, charsToShow);
            ctx.fillText(visibleText, element.start.x, element.start.y);
          }
          break;

        case 'arrow':
          if (element.start && element.end) {
            const headLength = 15;
            const angle = Math.atan2(element.end.y - element.start.y, element.end.x - element.start.x);
            const lineLength = Math.sqrt(
              Math.pow(element.end.x - element.start.x, 2) + 
              Math.pow(element.end.y - element.start.y, 2)
            );

            // Animate line growing from start to end
            const currentLength = lineLength * Math.min(progress * 1.2, 1); // Line grows faster
            const currentEndX = element.start.x + Math.cos(angle) * currentLength;
            const currentEndY = element.start.y + Math.sin(angle) * currentLength;

            // Draw line
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(currentEndX, currentEndY);
            ctx.stroke();

            // Draw arrowhead only when line is mostly complete
            if (progress > 0.7) {
              const headProgress = (progress - 0.7) / 0.3; // Fade in arrowhead
              ctx.globalAlpha = headProgress;
              
              ctx.beginPath();
              ctx.moveTo(element.end.x, element.end.y);
              ctx.lineTo(
                element.end.x - headLength * Math.cos(angle - Math.PI / 6),
                element.end.y - headLength * Math.sin(angle - Math.PI / 6)
              );
              ctx.moveTo(element.end.x, element.end.y);
              ctx.lineTo(
                element.end.x - headLength * Math.cos(angle + Math.PI / 6),
                element.end.y - headLength * Math.sin(angle + Math.PI / 6)
              );
              ctx.stroke();
              
              ctx.globalAlpha = 1;
            }
          }
          break;

        case 'curve':
          if (element.points && element.points.length > 2) {
            // Animate curve drawing
            const totalCurvePoints = element.points.length;
            const curvePointsToShow = Math.max(2, Math.ceil(totalCurvePoints * progress));
            
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);

            // Use quadratic curves for smooth drawing
            for (let i = 1; i < Math.min(curvePointsToShow, element.points.length - 1); i++) {
              const currentPoint = element.points[i];
              const nextPoint = element.points[i + 1];
              
              // Calculate control point (midpoint between current and next)
              const controlX = (currentPoint.x + nextPoint.x) / 2;
              const controlY = (currentPoint.y + nextPoint.y) / 2;
              
              ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
            }

            // Draw to the last visible point
            if (curvePointsToShow >= totalCurvePoints) {
              const lastPoint = element.points[element.points.length - 1];
              ctx.lineTo(lastPoint.x, lastPoint.y);
            }
            ctx.stroke();
          }
          break;

        case 'polygon':
          if (element.points && element.points.length > 2) {
            // Animate polygon drawing
            const totalPolyPoints = element.points.length;
            const polyPointsToShow = Math.max(2, Math.ceil(totalPolyPoints * progress));
            
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < polyPointsToShow; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y);
            }
            
            // Close path only when fully drawn
            if (progress >= 1) {
              ctx.closePath();
            }
            
            if (element.fill && progress >= 1) {
              const prevAlpha = ctx.globalAlpha;
              ctx.globalAlpha = element.opacity || 1;
              ctx.fill();
              ctx.globalAlpha = prevAlpha;
            }
            ctx.stroke();
          }
          break;

        case 'highlighter':
          if (element.start && element.width && element.height) {
            // Animate highlighter expanding from left to right
            const currentWidth = element.width * progress;
            const prevAlpha = ctx.globalAlpha;
            ctx.globalAlpha = (element.opacity || 0.3) * progress; // Fade in as well
            ctx.fillRect(element.start.x, element.start.y, currentWidth, element.height);
            ctx.globalAlpha = prevAlpha;
          }
          break;

        case 'dashed-line':
          if (element.start && element.end) {
            // Animate dashed line growing from start to end
            const lineLength = Math.sqrt(
              Math.pow(element.end.x - element.start.x, 2) + 
              Math.pow(element.end.y - element.start.y, 2)
            );
            const currentLength = lineLength * progress;
            const angle = Math.atan2(element.end.y - element.start.y, element.end.x - element.start.x);
            const currentEndX = element.start.x + Math.cos(angle) * currentLength;
            const currentEndY = element.start.y + Math.sin(angle) * currentLength;
            
            ctx.setLineDash(element.dashPattern || [5, 5]);
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(currentEndX, currentEndY);
            ctx.stroke();
            ctx.setLineDash([]); // Reset
          }
          break;

        case 'angle':
          if (element.start && element.degrees && element.radius) {
            const angleRad = (element.degrees * Math.PI) / 180;
            const currentAngleRad = angleRad * progress;
            
            // Draw arc (animated)
            ctx.beginPath();
            ctx.arc(element.start.x, element.start.y, element.radius, 0, currentAngleRad);
            ctx.stroke();

            // Draw angle lines
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(element.start.x + element.radius, element.start.y);
            
            if (progress > 0.3) {
              ctx.moveTo(element.start.x, element.start.y);
              ctx.lineTo(
                element.start.x + element.radius * Math.cos(currentAngleRad),
                element.start.y + element.radius * Math.sin(currentAngleRad)
              );
            }
            ctx.stroke();

            // Draw degree label (fade in at end)
            if (progress > 0.7) {
              const labelAlpha = (progress - 0.7) / 0.3;
              const prevAlpha = ctx.globalAlpha;
              ctx.globalAlpha = labelAlpha;
              ctx.font = '14px Arial';
              ctx.fillText(
                `${element.degrees}°`,
                element.start.x + element.radius * 0.5,
                element.start.y - 10
              );
              ctx.globalAlpha = prevAlpha;
            }
          }
          break;

        case 'axis':
          if (element.start && element.width && element.height) {
            const centerX = element.start.x + element.width / 2;
            const centerY = element.start.y + element.height / 2;

            // Animate axes drawing from center outward
            const xProgress = Math.min(progress * 2, 1); // X axis draws first
            const yProgress = Math.max(0, (progress - 0.5) * 2); // Y axis draws second

            // Draw X axis
            const xLength = element.width / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX - xLength * xProgress, centerY);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + xLength * xProgress, centerY);
            ctx.stroke();

            // Draw Y axis
            const yLength = element.height / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX, centerY - yLength * yProgress);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX, centerY + yLength * yProgress);
            ctx.stroke();

            // Draw arrow heads only when fully drawn
            if (progress >= 0.9) {
              const arrowAlpha = (progress - 0.9) / 0.1;
              const prevAlpha = ctx.globalAlpha;
              ctx.globalAlpha = arrowAlpha;
              
              const arrowSize = 8;
              // X-axis arrow
              ctx.beginPath();
              ctx.moveTo(element.start.x + element.width, centerY);
              ctx.lineTo(element.start.x + element.width - arrowSize, centerY - arrowSize / 2);
              ctx.lineTo(element.start.x + element.width - arrowSize, centerY + arrowSize / 2);
              ctx.closePath();
              ctx.fill();

              // Y-axis arrow
              ctx.beginPath();
              ctx.moveTo(centerX, element.start.y);
              ctx.lineTo(centerX - arrowSize / 2, element.start.y + arrowSize);
              ctx.lineTo(centerX + arrowSize / 2, element.start.y + arrowSize);
              ctx.closePath();
              ctx.fill();

              // Labels
              ctx.font = '12px Arial';
              ctx.fillText('x', element.start.x + element.width - 10, centerY + 15);
              ctx.fillText('y', centerX + 10, element.start.y + 10);
              ctx.fillText('0', centerX - 15, centerY + 15);
              
              ctx.globalAlpha = prevAlpha;
            }
          }
          break;
      }
    });

    // Restore the context state (removes scaling)
    ctx.restore();
  }, [elements, scale]);

  return (
    <div className="w-full h-full flex flex-col relative">
      
      {/* Socket Connection Status */}
      {!isSocketConnected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Connecting to audio service...</span>
        </div>
      )}

      {/* Audio Loading Status */}
      {audioLoadingStatus && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">{audioLoadingStatus}</span>
        </div>
      )}
      
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-gray-100 p-2 sm:p-4 overflow-hidden w-full">
        <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-300 p-2 sm:p-4 max-w-full max-h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="border-2 border-gray-200 rounded cursor-crosshair max-w-full max-h-full"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      {/* Caption Display - Absolutely positioned at bottom, centered */}
      {currentCaption && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex justify-center">
          <div className="bg-gray-900/45  text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg backdrop-blur-sm">
            <p className="text-base sm:text-lg font-medium whitespace-nowrap">{currentCaption}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
