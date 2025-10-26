// Types for AI Tutor Lesson Response

export interface Point {
  x: number;
  y: number;
}

export interface DrawingInstruction {
  timestamp: number; // Time in seconds when this should be drawn
  type: 
    | 'line'
    | 'curve'
    | 'arrow'
    | 'circle'
    | 'rectangle'
    | 'text'
    | 'polygon'
    | 'highlighter'
    | 'axis'
    | 'graph'
    | 'angle'
    | 'dashed-line';
  
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
  opacity?: number;
  fill?: boolean;
  degrees?: number;
  plotFunction?: string;
  xRange?: [number, number];
  yRange?: [number, number];
  dashPattern?: number[];
  duration?: number; // How long the drawing animation should take
}

export interface CaptionSegment {
  timestamp: number; // Time in seconds when this caption should appear
  text: string;
  duration: number; // How long to display this caption
  position?: 'bottom' | 'top' | 'middle'; // Where to display the caption
}

export interface AudioSegment {
  timestamp: number; // Time in seconds when this audio should play
  text: string; // The text being spoken
  audioUrl?: string; // URL to the generated TTS audio file
  duration: number; // Duration of the audio in seconds
}

interface AvatarAnimation {
  // id should match one of the known animations (e.g., "talking", "breathing-idle")
  id: string;
  // human-friendly name (optional)
  name: string;
  // time in seconds when the animation should start
  start: number;
  // duration in seconds for this animation (0 for infinite/idle)
  duration: number;
  // whether the animation should loop
  loop?: boolean;
}

export interface LessonResponse {
  pageId?: string;
  pageTitle?: string;
  topic: string;
  totalDuration: number; // Total lesson duration in seconds
  drawings: DrawingInstruction[];
  captions: CaptionSegment[];
  audio?: AudioSegment[];
  animations?: AvatarAnimation[];
}


