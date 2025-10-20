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

export interface LessonResponse {
  pageId?: string;
  pageTitle?: string;
  topic: string;
  totalDuration: number; // Total lesson duration in seconds
  drawings: DrawingInstruction[];
  captions: CaptionSegment[];
  audio?: AudioSegment[];
}

// Sample lesson response for "Pythagorean Theorem"
export const SAMPLE_LESSON: LessonResponse = {
  topic: "Pythagorean Theorem",
  totalDuration: 45, // 45 seconds lesson
  
  drawings: [
    // 0-2s: Draw title
    {
      timestamp: 0,
      type: 'text',
      start: { x: 250, y: 50 },
      text: 'Pythagorean Theorem',
      fontSize: 28,
      color: '#2563eb',
      lineWidth: 2,
      duration: 0.5
    },
    
    // 2-4s: Write the formula
    {
      timestamp: 2,
      type: 'text',
      start: { x: 300, y: 100 },
      text: 'a² + b² = c²',
      fontSize: 24,
      color: '#dc2626',
      lineWidth: 2,
      duration: 0.8
    },
    
    // 4-5s: Highlight the formula
    {
      timestamp: 4,
      type: 'highlighter',
      start: { x: 295, y: 75 },
      width: 150,
      height: 35,
      color: '#fbbf24',
      opacity: 0.3,
      lineWidth: 0,
      duration: 0.3
    },
    
    // 6-8s: Draw right triangle - vertical line (side a)
    {
      timestamp: 6,
      type: 'line',
      points: [
        { x: 150, y: 400 },
        { x: 150, y: 250 },
      ],
      color: '#059669',
      lineWidth: 4,
      duration: 0.8
    },
    
    // 8-10s: Draw horizontal line (side b)
    {
      timestamp: 8,
      type: 'line',
      points: [
        { x: 150, y: 400 },
        { x: 350, y: 400 },
      ],
      color: '#059669',
      lineWidth: 4,
      duration: 0.8
    },
    
    // 10-12s: Draw hypotenuse (side c)
    {
      timestamp: 10,
      type: 'line',
      points: [
        { x: 150, y: 250 },
        { x: 350, y: 400 },
      ],
      color: '#dc2626',
      lineWidth: 4,
      duration: 0.8
    },
    
    // 12-13s: Mark right angle
    {
      timestamp: 12,
      type: 'rectangle',
      start: { x: 150, y: 380 },
      width: 20,
      height: 20,
      color: '#1f2937',
      lineWidth: 2,
      duration: 0.3
    },
    
    // 14-16s: Label sides
    {
      timestamp: 14,
      type: 'text',
      start: { x: 120, y: 320 },
      text: 'a',
      fontSize: 20,
      color: '#059669',
      lineWidth: 2,
      duration: 0.3
    },
    {
      timestamp: 14.5,
      type: 'text',
      start: { x: 240, y: 430 },
      text: 'b',
      fontSize: 20,
      color: '#059669',
      lineWidth: 2,
      duration: 0.3
    },
    {
      timestamp: 15,
      type: 'text',
      start: { x: 260, y: 310 },
      text: 'c',
      fontSize: 20,
      color: '#dc2626',
      lineWidth: 2,
      duration: 0.3
    },
    
    // 18-20s: Draw example box
    {
      timestamp: 18,
      type: 'rectangle',
      start: { x: 450, y: 180 },
      width: 280,
      height: 180,
      color: '#6366f1',
      lineWidth: 2,
      duration: 0.5
    },
    
    // 20-22s: Write example title
    {
      timestamp: 20,
      type: 'text',
      start: { x: 470, y: 210 },
      text: 'Example:',
      fontSize: 22,
      color: '#2563eb',
      lineWidth: 2,
      duration: 0.3
    },
    
    // 22-24s: Example values
    {
      timestamp: 22,
      type: 'text',
      start: { x: 470, y: 245 },
      text: 'a = 3, b = 4',
      fontSize: 18,
      color: '#1f2937',
      lineWidth: 1.5,
      duration: 0.5
    },
    
    // 25-27s: Calculation step 1
    {
      timestamp: 25,
      type: 'text',
      start: { x: 470, y: 280 },
      text: 'a² + b² = 3² + 4²',
      fontSize: 18,
      color: '#1f2937',
      lineWidth: 1.5,
      duration: 0.5
    },
    
    // 28-30s: Calculation step 2
    {
      timestamp: 28,
      type: 'text',
      start: { x: 470, y: 315 },
      text: '= 9 + 16 = 25',
      fontSize: 18,
      color: '#1f2937',
      lineWidth: 1.5,
      duration: 0.5
    },
    
    // 31-33s: Final answer
    {
      timestamp: 31,
      type: 'text',
      start: { x: 470, y: 350 },
      text: 'c = √25 = 5',
      fontSize: 18,
      color: '#dc2626',
      lineWidth: 2,
      duration: 0.5
    },
    
    // 35-37s: Draw arrow pointing to triangle
    {
      timestamp: 35,
      type: 'arrow',
      start: { x: 430, y: 350 },
      end: { x: 360, y: 350 },
      color: '#7c3aed',
      lineWidth: 3,
      duration: 0.4
    },
    
    // 38-40s: Add emphasis curve under formula
    {
      timestamp: 38,
      type: 'curve',
      points: [
        { x: 295, y: 115 },
        { x: 325, y: 120 },
        { x: 355, y: 120 },
        { x: 385, y: 120 },
        { x: 415, y: 118 },
        { x: 445, y: 115 },
      ],
      color: '#dc2626',
      lineWidth: 2,
      duration: 0.6
    },
  ],
  
  captions: [
    {
      timestamp: 0,
      text: "Let's learn about the Pythagorean Theorem!",
      duration: 3,
      position: 'bottom'
    },
    {
      timestamp: 2,
      text: "The formula is: a² + b² = c²",
      duration: 3,
      position: 'bottom'
    },
    {
      timestamp: 5,
      text: "This applies to right-angled triangles",
      duration: 3,
      position: 'bottom'
    },
    {
      timestamp: 6,
      text: "Here's side 'a' - the vertical side",
      duration: 2.5,
      position: 'bottom'
    },
    {
      timestamp: 8,
      text: "And side 'b' - the horizontal side",
      duration: 2.5,
      position: 'bottom'
    },
    {
      timestamp: 10,
      text: "Side 'c' is the hypotenuse - the longest side",
      duration: 3,
      position: 'bottom'
    },
    {
      timestamp: 14,
      text: "Let me label each side for clarity",
      duration: 2.5,
      position: 'bottom'
    },
    {
      timestamp: 18,
      text: "Now, let's solve an example problem",
      duration: 3,
      position: 'bottom'
    },
    {
      timestamp: 22,
      text: "If a equals 3 and b equals 4...",
      duration: 3,
      position: 'bottom'
    },
    {
      timestamp: 25,
      text: "We square both values: 9 plus 16",
      duration: 3.5,
      position: 'bottom'
    },
    {
      timestamp: 28,
      text: "That gives us 25",
      duration: 3,
      position: 'bottom'
    },
    {
      timestamp: 31,
      text: "Taking the square root, c equals 5!",
      duration: 4,
      position: 'bottom'
    },
    {
      timestamp: 35,
      text: "See how it works with our triangle?",
      duration: 3,
      position: 'bottom'
    },
    {
      timestamp: 38,
      text: "This formula is fundamental in mathematics!",
      duration: 5,
      position: 'bottom'
    }
  ],
  
  audio: [
    {
      timestamp: 0,
      text: "Let's learn about the Pythagorean Theorem!",
      duration: 2.8
    },
    {
      timestamp: 2,
      text: "The formula is: a squared plus b squared equals c squared",
      duration: 3.2
    },
    {
      timestamp: 5,
      text: "This applies to right-angled triangles, where one angle is exactly 90 degrees",
      duration: 4.5
    },
    {
      timestamp: 6,
      text: "Here's side 'a' - the vertical side of our triangle",
      duration: 2.8
    },
    {
      timestamp: 8,
      text: "And side 'b' - the horizontal side",
      duration: 2.5
    },
    {
      timestamp: 10,
      text: "Side 'c' is the hypotenuse - the longest side opposite the right angle",
      duration: 3.5
    },
    {
      timestamp: 14,
      text: "Let me label each side for clarity",
      duration: 2.2
    },
    {
      timestamp: 18,
      text: "Now, let's solve an example problem to see how this works in practice",
      duration: 3.8
    },
    {
      timestamp: 22,
      text: "If a equals 3 and b equals 4, we can find c",
      duration: 3.2
    },
    {
      timestamp: 25,
      text: "We square both values: 3 squared is 9, and 4 squared is 16",
      duration: 4.0
    },
    {
      timestamp: 28,
      text: "Adding them together gives us 25",
      duration: 2.5
    },
    {
      timestamp: 31,
      text: "Taking the square root of 25, we get c equals 5!",
      duration: 3.2
    },
    {
      timestamp: 35,
      text: "See how it works perfectly with our triangle?",
      duration: 2.8
    },
    {
      timestamp: 38,
      text: "This formula is fundamental in mathematics, used in geometry, physics, and engineering!",
      duration: 5.0
    }
  ]
};
