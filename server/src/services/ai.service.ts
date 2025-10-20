import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config';

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
   * @returns Whiteboard content with drawings and captions
   */
  async generateWhiteboardContent(
    topic: string,
    pageTitle: string,
    pageDescription: string,
    estimatedDuration: string
  ): Promise<WhiteboardContent> {
    try {
      // Parse duration to seconds
      const durationMatch = estimatedDuration.match(/(\d+)/);
      const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : 30;

      const prompt = `
You are an expert AI tutor creating animated whiteboard content for teaching.

Topic: "${topic}"
Page: "${pageTitle}"
What to Teach: "${pageDescription}"
Duration: ${estimatedDuration} (${durationSeconds} seconds)

Create detailed whiteboard content with drawings and captions that will be animated over time.
Remember: This is a SINGLE PAGE/SCREEN - keep content focused and clear. The whiteboard will be cleared before the next page.

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
      "text": "Caption text",
      "duration": 3,
      "position": "bottom"
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

GUIDELINES FOR SHORT PAGES (20-60 seconds):
- Start with a title (text) for the page at the top
- Create 4-8 visual elements (don't overcrowd - this is ONE focused concept)
- Time drawings to appear progressively (timestamps spread throughout duration)
- Each drawing should have a duration (0.3-0.5 seconds for animation)
- Space timestamps appropriately (2-5 seconds between major elements)
- Use colors effectively: blue (#2563eb) for titles, green (#059669) for main content, red (#dc2626) for emphasis
- Generate 2-4 captions that narrate what's being shown
- Each caption should last 5-10 seconds
- Caption timestamps should align with related drawings
- Use position: "bottom" for all captions
- Make content bite-sized, clear, and focused on ONE key point
- Build the single concept step by step
- Use visual aids (arrows, highlights, labels) to emphasize the key message

Example color palette:
- Titles: #2563eb (blue)
- Main content: #059669 (green), #1f2937 (dark gray)
- Emphasis: #dc2626 (red), #7c3aed (purple)
- Highlights: #fbbf24 (yellow/gold)
- Secondary: #6366f1 (indigo)
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const content = JSON.parse(cleanedText);

      return {
        pageId: '', // Will be set by controller
        pageTitle,
        topic,
        totalDuration: content.totalDuration || durationSeconds,
        drawings: content.drawings || [],
        captions: content.captions || [],
      };
    } catch (error) {
      console.error('Error generating whiteboard content:', error);
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
};
