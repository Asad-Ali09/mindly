import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import config from '../config/config';
import animationsCfg from '../constants/animations.json';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

/**
 * Interface for a single caption segment in the lesson
 */
interface CaptionSegment {
  timestamp: number; // Time in seconds when this caption should appear
  text: string; // The text content of the caption
  duration: number; // How long to display this caption (in seconds)
  position: 'bottom' | 'top' | 'middle'; // Position on screen
}

/**
 * Interface for avatar animation
 */
interface AvatarAnimation {
  id: string; // Animation ID from animations.json
  name: string; // Human-readable name
  start: number; // Start time in seconds
  duration: number; // Duration in seconds
  loop: boolean; // Whether animation should loop
}

/**
 * Interface for a single lesson page
 */
interface LessonPage {
  pageNumber: number;
  title: string;
  totalDuration: number; // Total duration in seconds
  captions: CaptionSegment[];
  animations: AvatarAnimation[];
}

/**
 * Interface for the input to generate lesson content
 */
interface GenerateLessonPageInput {
  pageNumber: number;
  imageUrl?: string; // URL to the page image
  imageBase64?: string; // Base64 encoded image
  lessonTitle: string; // Overall lesson title for context
  additionalContext?: string; // Any additional context or instructions
}

/**
 * Service for generating lesson content from page images using AI
 */
class LessonGeneratorService {
  private model: ChatOpenAI;
  private visionModel: ChatOpenAI | ChatGoogleGenerativeAI;

  constructor() {
    // Standard text model
    this.model = new ChatOpenAI({
      apiKey: config.openRouterApiKey,
      modelName: config.openRouterModel,
      temperature: 0.7,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    // Vision-capable model for image analysis
    // this.visionModel = new ChatOpenAI({
    //   apiKey: config.openRouterApiKey,
    //   modelName: 'google/gemini-2.0-flash-exp:free', // Vision-capable model
    //   temperature: 0.7,
    //   configuration: {
    //     baseURL: 'https://openrouter.ai/api/v1',
    //   },
    // });

    this.visionModel = new ChatGoogleGenerativeAI({
      model: config.geminiAIModel,
      apiKey: config.geminiApiKey,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
  }

  /**
   * Get list of available animations
   */
  private getAvailableAnimations(): string[] {
    return Object.keys(animationsCfg);
  }

  /**
   * Generate lesson content for a single page
   * @param input - Input data including page image and context
   * @returns Generated lesson page with captions and animations
   */
  async generateLessonPage(input: GenerateLessonPageInput): Promise<LessonPage> {
    try {
      const { pageNumber, imageUrl, imageBase64, lessonTitle, additionalContext } = input;

      if (!imageUrl && !imageBase64) {
        throw new Error('Either imageUrl or imageBase64 must be provided');
      }

      const systemPrompt = `You are an expert educational content creator specializing in creating engaging lesson content for an AI-powered teaching platform.

PLATFORM CONTEXT:
- A 3D AI teacher avatar presents lessons to students
- The avatar speaks narration while showing slides/content
- Animations make the avatar more engaging and natural
- Each page has synchronized captions and avatar animations

YOUR TASK:
Analyze the provided page image and generate educational content including:
1. A descriptive title for the page
2. Natural, conversational narration split into caption segments
3. Synchronized avatar animations that match the narration

CAPTION GUIDELINES:
- Each caption should be 6-10 seconds of natural speech
- Write conversationally as if the teacher is speaking directly to the student
- Break content into digestible segments
- Use transitions between ideas
- Make it engaging and easy to understand
- Total page duration should be 35-50 seconds

ANIMATION GUIDELINES:
- Available animations: ${animationsCfg}
- Use "waving-1" or "waving-2" for greetings/introductions
- Use "talking-1" or "talking-2" for main narration
- Use "breathing-idle" for brief pauses between talking segments (0.2 seconds)
- Use gesture animations like "hands-forward-gesture", "explaining", "agreeing" to emphasize points
- Animations should align naturally with caption timestamps
- Ensure smooth transitions between animations

TIMING RULES:
- Start first animation at timestamp 0
- Add 0.2 second breathing-idle between talking animations
- Talking animations typically last 5-10 seconds
- Gesture animations are typically 3-4 seconds
- Total duration should accommodate all captions with natural pacing

OUTPUT FORMAT:
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "pageNumber": <number>,
  "title": "<descriptive page title>",
  "totalDuration": <total seconds as number>,
  "captions": [
    {
      "timestamp": <number>,
      "text": "<narration text>",
      "duration": <number>,
      "position": "bottom"
    }
  ],
  "animations": [
    {
      "id": "<animation-id>",
      "name": "<Animation Name>",
      "start": <number>,
      "duration": <number>,
      "loop": <boolean>
    }
  ]
}`;

      const userPrompt = `Generate lesson content for page ${pageNumber} of the lesson: "${lessonTitle}"
${additionalContext ? `\nAdditional context: ${additionalContext}` : ''}

Analyze the page image and create engaging educational content with synchronized captions and animations.`;

      // Prepare image content
      let imageContent: {
        type: 'image_url';
        image_url: {
          url: string;
        };
      };

      if (imageBase64) {
        // Handle base64 image
        const imageData = imageBase64.startsWith('data:') 
          ? imageBase64 
          : `data:image/jpeg;base64,${imageBase64}`;
        imageContent = {
          type: 'image_url' as const,
          image_url: {
            url: imageData,
          },
        };
      } else if (imageUrl) {
        // Handle image URL
        imageContent = {
          type: 'image_url' as const,
          image_url: {
            url: imageUrl,
          },
        };
      } else {
        throw new Error('Either imageUrl or imageBase64 must be provided');
      }

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage({
          content: [
            {
              type: 'text' as const,
              text: userPrompt,
            },
            imageContent,
          ],
        }),
      ];

      const response = await this.visionModel.invoke(messages);
      const content = response.content.toString();

      // Clean and parse the response
      let cleanedContent = content.trim();
      
      // Remove markdown code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const lessonPage: LessonPage = JSON.parse(cleanedContent);

      // Validate the structure
      this.validateLessonPage(lessonPage);

      return lessonPage;
    } catch (error) {
      console.error('Error generating lesson page:', error);
      throw new Error(`Failed to generate lesson page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate the generated lesson page structure
   */
  private validateLessonPage(page: LessonPage): void {
    if (!page.pageNumber || typeof page.pageNumber !== 'number') {
      throw new Error('Invalid or missing pageNumber');
    }
    if (!page.title || typeof page.title !== 'string') {
      throw new Error('Invalid or missing title');
    }
    if (!page.totalDuration || typeof page.totalDuration !== 'number') {
      throw new Error('Invalid or missing totalDuration');
    }
    if (!Array.isArray(page.captions) || page.captions.length === 0) {
      throw new Error('Captions must be a non-empty array');
    }
    if (!Array.isArray(page.animations) || page.animations.length === 0) {
      throw new Error('Animations must be a non-empty array');
    }

    // Validate each caption
    page.captions.forEach((caption, index) => {
      if (typeof caption.timestamp !== 'number') {
        throw new Error(`Caption ${index}: invalid timestamp`);
      }
      if (!caption.text || typeof caption.text !== 'string') {
        throw new Error(`Caption ${index}: invalid text`);
      }
      if (typeof caption.duration !== 'number') {
        throw new Error(`Caption ${index}: invalid duration`);
      }
      if (!['bottom', 'top', 'middle'].includes(caption.position)) {
        throw new Error(`Caption ${index}: invalid position`);
      }
    });

    // Validate each animation
    page.animations.forEach((animation, index) => {
      if (!animation.id || typeof animation.id !== 'string') {
        throw new Error(`Animation ${index}: invalid id`);
      }
      if (!animation.name || typeof animation.name !== 'string') {
        throw new Error(`Animation ${index}: invalid name`);
      }
      if (typeof animation.start !== 'number') {
        throw new Error(`Animation ${index}: invalid start time`);
      }
      if (typeof animation.duration !== 'number') {
        throw new Error(`Animation ${index}: invalid duration`);
      }
      if (typeof animation.loop !== 'boolean') {
        throw new Error(`Animation ${index}: invalid loop value`);
      }
    });
  }

  /**
   * Generate multiple pages sequentially
   * @param inputs - Array of input data for multiple pages
   * @returns Array of generated lesson pages
   */
  async generateMultiplePages(inputs: GenerateLessonPageInput[]): Promise<LessonPage[]> {
    const pages: LessonPage[] = [];
    
    for (const input of inputs) {
      try {
        const page = await this.generateLessonPage(input);
        pages.push(page);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating page ${input.pageNumber}:`, error);
        throw error;
      }
    }

    return pages;
  }

  /**
   * Generate a complete lesson structure from multiple pages
   * @param lessonTitle - The overall lesson title
   * @param inputs - Array of input data for all pages
   * @returns Complete lesson object with all pages
   */
  async generateCompleteLesson(
    lessonTitle: string,
    inputs: GenerateLessonPageInput[]
  ): Promise<{
    lessonTitle: string;
    totalPages: number;
    startingPage: number;
    pages: LessonPage[];
  }> {
    const pages = await this.generateMultiplePages(inputs);

    return {
      lessonTitle,
      totalPages: pages.length,
      startingPage: 1,
      pages,
    };
  }
}

export default new LessonGeneratorService();
