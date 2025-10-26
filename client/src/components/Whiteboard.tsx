'use client';

import React, { useRef, useEffect, useState } from 'react';
import { LessonResponse, DrawingInstruction, CaptionSegment, SAMPLE_LESSON } from '@/types/lesson';
import socketService from '@/lib/socketService';

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
  resetAudioKey: number; // Key that changes to trigger audio reset
  onAudioFetchProgress?: (fetched: number, total: number, loading: boolean) => void;
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

const Whiteboard: React.FC<WhiteboardProps> = ({ isPlaying, onStart, onStop, onReset, onClear, currentTime, onTimeUpdate, lesson, resetAudioKey, onAudioFetchProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseTimeRef = useRef<number>(0); // Track time when paused
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedCaptionsRef = useRef<Set<number>>(new Set()); // Track which captions have had audio played
  const audioQueueRef = useRef<Map<number, string>>(new Map()); // Store audio data keyed by caption index
  
  // Canvas dimensions - base size that lessons are designed for
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;
  const [canvasWidth, setCanvasWidth] = useState(BASE_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(BASE_HEIGHT);
  const [scale, setScale] = useState(1);

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

  // Initialize socket connection on mount
  useEffect(() => {
    socketService.connect();

    return () => {
      // Clean up socket listeners on unmount
      socketService.removeAllListeners('audio-response');
      socketService.removeAllListeners('tts-error');
    };
  }, []);

  // Pre-fetch audio for all captions when lesson loads
  useEffect(() => {
    if (!lesson || !lesson.captions) return;

    // Clear previous audio queue
    audioQueueRef.current.clear();
    playedCaptionsRef.current.clear();

    const total = lesson.captions.length;
    let fetched = 0;
    // Notify parent that prefetch is starting
    if (typeof onAudioFetchProgress === 'function') {
      onAudioFetchProgress(fetched, total, true);
    }

    // Request audio for each caption with a small delay to prevent race conditions
    lesson.captions.forEach((caption, index) => {
      setTimeout(() => {
        socketService.requestTextToSpeech(
          caption.text,
          (audioData) => {
            // Verify that the audio response matches the caption text
            if (caption.text === audioData.text) {
              // Store audio in queue with the caption text as verification
              audioQueueRef.current.set(index, audioData.audio);
              fetched = audioQueueRef.current.size;
              // Report progress to parent
              if (typeof onAudioFetchProgress === 'function') {
                onAudioFetchProgress(fetched, total, fetched < total);
              }
              console.log(`✓ Audio cached for caption ${index}: "${caption.text.substring(0, 50)}..."`);
              console.log(`   Audio data length: ${audioData.audio.length} characters`);
            } else {
              console.error(`✗ Caption text mismatch for caption ${index}!`);
              console.error(`   Expected: "${caption.text.substring(0, 50)}..."`);
              console.error(`   Received: "${audioData.text.substring(0, 50)}..."`);
            }
          },
          (error) => {
            console.error(`✗ Failed to get audio for caption ${index}:`, error.message);
            // Even on error, update progress (we attempted)
            if (typeof onAudioFetchProgress === 'function') {
              // fetched remains whatever successfully fetched so far
              onAudioFetchProgress(audioQueueRef.current.size, total, audioQueueRef.current.size < total);
            }
          }
        );
      }, index * 100); // Stagger requests by 100ms each
    });
  }, [lesson]);

  // Store pause time when pausing
  useEffect(() => {
    if (!isPlaying && startTimeRef.current !== null) {
      pauseTimeRef.current = currentTime;
    }
  }, [isPlaying, currentTime]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !lesson) {
      return;
    }
    
    // When resuming (or starting), calculate the correct start time ONCE
    // by subtracting the pause time from the current timestamp
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now() - (pauseTimeRef.current * 1000);
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) return;
      
      const elapsed = (timestamp - startTimeRef.current) / 1000; // Convert to seconds
      onTimeUpdate(elapsed);

      // Check if lesson is complete
      if (elapsed >= lesson.totalDuration) {
        onStop();
        return;
      }

      // Update drawings with animation progress
      const newElements: DrawingElement[] = [];
      lesson.drawings.forEach((instruction) => {
        if (elapsed >= instruction.timestamp) {
          const timeSinceStart = elapsed - instruction.timestamp;
          const animDuration = instruction.duration || 0.5; // Default 0.5s animation
          
          // Calculate animation progress (0 to 1)
          let progress = Math.min(timeSinceStart / animDuration, 1);
          
          // Add easing for smoother animation (ease-out)
          progress = 1 - Math.pow(1 - progress, 3);
          
          newElements.push({
            ...(instruction as DrawingElement),
            animationProgress: progress
          });
        }
      });
      setElements(newElements);

      // Update captions and play audio
      let activeCaption = '';
      let activeCaptionIndex = -1;
      
      lesson.captions.forEach((caption, index) => {
        const captionStart = caption.timestamp;
        const captionEnd = caption.timestamp + caption.duration;
        
        if (elapsed >= captionStart && elapsed < captionEnd) {
          activeCaption = caption.text;
          activeCaptionIndex = index;
          
          // Play audio if we haven't played it yet for this caption
          // Use a small window to detect if we just entered this caption's timeframe
          const justEntered = elapsed >= captionStart && elapsed < captionStart + 0.1;
          
          if (justEntered && !playedCaptionsRef.current.has(index)) {
            playedCaptionsRef.current.add(index);
            
            // Check if audio is available in queue
            const audioBase64 = audioQueueRef.current.get(index);
            
            if (audioBase64) {
              console.log(`🔊 Playing audio for caption ${index}: "${caption.text.substring(0, 50)}..."`);
              console.log(`   Audio queue size: ${audioQueueRef.current.size}, Using audio for index: ${index}`);
              console.log(`   Audio data length: ${audioBase64.length} characters`);
              
              // Stop any currently playing audio
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
              }
              
              // Play the audio
              try {
                // Convert base64 to blob
                const byteCharacters = atob(audioBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/wav' });

                // Create audio URL and play
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                
                audio.play().catch((error) => {
                  console.error('Error playing audio:', error);
                });

                // Clean up URL after audio ends
                audio.onended = () => {
                  URL.revokeObjectURL(audioUrl);
                  if (audioRef.current === audio) {
                    audioRef.current = null;
                  }
                };
              } catch (error) {
                console.error('Error in audio playback:', error);
              }
            } else {
              console.warn(`⚠ Audio not yet available for caption ${index}, requesting now...`);
              console.warn(`   Caption text: "${caption.text.substring(0, 50)}..."`);
              console.warn(`   Current queue size: ${audioQueueRef.current.size}`);
              // Request audio again if it's not in the queue
              socketService.requestTextToSpeech(
                caption.text,
                (audioData) => {
                  // Verify that the audio response matches the caption text
                  if (caption.text === audioData.text) {
                    audioQueueRef.current.set(index, audioData.audio);
                    console.log(`✓ Audio fetched on-demand for caption ${index}: "${caption.text.substring(0, 50)}..."`);
                    console.log(`   Audio data length: ${audioData.audio.length} characters`);
                    
                    // If we're still on this caption, play the audio immediately
                    if (activeCaption === caption.text && !audioRef.current) {
                      try {
                        const byteCharacters = atob(audioData.audio);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(blob);
                        const audio = new Audio(audioUrl);
                        audioRef.current = audio;
                        audio.play().catch((error) => {
                          console.error('Error playing on-demand audio:', error);
                        });
                        audio.onended = () => {
                          URL.revokeObjectURL(audioUrl);
                          if (audioRef.current === audio) {
                            audioRef.current = null;
                          }
                        };
                      } catch (error) {
                        console.error('Error in on-demand audio playback:', error);
                      }
                    }
                  } else {
                    console.error(`✗ Caption text mismatch for on-demand caption ${index}!`);
                    console.error(`   Expected: "${caption.text.substring(0, 50)}..."`);
                    console.error(`   Received: "${audioData.text.substring(0, 50)}..."`);
                  }
                },
                (error) => {
                  console.error(`✗ Failed to get audio for caption ${index}:`, error.message);
                }
              );
            }
          }
        }
      });
      
      setCurrentCaption(activeCaption);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, lesson, onStop, onTimeUpdate]);
  
  // Handle pause/stop behavior
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Reset startTimeRef so it recalculates on resume
      startTimeRef.current = null;
    }
  }, [isPlaying]);

  // Reset played captions when resetAudioKey changes (triggered by Reset button in parent)
  useEffect(() => {
    playedCaptionsRef.current.clear();
    console.log('🔄 Reset played captions tracker');
  }, [resetAudioKey]);
  
  // Clear elements when lesson changes
  useEffect(() => {
    setElements([]);
    setCurrentCaption('');
    startTimeRef.current = null;
    pauseTimeRef.current = 0;
    playedCaptionsRef.current.clear();
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Inform parent that audio fetching is reset/complete for this lesson change
    if (typeof onAudioFetchProgress === 'function') {
      const total = lesson && lesson.captions ? lesson.captions.length : 0;
      onAudioFetchProgress(audioQueueRef.current.size, total, false);
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
