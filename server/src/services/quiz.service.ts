import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

class QuizService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Generate quiz questions for a specific section of a lesson
   */
  async generateQuizQuestions(
    topic: string,
    section: any,
    knowledgeLevel: string
  ): Promise<QuizQuestion[]> {
    try {
      const prompt = `
You are an expert educator creating quiz questions to test understanding of a lesson section.

LESSON CONTEXT:
- Overall Topic: ${topic}
- Knowledge Level: ${knowledgeLevel}
- Section Title: ${section.title}
- Section Description: ${section.description}
- Section Pages: ${JSON.stringify(section.pages, null, 2)}

QUIZ REQUIREMENTS:
1. Generate 10 multiple-choice questions that test understanding of THIS SECTION ONLY
2. Questions should be appropriate for ${knowledgeLevel} level learners
3. Each question should have exactly 4 options (A, B, C, D)
4. Only ONE option should be correct
5. Include a brief explanation for the correct answer
6. Questions should cover different concepts/topics from the section
7. Mix of difficulty levels (easy, medium, hard)
8. Questions should test both conceptual understanding and application

QUESTION TYPES TO INCLUDE:
- Conceptual understanding (30%)
- Application of concepts (30%)
- Problem-solving (20%)
- Definition/terminology (10%)
- Comparison/contrast (10%)

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correctAnswer": "Exact text of correct option",
      "explanation": "Brief explanation of why this is correct and why others are wrong"
    }
  ]
}

IMPORTANT:
- Make questions specific to the section content
- Avoid questions that require knowledge from other sections
- Ensure correctAnswer matches EXACTLY one of the options
- Keep questions clear and unambiguous
- Explanations should be educational and helpful
- Vary question formats (direct questions, scenarios, "what if" questions)
- Ensure distractors (wrong answers) are plausible but clearly incorrect

Generate the quiz now:
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const quizData = JSON.parse(cleanedText);

      // Validate and return questions
      const questions: QuizQuestion[] = quizData.questions || [];
      
      // Ensure each question has all required fields
      questions.forEach((q, index) => {
        if (!q.id) q.id = `q${index + 1}`;
        if (!q.question) throw new Error(`Question ${index + 1} is missing question text`);
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }
        if (!q.correctAnswer) throw new Error(`Question ${index + 1} is missing correct answer`);
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(`Question ${index + 1}: correctAnswer must match one of the options`);
        }
      });

      return questions;
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      throw error;
    }
  }

  /**
   * Validate quiz answers and calculate score
   */
  validateQuizAnswers(
    questions: QuizQuestion[],
    userAnswers: Record<string, string>
  ): {
    score: number;
    totalQuestions: number;
    percentage: number;
    results: Array<{
      questionId: string;
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation?: string;
    }>;
  } {
    let correctCount = 0;
    const results = questions.map((q) => {
      const userAnswer = userAnswers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      
      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        question: q.question,
        userAnswer: userAnswer || 'No answer provided',
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    return {
      score: correctCount,
      totalQuestions: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
      results,
    };
  }

  /**
   * Generate a detailed performance report
   */
  generatePerformanceReport(
    score: number,
    totalQuestions: number,
    knowledgeLevel: string
  ): {
    grade: string;
    feedback: string;
    recommendations: string[];
  } {
    const percentage = (score / totalQuestions) * 100;
    let grade: string;
    let feedback: string;
    let recommendations: string[] = [];

    if (percentage >= 90) {
      grade = 'A+';
      feedback = 'Excellent! You have a strong understanding of this section.';
      recommendations = [
        'You\'re ready to move to the next section',
        'Consider helping others understand this topic',
        'Try more advanced problems to deepen your knowledge',
      ];
    } else if (percentage >= 80) {
      grade = 'A';
      feedback = 'Great job! You have a good grasp of the material.';
      recommendations = [
        'Review the questions you missed',
        'You\'re ready to proceed to the next section',
        'Consider revisiting any challenging concepts',
      ];
    } else if (percentage >= 70) {
      grade = 'B';
      feedback = 'Good work! You understand most of the concepts.';
      recommendations = [
        'Review the questions you missed',
        'Revisit the lesson pages for topics you struggled with',
        'Try the quiz again after reviewing',
      ];
    } else if (percentage >= 60) {
      grade = 'C';
      feedback = 'Fair performance. You may need to review some concepts.';
      recommendations = [
        'Go back and review the lesson section',
        'Focus on the topics where you had incorrect answers',
        'Take notes while reviewing',
        'Retake the quiz after studying',
      ];
    } else {
      grade = 'D';
      feedback = 'You may need to spend more time on this section.';
      recommendations = [
        'Carefully review the entire section',
        'Take detailed notes on key concepts',
        'Ask for help if you\'re struggling with specific topics',
        'Practice with additional examples',
        'Retake the quiz after thorough review',
      ];
    }

    return { grade, feedback, recommendations };
  }
}

export default new QuizService();
export type { QuizQuestion };
