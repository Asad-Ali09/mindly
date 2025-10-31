import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config';
import animationsCfg from '../constants/animations.json';

interface MCQOption {
  id: string;
  text: string;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  type: 'single' | 'multiple';
}

interface LessonPage {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string; // e.g., "30 seconds" - shorter durations per page
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

// Whiteboard Content Types
interface Point {
  x: number;
  y: number;
}

interface DrawingInstruction {
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

interface CaptionSegment {
  timestamp: number; // Time in seconds when this caption should appear
  text: string;
  duration: number; // How long to display this caption
  position?: 'bottom' | 'top' | 'middle';
}

interface WhiteboardContent {
  pageId: string;
  pageTitle: string;
  topic: string;
  totalDuration: number; // Total duration in seconds
  drawings: DrawingInstruction[];
  captions: CaptionSegment[];
  animations?: AvatarAnimation[];
}

interface AvatarAnimation {
  // id should match one of the known animations (e.g., "talking", "breathing-idle")
  id: string;
  // human-friendly name (optional)
  name?: string;
  // time in seconds when the animation should start
  start: number;
  // duration in seconds for this animation (0 for infinite/idle)
  duration: number;
  // whether the animation should loop
  loop?: boolean;
}

class AIService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Generates MCQ assessment questions to understand user's knowledge level and learning goals
   * @param topic - The topic or statement provided by the user
   * @returns Array of MCQ questions (3-6 questions)
   */
  async generateAssessmentQuestions(topic: string): Promise<AssessmentQuestion[]> {
    try {
      const prompt = `
Generate 4 to 6 multiple choice questions to assess a student's current knowledge level about "${topic}".

CONTEXT: The learning platform uses a 3D AI teacher that explains concepts on a digital whiteboard using text, diagrams, and canvas drawings. The teaching is interactive - students can interrupt and ask questions anytime.

The questions should help understand:
1. The student's current knowledge level and experience with "${topic}"
2. What specific aspects or subtopics they want to learn
3. Their learning goals and practical use cases
4. The depth of understanding they're seeking

CRITICAL RULES FOR QUESTION DESIGN:
- DO NOT ask about learning styles (videos, images, reading, etc.) - all teaching is whiteboard-based
- DO NOT ask about preferred media formats - only text and drawings are available
- Questions MUST be relevant to understanding their knowledge level and learning goals
- Each question should be INDEPENDENT or logically flow from previous answers
- If questions are dependent (e.g., asking about advanced topics after user indicates beginner level), make options adaptable to all levels
- Focus on WHAT they want to learn, not HOW they want to learn
- Questions should help personalize the content difficulty and focus areas

IMPORTANT: Return ONLY a valid JSON array with the following structure. Do not include any explanatory text, markdown formatting, or code blocks:

[
  {
    "id": "q1",
    "question": "Question text here?",
    "type": "single",
    "options": [
      {"id": "a", "text": "Option A"},
      {"id": "b", "text": "Option B"},
      {"id": "c", "text": "Option C"},
      {"id": "d", "text": "Option D"}
    ]
  }
]

FORMAT RULES:
- Generate 4-6 questions
- type can be "single" (single select) or "multiple" (multiple select)
- Each question should have 4 options
- Use ids: a, b, c, d for options
- For multiple select questions, add "(Select all that apply)" to the question text
- Make questions conversational and relevant to ${topic}

EXAMPLE QUESTION FLOW FOR PYTHON:
1. "What's your current experience level with ${topic}?" (Beginner/Some basics/Intermediate/Advanced)
2. "What's your primary goal for learning ${topic}?" (Career/Personal projects/Academic/Hobby)
3. For beginners: "Which fundamentals are you most interested in?" (Variables & data types/Control flow/Functions/All of these)
   For advanced: "Which advanced topics interest you?" (Async programming/Decorators/Metaclasses/Performance optimization)
4. "What would you like to build or accomplish?" (Web apps/Data analysis/Automation scripts/Just understand concepts)
5. "How deep do you want to go?" (Basic overview/Practical skills/Deep understanding/Expert level)

QUESTIONS TO AVOID:
- ❌ "Which learning style do you prefer?" (videos, images, hands-on, reading)
- ❌ "Do you prefer visual or text-based learning?"
- ❌ "What type of content works best for you?"
- ❌ Any question about media preferences or learning formats

GOOD QUESTIONS:
- ✅ "What's your experience level with ${topic}?"
- ✅ "Which aspects of ${topic} are you most interested in?"
- ✅ "What do you want to accomplish by learning ${topic}?"
- ✅ "Are there specific problems you want to solve?"
- ✅ "How much time can you dedicate to learning?"
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the JSON response
      let questions: AssessmentQuestion[];
      try {
        // Remove markdown code blocks if present
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        questions = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Failed to parse AI response. Using fallback questions.');
      }

      return questions;
    } catch (error) {
      console.error('Error generating assessment questions:', error);
      throw error;
    }
  }

  /**
   * Generates a detailed lesson outline based on user's assessment responses
   * @param topic - The topic to teach
   * @param responses - User's answers to assessment questions
   * @param questions - The original questions (for context)
   * @returns Detailed lesson outline with sections and pages
   */
  async generateLessonOutline(
    topic: string,
    responses: Record<string, string[]>,
    questions: AssessmentQuestion[]
  ): Promise<LessonOutline> {
    try {
      // Create a readable version of responses with question context
      const responsesWithContext = questions.map((q) => {
        const selectedOptionIds = responses[q.id] || [];
        const selectedOptions = q.options
          .filter((opt) => selectedOptionIds.includes(opt.id))
          .map((opt) => opt.text);

        return {
          question: q.question,
          answers: selectedOptions,
        };
      });

      const prompt = `
You are an expert AI tutor creating a personalized lesson plan for a student.

Topic: "${topic}"

Student's Assessment Responses:
${JSON.stringify(responsesWithContext, null, 2)}

Based on these responses, create a comprehensive step-by-step lesson outline that:
1. Matches the student's knowledge level
2. Addresses their learning goals and interests
3. Builds concepts progressively through multiple pages
4. Each page represents one whiteboard screen (previous content is cleared when moving to next page)
5. Pages should be bite-sized, focused, and progressive within each section

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks, no explanations):

{
  "topic": "${topic}",
  "overallObjective": "Clear statement of what the student will learn",
  "knowledgeLevel": "beginner" | "intermediate" | "advanced",
  "totalEstimatedDuration": "e.g., 15-20 minutes",
  "sections": [
    {
      "id": "section1",
      "title": "Section Title",
      "description": "Brief description of what this section covers",
      "pages": [
        {
          "id": "section1_page1",
          "title": "Page Title",
          "description": "Detailed description of this page (2-3 sentences explaining what will be taught on this whiteboard page)",
          "estimatedDuration": "30 seconds"
        }
      ]
    }
  ]
}

Guidelines:
- Create 2-4 sections based on the topic complexity
- Each section MUST have 8-12 pages (this is critical for proper pacing)
- Each page represents ONE whiteboard screen - when moving to the next page, the whiteboard is cleared
- Keep page durations SHORT - typically 20-45 seconds per page (max 1 minute)
- Pages within a section should build progressively on each other
- Break down complex concepts into multiple simple pages rather than one complex page
- Use clear, descriptive titles for each page
- Page descriptions should explain what specific content will be shown on that whiteboard screen
- Progress from fundamentals to more complex concepts across pages
- Tailor the depth and pace to the student's knowledge level
- Think of each page as a single slide/screen in a presentation
- Example progression for a section on "Variables":
  * Page 1: "What is a variable?" (definition)
  * Page 2: "Variable anatomy" (parts of a variable)
  * Page 3: "Creating variables" (syntax)
  * Page 4: "Variable names" (naming rules)
  * Page 5: "Common mistakes" (what to avoid)
  * Page 6: "Variable types preview" (introduction)
  * Page 7: "Numbers" (number type)
  * Page 8: "Text" (string type)
  * Page 9: "True/False" (boolean type)
  * Page 10: "Practice example 1" (simple example)
  * Page 11: "Practice example 2" (another example)
  * Page 12: "Section summary" (recap)
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const outline: LessonOutline = JSON.parse(cleanedText);

      return outline;
    } catch (error) {
      console.error('Error generating lesson outline:', error);
      throw error;
    }
  }

  /**
   * Generates whiteboard content for a specific page
   * @param topic - The main topic
   * @param pageTitle - Title of the page
   * @param pageDescription - Description of what to teach
   * @param estimatedDuration - Duration string (e.g., "30 seconds")
   * @param lessonOutline - The complete lesson outline for context (optional)
   * @returns Whiteboard content with drawings and captions
   */
  async generateWhiteboardContent(
    topic: string,
    pageTitle: string,
    pageDescription: string,
    estimatedDuration: string,
    lessonOutline?: LessonOutline
  ): Promise<WhiteboardContent> {
    try {
      // Parse duration to seconds
      const durationMatch = estimatedDuration.match(/(\d+)/);
      const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : 30;
  // Provide the available animations to the model so it can choose appropriate animations
  const animationList = JSON.stringify(animationsCfg, null, 2);

  // Build context about the lesson outline if provided
  let outlineContext = '';
  if (lessonOutline) {
    outlineContext = `
Lesson Outline Context:
- Overall Topic: "${lessonOutline.topic}"
- Knowledge Level: ${lessonOutline.knowledgeLevel}
- Overall Objective: "${lessonOutline.overallObjective}"
- Total Sections: ${lessonOutline.sections.length}

This page is part of the larger lesson structure. Consider how this page fits into the overall flow and builds upon or prepares for other content in the lesson.
`;
  }

  const prompt = `
You are an expert AI tutor creating HIGHLY ENGAGING animated whiteboard content for teaching. Your goal is to create a balanced, visually-rich learning experience that combines clear narration with strategic visual elements.

Topic: "${topic}"
Page: "${pageTitle}"
What to Teach: "${pageDescription}"
Duration: ${estimatedDuration} (${durationSeconds} seconds)
${outlineContext}
Available animations (animations.json):
${animationList}

🎯 CONTENT PHILOSOPHY:
- VISUAL-FIRST TEACHING: Use diagrams, figures, and drawings as PRIMARY teaching tools
- BALANCED APPROACH: Combine visual explanations with clear narration (50% visual, 50% verbal)
- CREATIVE PRESENTATION: Think of unique, memorable ways to present each concept
- SPATIAL AWARENESS: Carefully plan layout to prevent overlapping and ensure everything fits on canvas
- ANIMATIONS: Keep the character animated throughout to maintain engagement

CANVAS CONSTRAINTS:
- Canvas size: 800x600 pixels
- Safe zone for content: x: 50-750, y: 50-550 (avoid edges)
- Reserve space: Top (y: 50-100) for titles, Bottom (y: 500-550) for captions
- Main content area: x: 50-750, y: 100-500

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks):

{
  "totalDuration": ${durationSeconds},
  "drawings": [
    {
      "timestamp": 0,
      "type": "text|line|circle|rectangle|arrow|curve|polygon|highlighter|axis|angle|dashed-line",
      "color": "#hexcolor",
      "lineWidth": 2,
      "duration": 0.5,
      ... (type-specific properties)
    }
  ],
  "captions": [
    {
      "timestamp": 0,
      "text": "Caption text - should be detailed and explanatory",
      "duration": 5,
      "position": "bottom"
    }
  ],
  "animations": [
    {
      "id": "talking-1",
      "name": "Talking (1)",
      "start": 0,
      "duration": 5.17,
      "loop": false
    }
  ]
}

DRAWING TYPES AND PROPERTIES:

CRITICAL POSITIONING RULE FOR ALL ELEMENTS:
- When you want something CENTERED at position x=400, you must account for the element's width/size
- For TEXT: If you want text centered at x=400, calculate approximate text width and start at (400 - textWidth/2)
  * Example: "Hello" (5 chars, fontSize 20) ≈ 50px wide → start at x=375 to center at x=400
  * Example: "Variables" (9 chars, fontSize 24) ≈ 108px wide → start at x=346 to center at x=400
  * Rule of thumb: Each character ≈ fontSize * 0.5 pixels wide
- For SHAPES: start position should be calculated to CENTER the shape at desired location
- For CENTERED TITLE at top: Calculate text width, start at (400 - textWidth/2) with y=70

1. "text": Display text
   - start: {x, y} - STARTING position of text (left edge of first character)
   - text: "string" - the text content
   - fontSize: number (default 20, range: 18-28 for readability)
   - color, lineWidth (usually 0 for text), duration
   - CENTERING: To center text at x=C, use x = C - (textLength * fontSize * 0.5 / 2)
   - Example: Center "Python Basics" at 400 → text width ≈ 13 * 24 * 0.5 = 156px → start x = 400 - 78 = 322

2. "line": Straight line
   - points: [{x, y}, {x, y}] - start and end points (or multiple points for connected lines)
   - color, lineWidth, duration
   - For centered horizontal lines: calculate to span equally from center

3. "circle": Circle shape
   - start: {x, y} - CENTER point of the circle
   - radius: number
   - color, lineWidth, duration
   - This is already centered correctly at start position

4. "rectangle": Rectangle/box
   - start: {x, y} - TOP-LEFT corner position
   - width: number
   - height: number
   - color, lineWidth, duration
   - CENTERING: To center rect at x=C, use x = C - (width/2), y = desiredY - (height/2) for vertical center

5. "arrow": Directional arrow
   - start: {x, y} - arrow tail (starting point)
   - end: {x, y} - arrow head (points to)
   - color, lineWidth, duration
   - CENTERING: For horizontal arrows, calculate to span equally from desired center

6. "curve": Smooth curve
   - points: [{x, y}, {x, y}, ...] - multiple points for smooth curve
   - color, lineWidth, duration
   - CENTERING: Middle point in points array should be near desired center

7. "highlighter": Semi-transparent highlight
   - start: {x, y} - TOP-LEFT corner position
   - width: number
   - height: number
   - color, opacity (0.3), lineWidth (usually 0), duration
   - CENTERING: To center at x=C, use x = C - (width/2)

8. "polygon": Multi-sided shape
   - points: [{x, y}, ...] - vertices
   - fill: boolean (optional)
   - color, lineWidth, duration
   - CENTERING: Calculate centroid of points and adjust all points to center shape at desired location

9. "angle": Angle marker with arc
   - start: {x, y} - vertex point (pivot point of angle)
   - radius: number - arc radius
   - degrees: number - angle in degrees
   - color, lineWidth, duration

10. "dashed-line": Dashed/dotted line
    - start: {x, y} - line start
    - end: {x, y} - line end
    - dashPattern: [5, 5] - dash and gap lengths
    - color, lineWidth, duration

11. "axis": Coordinate system
    - start: {x, y} - TOP-LEFT corner position
    - width: number
    - height: number
    - color, lineWidth, duration
    - CENTERING: To center at x=C, use x = C - (width/2)

CANVAS DIMENSIONS: 800x600 (design for this size)

📚 CONTENT STRUCTURE GUIDELINES:

1. DRAWINGS & FIGURES (PRIMARY FOCUS - 50% of attention):
   - Create 6-10 visual elements per page (diagrams, shapes, text labels, arrows, etc.)
   - LAYOUT PLANNING: Plan the entire visual layout BEFORE setting timestamps
   - Use a grid mental model: divide canvas into sections for organized content
   - Visual types to use:
     * Title text at top (y: 60-80)
     * Concept diagrams in center (x: 100-700, y: 150-400)
     * Labels and annotations near their related visuals
     * Arrows to show relationships and flow
     * Boxes/circles to group related concepts
     * Highlighters for emphasis (use sparingly)
   - SPACING RULES:
     * Minimum 20px between visual elements
     * Text elements: fontSize 18-24 for readability
     * Leave 10% margin from canvas edges
     * Check for overlaps: if two elements are close, offset them
   - Drawing timing: Space out by 3-6 seconds (faster pace than before)
   - Each drawing duration: 0.3-0.6 seconds (quick reveal)
   - Build visuals progressively (step-by-step revelation)

2. CREATIVE PRESENTATION TECHNIQUES:
   Choose one unique approach per page:
   - 🎨 Visual Metaphor: Use familiar shapes/objects to explain abstract concepts
   - 📊 Progressive Building: Start simple, add complexity layer by layer
   - 🔄 Comparison Layout: Split screen to compare two concepts side-by-side
   - 🎯 Central Focus: Main concept in center, supporting details radiating outward
   - 📈 Sequential Flow: Left-to-right or top-to-bottom progression with arrows
   - 🧩 Puzzle Pieces: Show how components fit together
   - 🌳 Tree/Hierarchy: Parent-child relationships branching out
   - 🔢 Numbered Steps: Visual step-by-step process with clear numbering
   - 💡 Before/After: Show transformation or change clearly
   - 🎭 Story Visualization: Tell a mini-story through sequential drawings
   
   Example layouts:
   - For definitions: Large term at top, definition below, example at bottom
   - For processes: Numbered boxes connected with arrows (flow diagram)
   - For comparisons: Two columns with pros/cons or differences
   - For hierarchies: Tree structure with branches
   - For formulas: Large formula in center, annotations pointing to each part

3. CAPTIONS (SUPPORTING ROLE - 25% of attention):
   - Generate 4-6 concise captions (NOT 5-8 like before)
   - Each caption: 20-30 words maximum (8-12 seconds duration)
   - CRITICAL: 2-3 second gaps between ALL captions (longer pauses)
   - Captions should describe what's being drawn or direct attention
   - Use captions to guide visual understanding, not as primary teaching tool
   - Position: "bottom" for all captions to avoid content overlap
   - TIMING PATTERN:
     * Caption 1: timestamp 0, duration 10 seconds
     * GAP: 2-3 seconds (no caption)
     * Caption 2: timestamp 13, duration 9 seconds
     * GAP: 2-3 seconds
     * Caption 3: timestamp 25, duration 10 seconds
     * Continue pattern...

4. ANIMATIONS (25% of attention):
   - Character MUST be animated during caption playback
   - Use "breathing-idle" during ALL gaps between captions (2-3 seconds)
   - Animation sequence:
     * "hands-forward-gesture" (3.10s): When introducing visuals
     * "talking-1" (5.17s): During explanations
     * "talking-2" (10.27s): For longer explanations
     * "talking" (3.77s): For variety
     * "head-nod-yes" (2.60s): When confirming concepts
     * "breathing-idle" (infinite): During gaps (ALWAYS)
   - Animations must start at same timestamp as captions
   - Switch to "breathing-idle" immediately when caption ends

⏱️ REVISED PACING RULES:
- Caption duration: 8-12 seconds each (LONGER than before)
- Gaps between captions: 2-3 seconds (MANDATORY - increased from 1-2)
- Drawing intervals: 3-6 seconds apart (FASTER - more visuals)
- Drawing reveal duration: 0.3-0.6 seconds (quick appearance)
- Page duration targets:
  * 30 seconds: 4 captions + 6-8 drawings
  * 45 seconds: 5 captions + 8-10 drawings
  * 60 seconds: 6 captions + 10-12 drawings

📐 LAYOUT PLANNING PROCESS:
Step 1: Sketch mental layout (which visual goes where)
Step 2: Assign coordinates ensuring no overlaps
Step 3: Plan drawing sequence (which appears first, second, etc.)
Step 4: Set timestamps with 3-6 second spacing
Step 5: Write captions that reference the visuals

OVERLAP PREVENTION CHECKLIST:
- [ ] Title is at top (y < 100), captions at bottom (no caption position conflicts)
- [ ] Main visuals are in center zone (y: 150-450)
- [ ] Text labels are positioned near (but not on top of) their visual elements
- [ ] Elements have at least 20px spacing between them
- [ ] Nothing is positioned at x < 50 or x > 750
- [ ] Nothing is positioned at y < 50 or y > 550
- [ ] Arrows/lines connect elements without crossing through other elements

📏 COORDINATE EXAMPLES (800x600 canvas):
- Page title: MUST BE CENTERED - For "Python Basics" (13 chars, fontSize 24):
  * Text width ≈ 13 * 24 * 0.5 = 156px
  * Start x = 400 - (156/2) = 322, y = 70
  * Result: Text is properly centered at x=400
  
- Centered title (shorter): For "Variables" (9 chars, fontSize 24):
  * Text width ≈ 9 * 24 * 0.5 = 108px
  * Start x = 400 - (108/2) = 346, y = 70

- Centered box in middle: Box 200x100 at center
  * Start x = 400 - (200/2) = 300, y = 300 - (100/2) = 250
  
- Top-left quadrant content: x: 100-350, y: 150-300
- Top-right quadrant content: x: 450-700, y: 150-300
- Bottom-left quadrant content: x: 100-350, y: 320-450
- Bottom-right quadrant content: x: 450-700, y: 320-450
- Center zone: x: 300-500, y: 250-350

TEXT CENTERING FORMULA:
startX = desiredCenterX - (characterCount * fontSize * 0.5) / 2

COMMON TEXT CALCULATIONS (for centering at x=400):
- 5 chars, fontSize 20: startX = 400 - 25 = 375
- 8 chars, fontSize 22: startX = 400 - 44 = 356
- 10 chars, fontSize 24: startX = 400 - 60 = 340
- 15 chars, fontSize 20: startX = 400 - 75 = 325
- 20 chars, fontSize 18: startX = 400 - 90 = 310

🎨 COLOR PALETTE (Use strategically):
- Titles: #2563eb (blue) - high contrast, easy to read
- Main content: #1f2937 (dark gray) - primary text and shapes
- Emphasis/Important: #dc2626 (red) - key points, warnings
- Secondary concepts: #059669 (green) - supporting information
- Accents: #7c3aed (purple), #6366f1 (indigo) - decorative elements
- Highlights: #fbbf24 (yellow/gold, opacity: 0.3) - emphasize areas
- Use consistent colors for similar concept types

🎯 TIMING STRATEGY EXAMPLE (45-second page):
Second 0: Title appears (text, center-top)
Second 0-10: Caption 1 + "hands-forward-gesture" animation
Second 3: First visual element (main concept shape/diagram)
Second 6: Second visual (supporting element)
Second 9: Third visual (label or annotation)
Second 10-13: GAP - "breathing-idle" animation (NO caption)
Second 13-22: Caption 2 + "talking-1" animation
Second 15: Fourth visual (connecting arrow or relationship)
Second 18: Fifth visual (example or detail)
Second 21: Sixth visual (highlight or emphasis)
Second 22-25: GAP - "breathing-idle" animation
Second 25-35: Caption 3 + "talking-2" animation
Second 27: Seventh visual (summary element)
Second 30: Eighth visual (final connection)
Second 35-38: GAP - "breathing-idle" animation
Second 38-45: Caption 4 + "talking-1" animation (conclusion)
Second 40: Ninth visual (reinforcement)

UNIQUE PRESENTATION EXAMPLES:

Example 1 - Teaching "Variables in Python":
- Approach: Visual Metaphor (Container/Box concept)
- Layout: Large box in center, label on top, value inside
- Sequence: Draw box → Add label "name" → Show value "John" inside → Draw arrow showing assignment
- Captions reference the visual metaphor throughout

Example 2 - Teaching "Photosynthesis":
- Approach: Process Flow
- Layout: Left (inputs) → Center (process) → Right (outputs)
- Sequence: Sun + Water + CO2 on left → Plant in center → Oxygen + Glucose on right
- Arrows show direction of flow

Example 3 - Teaching "Fractions":
- Approach: Visual Division
- Layout: Circle divided into parts with different colors
- Sequence: Whole circle → Division lines → Shading portions → Labeling fractions
- Compare multiple circles side-by-side

✅ QUALITY CHECKLIST:
- [ ] 4-6 captions total (not more)
- [ ] Each caption is 8-12 seconds duration (LONGER)
- [ ] 2-3 second gaps between ALL captions (LONGER gaps)
- [ ] 6-10 visual elements (drawings/diagrams)
- [ ] Drawings spaced 3-6 seconds apart (FASTER than captions)
- [ ] Drawing duration 0.3-0.6 seconds (quick reveal)
- [ ] Character animated during all captions
- [ ] "breathing-idle" during ALL gaps
- [ ] No overlapping elements (20px minimum spacing)
- [ ] All content within safe zone (x: 50-750, y: 50-550)
- [ ] Title at top (y < 100), captions at bottom (no position conflicts)
- [ ] **ALL TEXT IS PROPERLY CENTERED using the formula: startX = centerX - (textWidth/2)**
- [ ] **Titles use calculated startX, NOT just x=400**
- [ ] **Rectangles/boxes centered by adjusting start position**
- [ ] Creative presentation technique chosen and applied
- [ ] Visuals build progressively (step-by-step)
- [ ] Colors used consistently and strategically
- [ ] Layout is balanced and organized
- [ ] Captions reference and guide the visual content

🎯 REMEMBER: 
1. VISUALS ARE PRIMARY - Drawings and figures are the main teaching tool
2. LONGER GAPS - 2-3 seconds between captions (increased for processing)
3. MORE DRAWINGS - 6-10 visual elements per page (increased focus on visuals)
4. FASTER DRAWING PACE - New visual every 3-6 seconds
5. PREVENT OVERLAPS - Plan layout carefully, maintain spacing
6. STAY IN BOUNDS - All content within canvas safe zone
7. BE CREATIVE - Use unique presentation approach for each concept
8. BUILD PROGRESSIVELY - Reveal visuals step-by-step, not all at once
9. **CENTER TEXT PROPERLY** - Calculate startX = centerX - (textWidth/2), don't just use centerX
10. **CENTER ALL ELEMENTS** - For rectangles, use start = center - (size/2)

CRITICAL CENTERING REMINDER:
❌ WRONG: {type: "text", start: {x: 400, y: 70}, text: "Python Basics", fontSize: 24}
✅ CORRECT: {type: "text", start: {x: 322, y: 70}, text: "Python Basics", fontSize: 24}
(Because text width ≈ 156px, so start at 400-78=322 to center at 400)

The goal is a visually-rich, well-paced lesson where students learn primarily by seeing the concepts illustrated on the whiteboard, with captions providing concise guidance and context. All text and elements must be properly centered, not just starting from the center point.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const content = JSON.parse(cleanedText);

      // Normalize animations returned by the model and validate against known animations
      const known = Array.isArray((animationsCfg as any).animations) ? (animationsCfg as any).animations : [];
      const parsedAnimations: AvatarAnimation[] = Array.isArray(content.animations)
        ? content.animations.map((a: any) => {
            const id = a.id || (a.name && String(a.name).toLowerCase().replace(/\s+/g, '-')) || '';
            const match = known.find((k: any) => k.id === id || (k.name && k.name.toLowerCase() === String(a.name || '').toLowerCase()));
            return {
              id: match ? match.id : id,
              name: match ? match.name : a.name,
              start: typeof a.start === 'number' ? a.start : 0,
              duration: typeof a.duration === 'number' ? a.duration : 0,
              loop: !!a.loop,
            } as AvatarAnimation;
          })
        : [];

      return {
        pageId: '', // Will be set by controller
        pageTitle,
        topic,
        totalDuration: (content.totalDuration || durationSeconds) + 5,
        drawings: content.drawings || [],
        captions: content.captions || [],
        animations: parsedAnimations,
      };
    } catch (error) {
      console.error('Error generating whiteboard content:', error);
      throw error;
    }
  }

  /**
   * Generates an AI response to a user's question during a lesson
   * Returns structured content with captions and animations (no drawings)
   * @param lessonOutline - The complete lesson outline
   * @param completedPages - Array of page IDs that the user has completed
   * @param currentPageId - The current page ID where the user is asking the question
   * @param userQuestion - The question asked by the user
   * @returns Structured response with captions and animations
   */
  async answerLessonQuestion(
    lessonOutline: LessonOutline,
    completedPages: string[],
    currentPageId: string,
    userQuestion: string
  ): Promise<{
    question: string;
    totalDuration: number;
    captions: CaptionSegment[];
    animations: AvatarAnimation[];
  }> {
    try {
      // Build context about what the user has learned so far
      const completedContent: string[] = [];
      let currentPageDetails = null;

      // Collect information about completed pages and current page
      for (const section of lessonOutline.sections) {
        for (const page of section.pages) {
          if (completedPages.includes(page.id)) {
            completedContent.push(
              `Section: ${section.title}\nPage: ${page.title}\nContent: ${page.description}`
            );
          }
          if (page.id === currentPageId) {
            currentPageDetails = {
              sectionTitle: section.title,
              sectionDescription: section.description,
              pageTitle: page.title,
              pageDescription: page.description,
            };
          }
        }
      }

      const completedContentText =
        completedContent.length > 0
          ? completedContent.join('\n\n')
          : 'No pages completed yet (user is at the beginning of the lesson)';

      const currentPageText = currentPageDetails
        ? `Section: ${currentPageDetails.sectionTitle} - ${currentPageDetails.sectionDescription}\nCurrent Page: ${currentPageDetails.pageTitle}\nContent: ${currentPageDetails.pageDescription}`
        : 'Current page information not available';

      // Provide the available animations to the model
      const animationList = JSON.stringify(animationsCfg, null, 2);

      const prompt = `
You are an expert AI tutor helping a student who has interrupted their lesson to ask a question.

LESSON CONTEXT:
Topic: "${lessonOutline.topic}"
Overall Objective: "${lessonOutline.overallObjective}"
Student's Knowledge Level: ${lessonOutline.knowledgeLevel}

STUDENT'S PROGRESS:
What the student has learned so far:
${completedContentText}

Current lesson content (where the student is now):
${currentPageText}

STUDENT'S QUESTION:
"${userQuestion}"

Available animations (animations.json):
${animationList}

YOUR TASK:
Provide a clear, concise, and helpful answer broken into captions with appropriate avatar animations.

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks):

{
  "totalDuration": 30,
  "captions": [
    {
      "timestamp": 0,
      "text": "Caption text that will be spoken",
      "duration": 8,
      "position": "bottom"
    }
  ],
  "animations": [
    {
      "id": "talking-1",
      "name": "Talking (1)",
      "start": 0,
      "duration": 5.17,
      "loop": false
    }
  ]
}

CONTENT GUIDELINES:

1. ANSWER STRUCTURE:
   - Directly address the student's question
   - Break the answer into 3-5 clear caption segments
   - Each caption should be conversational and explanatory
   - Use lesson context when relevant
   - Be encouraging and supportive
   - Match the ${lessonOutline.knowledgeLevel} knowledge level

2. CAPTIONS (Primary focus):
   - Generate 3-5 detailed captions
   - Each caption should be a complete thought (15-25 words)
   - Caption duration: 7-10 seconds each (slow speaking pace)
   - Add 1-2 second gaps between captions for processing
   - Natural, flowing language
   - Position: "bottom" for all captions

3. ANIMATIONS (Must match caption timing):
   - Character MUST be animated during all caption playback
   - Use appropriate animations:
     * "talking-1" (5.17s): Main explanation
     * "talking" (3.77s): Alternative talking
     * "talking-2" (10.27s): Longer explanation
     * "hands-forward-gesture" (3.10s): Introducing the answer
     * "head-nod-yes" (2.60s): Confirming/agreeing
     * "breathing-idle" (infinite): During gaps between captions
   - Animation should START at the same timestamp as the caption
   - Use "breathing-idle" during gaps

4. TIMING STRATEGY:
   - Second 0-8: First caption (acknowledge question) + "hands-forward-gesture" or "talking-1"
   - Second 9-10: Brief pause with "breathing-idle"
   - Second 10-18: Second caption (main answer) + "talking-2" or "talking-1"
   - Second 19-20: Brief pause with "breathing-idle"
   - Second 20-28: Third caption (examples/details) + "talking-1"
   - Second 29-30: Brief pause with "breathing-idle"
   - Continue pattern for additional captions if needed
   - Total duration: typically 25-40 seconds for a complete answer

5. PACING RULES:
   - Speaking rate: 2.5-3 words per second (slow and clear)
   - Minimum 1-2 seconds between captions
   - Don't rush - clarity over speed
   - Total answer should be concise (25-40 seconds typical)

6. RESPONSE STYLE:
   - Conversational and friendly
   - Clear and easy to understand
   - Directly relevant to their question
   - Reference what they've learned when helpful
   - Encourage continued learning
   - Avoid revealing content they haven't reached yet

EXAMPLE TIMING:
- Caption 1: timestamp 0, duration 8 (with "hands-forward-gesture" 0-3.1, then "talking-1" 3.1-8.27)
- Gap: 8-10 (with "breathing-idle")
- Caption 2: timestamp 10, duration 8 (with "talking-2" 10-20.27)
- Gap: 18-20 (with "breathing-idle")
- Caption 3: timestamp 20, duration 7 (with "talking-1" 20-25.17)

Now, generate the structured response with captions and animations:
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const content = JSON.parse(cleanedText);

      // Normalize animations and validate against known animations
      const known = Array.isArray((animationsCfg as any).animations) ? (animationsCfg as any).animations : [];
      const parsedAnimations: AvatarAnimation[] = Array.isArray(content.animations)
        ? content.animations.map((a: any) => {
            const id = a.id || (a.name && String(a.name).toLowerCase().replace(/\s+/g, '-')) || '';
            const match = known.find((k: any) => k.id === id || (k.name && k.name.toLowerCase() === String(a.name || '').toLowerCase()));
            return {
              id: match ? match.id : id,
              name: match ? match.name : a.name,
              start: typeof a.start === 'number' ? a.start : 0,
              duration: typeof a.duration === 'number' ? a.duration : 0,
              loop: !!a.loop,
            } as AvatarAnimation;
          })
        : [];

      return {
        question: userQuestion,
        totalDuration: content.totalDuration || 30,
        captions: content.captions || [],
        animations: parsedAnimations,
      };
    } catch (error) {
      console.error('Error generating answer to lesson question:', error);
      throw error;
    }
  }
}

export default new AIService();
export type {
  AssessmentQuestion,
  MCQOption,
  LessonOutline,
  LessonSection,
  LessonPage,
  WhiteboardContent,
  DrawingInstruction,
  CaptionSegment,
  Point,
  AvatarAnimation,
};
