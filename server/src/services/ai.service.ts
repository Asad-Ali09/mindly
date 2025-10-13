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

interface LessonSubsection {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string; // e.g., "5 minutes"
}

interface LessonSection {
  id: string;
  title: string;
  description: string;
  subsections: LessonSubsection[];
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
  subsectionId: string;
  subsectionTitle: string;
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
      
      // Fallback to sample questions if API fails
      const sampleQuestions: AssessmentQuestion[] = [
      {
        id: 'q1',
        question: `How familiar are you with ${topic}?`,
        type: 'single',
        options: [
          { id: 'a', text: 'Never heard of it before' },
          { id: 'b', text: 'Heard about it, but never used it' },
          { id: 'c', text: 'Have some basic knowledge' },
          { id: 'd', text: 'Use it regularly' },
        ],
      },
      {
        id: 'q2',
        question: `What aspects of ${topic} are you most interested in? (Select all that apply)`,
        type: 'multiple',
        options: [
          { id: 'a', text: 'Basic concepts and fundamentals' },
          { id: 'b', text: 'Practical applications' },
          { id: 'c', text: 'Advanced techniques' },
          { id: 'd', text: 'Best practices and tips' },
        ],
      },
      {
        id: 'q3',
        question: `What is your primary goal for learning ${topic}?`,
        type: 'single',
        options: [
          { id: 'a', text: 'Personal interest and curiosity' },
          { id: 'b', text: 'Academic requirements' },
          { id: 'c', text: 'Professional development' },
          { id: 'd', text: 'Working on a specific project' },
        ],
      },
      {
        id: 'q4',
        question: `How do you prefer to learn new concepts? (Select all that apply)`,
        type: 'multiple',
        options: [
          { id: 'a', text: 'Visual explanations and diagrams' },
          { id: 'b', text: 'Step-by-step examples' },
          { id: 'c', text: 'Theoretical understanding first' },
          { id: 'd', text: 'Hands-on practice' },
        ],
      },
      {
        id: 'q5',
        question: `What is your current level of expertise in related areas?`,
        type: 'single',
        options: [
          { id: 'a', text: 'Complete beginner' },
          { id: 'b', text: 'Some background knowledge' },
          { id: 'c', text: 'Intermediate level' },
          { id: 'd', text: 'Advanced in related fields' },
        ],
      },
    ];

      const numQuestions = Math.floor(Math.random() * 4) + 3; // 3-6 questions
      return sampleQuestions.slice(0, numQuestions);
    }
  }

  /**
   * Generates a detailed lesson outline based on user's assessment responses
   * @param topic - The topic to teach
   * @param responses - User's answers to assessment questions
   * @param questions - The original questions (for context)
   * @returns Detailed lesson outline with sections and subsections
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
3. Builds concepts progressively
4. Includes only the most relevant subsections needed

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
      "subsections": [
        {
          "id": "section1_sub1",
          "title": "Subsection Title",
          "description": "Detailed description of this subsection (2-3 sentences explaining what will be taught and why it's important)",
          "estimatedDuration": "2 minutes"
        }
      ]
    }
  ]
}

Guidelines:
- Create as many sections as needed (no fixed number - could be 2, 3, 4, or more)
- Each section can have any number of subsections (even just 1 if that's all that's needed)
- Each subsection will have its own whiteboard content, so make them focused and specific
- Keep subsection durations SMALL - typically 2-4 minutes, sometimes even 1-2 minutes for simple concepts
- Keep the outline no deeper than 2 levels (sections → subsections)
- Use clear, descriptive titles
- Descriptions should explain what will be covered and how
- Break down complex topics into smaller, bite-sized subsections
- Progress from fundamentals to more complex concepts
- Tailor the depth and pace to the student's knowledge level
- Quality over quantity - only include what's necessary for understanding
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

      // Fallback outline
      return {
        topic,
        overallObjective: `Learn the fundamentals of ${topic}`,
        knowledgeLevel: 'beginner',
        totalEstimatedDuration: '15-20 minutes',
        sections: [
          {
            id: 'section1',
            title: 'Introduction',
            description: `Understanding the basics of ${topic}`,
            subsections: [
              {
                id: 'section1_sub1',
                title: 'What is it?',
                description: `Learn the fundamental definition and purpose of ${topic}`,
                estimatedDuration: '3 minutes',
              },
              {
                id: 'section1_sub2',
                title: 'Why is it important?',
                description: `Understand the real-world applications and benefits`,
                estimatedDuration: '2 minutes',
              },
            ],
          },
          {
            id: 'section2',
            title: 'Core Concepts',
            description: `Key principles and concepts of ${topic}`,
            subsections: [
              {
                id: 'section2_sub1',
                title: 'Fundamental Principles',
                description: `Explore the basic principles that govern ${topic}`,
                estimatedDuration: '4 minutes',
              },
              {
                id: 'section2_sub2',
                title: 'Practical Examples',
                description: `See how these concepts apply in real scenarios`,
                estimatedDuration: '3 minutes',
              },
            ],
          },
          {
            id: 'section3',
            title: 'Getting Started',
            description: `Practical steps to begin working with ${topic}`,
            subsections: [
              {
                id: 'section3_sub1',
                title: 'First Steps',
                description: `Learn how to get started with ${topic} in practice`,
                estimatedDuration: '3 minutes',
              },
            ],
          },
        ],
      };
    }
  }

  /**
   * Generates whiteboard content for a specific subsection
   * @param topic - The main topic
   * @param subsectionTitle - Title of the subsection
   * @param subsectionDescription - Description of what to teach
   * @param estimatedDuration - Duration string (e.g., "3 minutes")
   * @returns Whiteboard content with drawings and captions
   */
  async generateWhiteboardContent(
    topic: string,
    subsectionTitle: string,
    subsectionDescription: string,
    estimatedDuration: string
  ): Promise<WhiteboardContent> {
    try {
      // Parse duration to seconds
      const durationMatch = estimatedDuration.match(/(\d+)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 3;
      const totalDurationSeconds = durationMinutes * 60;

      const prompt = `
You are an expert AI tutor creating animated whiteboard content for teaching.

Topic: "${topic}"
Subsection: "${subsectionTitle}"
What to Teach: "${subsectionDescription}"
Duration: ${estimatedDuration} (${totalDurationSeconds} seconds)

Create detailed whiteboard content with drawings and captions that will be animated over time.

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks):

{
  "totalDuration": ${totalDurationSeconds},
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

GUIDELINES:
- Start with a title (text) for the subsection at the top
- Create visual explanations using appropriate drawing types
- Time drawings to appear progressively (timestamps spread throughout duration)
- Each drawing should have a duration (0.3-0.8 seconds for animation)
- Space timestamps appropriately (don't crowd multiple drawings at same time)
- Use colors effectively: blue (#2563eb) for titles, green (#059669) for main content, red (#dc2626) for emphasis
- Create 8-15 drawings depending on complexity
- Generate captions that narrate what's being shown
- Captions should cover most of the total duration with small gaps
- Each caption should last 2-4 seconds
- Generate ${Math.ceil(totalDurationSeconds / 3)} to ${Math.ceil(totalDurationSeconds / 2)} captions
- Caption timestamps should align roughly with related drawings
- Use position: "bottom" for all captions unless specified
- Make content educational, clear, and well-paced
- Build concepts step by step
- Use visual aids (arrows, highlights, labels) to emphasize key points

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
        subsectionId: '', // Will be set by controller
        subsectionTitle,
        topic,
        totalDuration: content.totalDuration || totalDurationSeconds,
        drawings: content.drawings || [],
        captions: content.captions || [],
      };
    } catch (error) {
      console.error('Error generating whiteboard content:', error);

      // Fallback content
      const durationMatch = estimatedDuration.match(/(\d+)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 3;
      const totalDurationSeconds = durationMinutes * 60;

      return {
        subsectionId: '',
        subsectionTitle,
        topic,
        totalDuration: totalDurationSeconds,
        drawings: [
          {
            timestamp: 0,
            type: 'text',
            start: { x: 250, y: 50 },
            text: subsectionTitle,
            fontSize: 28,
            color: '#2563eb',
            lineWidth: 2,
            duration: 0.5,
          },
          {
            timestamp: 2,
            type: 'text',
            start: { x: 100, y: 150 },
            text: 'Content is being prepared...',
            fontSize: 20,
            color: '#1f2937',
            lineWidth: 2,
            duration: 0.5,
          },
        ],
        captions: [
          {
            timestamp: 0,
            text: `Let's learn about ${subsectionTitle}`,
            duration: 3,
            position: 'bottom',
          },
          {
            timestamp: 3,
            text: subsectionDescription,
            duration: 4,
            position: 'bottom',
          },
        ],
      };
    }
  }
}

export default new AIService();
export type {
  AssessmentQuestion,
  MCQOption,
  LessonOutline,
  LessonSection,
  LessonSubsection,
  WhiteboardContent,
  DrawingInstruction,
  CaptionSegment,
  Point,
};
