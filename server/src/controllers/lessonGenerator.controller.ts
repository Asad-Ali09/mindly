import { Request, Response } from 'express';
import lessonGeneratorService from '../services/lessonGenerator.service';

/**
 * Controller for lesson generation endpoints
 */
class LessonGeneratorController {
  /**
   * Generate content for a single lesson page
   * POST /api/lesson-generator/generate-page
   * 
   * Body: {
   *   pageNumber: number,
   *   lessonTitle: string,
   *   imageUrl?: string,
   *   imageBase64?: string,
   *   additionalContext?: string
   * }
   */
  async generatePage(req: Request, res: Response): Promise<void> {
    try {
      const { pageNumber, lessonTitle, imageUrl, imageBase64, additionalContext } = req.body;

      // Validation
      if (!pageNumber || typeof pageNumber !== 'number') {
        res.status(400).json({ 
          success: false, 
          error: 'pageNumber is required and must be a number' 
        });
        return;
      }

      if (!lessonTitle || typeof lessonTitle !== 'string') {
        res.status(400).json({ 
          success: false, 
          error: 'lessonTitle is required and must be a string' 
        });
        return;
      }

      if (!imageUrl && !imageBase64) {
        res.status(400).json({ 
          success: false, 
          error: 'Either imageUrl or imageBase64 must be provided' 
        });
        return;
      }

      // Generate lesson page
      const lessonPage = await lessonGeneratorService.generateLessonPage({
        pageNumber,
        lessonTitle,
        imageUrl,
        imageBase64,
        additionalContext,
      });

      res.status(200).json({
        success: true,
        data: lessonPage,
      });
    } catch (error) {
      console.error('Error in generatePage controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate lesson page',
      });
    }
  }

  /**
   * Generate content for multiple lesson pages
   * POST /api/lesson-generator/generate-multiple-pages
   * 
   * Body: {
   *   pages: Array<{
   *     pageNumber: number,
   *     imageUrl?: string,
   *     imageBase64?: string,
   *     additionalContext?: string
   *   }>,
   *   lessonTitle: string
   * }
   */
  async generateMultiplePages(req: Request, res: Response): Promise<void> {
    try {
      const { pages, lessonTitle } = req.body;

      // Validation
      if (!lessonTitle || typeof lessonTitle !== 'string') {
        res.status(400).json({ 
          success: false, 
          error: 'lessonTitle is required and must be a string' 
        });
        return;
      }

      if (!Array.isArray(pages) || pages.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'pages must be a non-empty array' 
        });
        return;
      }

      // Validate each page input
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page.pageNumber || typeof page.pageNumber !== 'number') {
          res.status(400).json({ 
            success: false, 
            error: `Page ${i}: pageNumber is required and must be a number` 
          });
          return;
        }
        if (!page.imageUrl && !page.imageBase64) {
          res.status(400).json({ 
            success: false, 
            error: `Page ${i}: Either imageUrl or imageBase64 must be provided` 
          });
          return;
        }
      }

      // Add lessonTitle to each page input
      const pageInputs = pages.map((page: any) => ({
        ...page,
        lessonTitle,
      }));

      // Generate all pages
      const generatedPages = await lessonGeneratorService.generateMultiplePages(pageInputs);

      res.status(200).json({
        success: true,
        data: generatedPages,
      });
    } catch (error) {
      console.error('Error in generateMultiplePages controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate lesson pages',
      });
    }
  }

  /**
   * Generate a complete lesson with all pages
   * POST /api/lesson-generator/generate-lesson
   * 
   * Body: {
   *   lessonTitle: string,
   *   pages: Array<{
   *     pageNumber: number,
   *     imageUrl?: string,
   *     imageBase64?: string,
   *     additionalContext?: string
   *   }>
   * }
   */
  async generateCompleteLesson(req: Request, res: Response): Promise<void> {
    try {
      const { lessonTitle, pages } = req.body;

      // Validation
      if (!lessonTitle || typeof lessonTitle !== 'string') {
        res.status(400).json({ 
          success: false, 
          error: 'lessonTitle is required and must be a string' 
        });
        return;
      }

      if (!Array.isArray(pages) || pages.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'pages must be a non-empty array' 
        });
        return;
      }

      // Validate each page input
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page.pageNumber || typeof page.pageNumber !== 'number') {
          res.status(400).json({ 
            success: false, 
            error: `Page ${i}: pageNumber is required and must be a number` 
          });
          return;
        }
        if (!page.imageUrl && !page.imageBase64) {
          res.status(400).json({ 
            success: false, 
            error: `Page ${i}: Either imageUrl or imageBase64 must be provided` 
          });
          return;
        }
      }

      // Add lessonTitle to each page input
      const pageInputs = pages.map((page: any) => ({
        ...page,
        lessonTitle,
      }));

      // Generate complete lesson
      const lesson = await lessonGeneratorService.generateCompleteLesson(
        lessonTitle,
        pageInputs
      );

      res.status(200).json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      console.error('Error in generateCompleteLesson controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate complete lesson',
      });
    }
  }
}

export default new LessonGeneratorController();
