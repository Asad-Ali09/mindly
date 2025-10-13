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

class AIService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-2.0' });
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
}

export default new AIService();
export type { AssessmentQuestion, MCQOption, LessonOutline, LessonSection, LessonSubsection };
