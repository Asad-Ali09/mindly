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

The questions should help understand:
1. What they already know about the topic
2. What specific aspects they want to learn
3. Their learning goals and use cases
4. Their preferred learning style

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

Rules:
- Generate 4-6 questions
- type can be "single" (single select) or "multiple" (multiple select)
- Each question should have 4 options
- Use ids: a, b, c, d for options
- For multiple select questions, add "(Select all that apply)" to the question text
- Make questions conversational and relevant to ${topic}
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
You are an expert AI tutor creating HIGHLY ENGAGING animated whiteboard content for teaching. Your PRIMARY GOAL is to explain concepts thoroughly and engagingly through detailed narration and appropriate character animations.

Topic: "${topic}"
Page: "${pageTitle}"
What to Teach: "${pageDescription}"
Duration: ${estimatedDuration} (${durationSeconds} seconds)
${outlineContext}
Available animations (animations.json):
${animationList}

🎯 CONTENT PHILOSOPHY:
- EXPLANATIONS FIRST: Prioritize detailed, clear verbal explanations over complex drawings
- ENGAGEMENT: Keep the student engaged through conversational, flowing narration
- VISUAL SUPPORT: Use drawings as visual aids to support the explanation, not as the main content
- ANIMATIONS: The character should be actively animated throughout the explanation to maintain engagement

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

1. "text": Display text
   - start: {x, y} - position
   - text: "string" - the text
   - fontSize: number (default 20)
   - color, lineWidth, duration

2. "line": Straight line
   - points: [{x, y}, {x, y}] - start and end points (or multiple points for connected lines)
   - color, lineWidth, duration

3. "circle": Circle shape
   - start: {x, y} - center point
   - radius: number
   - color, lineWidth, duration

4. "rectangle": Rectangle/box
   - start: {x, y} - top-left corner
   - width: number
   - height: number
   - color, lineWidth, duration

5. "arrow": Directional arrow
   - start: {x, y} - arrow start
   - end: {x, y} - arrow end (points to)
   - color, lineWidth, duration

6. "curve": Smooth curve
   - points: [{x, y}, {x, y}, ...] - multiple points for smooth curve
   - color, lineWidth, duration

7. "highlighter": Semi-transparent highlight
   - start: {x, y} - top-left
   - width: number
   - height: number
   - color, opacity (0.3), lineWidth (usually 0), duration

8. "polygon": Multi-sided shape
   - points: [{x, y}, ...] - vertices
   - fill: boolean (optional)
   - color, lineWidth, duration

9. "angle": Angle marker with arc
   - start: {x, y} - vertex point
   - radius: number - arc radius
   - degrees: number - angle in degrees
   - color, lineWidth, duration

10. "dashed-line": Dashed/dotted line
    - start: {x, y}
    - end: {x, y}
    - dashPattern: [5, 5] - dash and gap lengths
    - color, lineWidth, duration

11. "axis": Coordinate system
    - start: {x, y} - top-left corner
    - width: number
    - height: number
    - color, lineWidth, duration

CANVAS DIMENSIONS: 800x600 (design for this size)

📚 CONTENT STRUCTURE GUIDELINES:

1. CAPTIONS (HIGHEST PRIORITY - 70% of focus):
   - Generate 5-8 detailed captions that tell a complete story
   - Each caption should be conversational and explanatory (like a teacher speaking)
   - Caption duration: 6-10 seconds each (LONGER for proper speaking pace)
   - IMPORTANT: Add 1-2 second gaps between captions to allow processing time
   - Use natural, flowing language that builds understanding step-by-step
   - Include examples, analogies, and real-world connections
   - Each caption should be a complete thought that can be spoken naturally
   - Think of captions as the PRIMARY teaching tool
   - Example caption: "Let me explain why this is important. When we look at chemical formulas, we're actually seeing a shorthand that chemists use to communicate. It's like a universal language that tells us exactly what atoms are present and in what quantities."
   - TIMING EXAMPLE:
     * Caption 1: timestamp 0, duration 7 seconds
     * Caption 2: timestamp 8 (1 second gap), duration 8 seconds  
     * Caption 3: timestamp 17 (1 second gap), duration 6 seconds

2. ANIMATIONS (CRITICAL - 25% of focus):
   - Character MUST be animated whenever speaking (captions are playing)
   - Use varied animations to maintain visual interest
   - Animation types to use:
     * "talking-1" (5.17s): Main teaching animation - use frequently
     * "talking" (3.77s): Alternative talking animation for variety
     * "talking-2" (10.27s): Emphatic/passionate explanation
     * "hands-forward-gesture" (3.10s): Presenting or introducing concepts
     * "head-nod-yes" (2.60s): Confirming understanding or agreement
     * "standing-arguing" (20.80s): Passionate/detailed explanation (for longer segments)
     * "breathing-idle" (infinite): Use during gaps between captions (1-2 seconds)
   - Sequence animations to match caption timing and content mood
   - Example: Start with "hands-forward-gesture" (introduction) → "talking-1" (main explanation) → "breathing-idle" (brief pause) → "talking-2" (next point)
   - Animation should START at the same time as the caption it accompanies

3. DRAWINGS (SUPPORTING ROLE - 5% of focus):
   - Use 3-5 strategic visual elements (LESS is MORE)
   - CRITICAL: Space drawings with 8-15 second intervals (SLOW DOWN!)
   - Drawings should appear DURING caption playback, not before
   - Each drawing animation duration: 0.5-1.0 seconds (slower reveal)
   - Coordinate drawing appearance with what's being said in captions
   - Use drawings for:
     * Page title (text at top) - appears in first 2 seconds
     * Key terms or definitions (text) - when mentioned in caption
     * Simple diagrams or illustrations - to support explanation
     * Arrows to show relationships - when explaining connections
     * Highlights to emphasize points - when stressing importance
   - DON'T create complex diagrams - the explanation is more important
   - DRAWING TIMING EXAMPLE:
     * Drawing 1 (title): timestamp 0, duration 0.8s
     * Drawing 2 (key term): timestamp 12, duration 0.7s (appears during 2nd caption)
     * Drawing 3 (diagram): timestamp 25, duration 1.0s (appears during 3rd caption)

4. TIMING STRATEGY FOR 30-60 SECOND PAGES:
   - Second 0-2: Page title appears + welcoming animation starts
   - Second 0-7: First caption (introduction) + "hands-forward-gesture" animation
   - Second 8-15: Second caption (main concept) + "talking-1" animation, key drawing at ~12s
   - Second 16-17: Brief pause with "breathing-idle"
   - Second 17-25: Third caption (detailed explanation) + "talking-2" animation
   - Second 26-35: Fourth caption (examples/application) + "talking-1" animation, supporting drawing at ~30s
   - Second 36-37: Brief pause
   - Second 37-45: Fifth caption (summary) + "head-nod-yes" then "talking" animation
   - Ensure character is ALWAYS animated (talking or breathing)
   - Drawings appear strategically during explanations, not all at once

⏱️ PACING RULES (CRITICAL):
- Average speaking rate: 150-170 words per minute (2.5-3 words per second)
- Caption text length: 15-25 words per caption (6-10 seconds to speak naturally)
- Gaps between captions: 1-2 seconds (breathing room)
- Drawing intervals: Minimum 8-12 seconds apart
- Don't rush - quality explanation > quantity of content
- If page duration is 30 seconds: 4-5 captions MAX
- If page duration is 45 seconds: 6-7 captions MAX
- If page duration is 60 seconds: 7-8 captions MAX

🎨 COLOR PALETTE (Use strategically):
- Titles: #2563eb (blue)
- Main content: #059669 (green), #1f2937 (dark gray)
- Emphasis: #dc2626 (red), #7c3aed (purple)
- Highlights: #fbbf24 (yellow/gold)
- Secondary: #6366f1 (indigo)

✅ QUALITY CHECKLIST:
- [ ] Captions have proper 1-2 second gaps between them (not continuous)
- [ ] Each caption duration matches natural speaking pace (6-10 seconds)
- [ ] Character is animated during all caption playback
- [ ] "breathing-idle" used during gaps between captions
- [ ] Animations start at same timestamp as their corresponding captions
- [ ] Drawings are spaced 8-15 seconds apart (slow pacing)
- [ ] Drawing duration is 0.5-1.0 seconds (slow reveal)
- [ ] Drawings appear DURING captions, coordinated with what's being said
- [ ] Total number of captions fits the duration (4-5 for 30s, 6-7 for 45s, 7-8 for 60s)
- [ ] Content is engaging but NOT rushed
- [ ] Student has time to process each concept before moving to the next

🎯 REMEMBER: SLOW DOWN! Quality teaching requires proper pacing. The student needs time to:
1. Listen to the explanation (caption)
2. Process what was said (gap between captions)
3. Look at visual aids (drawings appear during explanation)
4. Connect the concepts (animations help maintain engagement)

Think of this as a real classroom lecture - you wouldn't rush through explanations. Give each concept time to breathe!
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
        totalDuration: content.totalDuration || durationSeconds,
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
