/**
 * Agent Controller
 * Handles HTTP requests for the ReAct agent
 */

import { Request, Response } from 'express';
import agentService from '../services/agent.service';
import { ConversationMessage } from '../types/agent.types';

/**
 * Process a user query with the ReAct agent
 * POST /api/agent/query
 * Body: { query: string, history?: ConversationMessage[] }
 */
export const processQuery = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { query, history } = req.body;

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query is required and must be a non-empty string',
      });
    }

    // Validate history if provided
    if (history && !Array.isArray(history)) {
      return res.status(400).json({
        success: false,
        message: 'History must be an array of conversation messages',
      });
    }

    // Validate each message in history
    if (history) {
      for (const msg of history) {
        if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid history format. Each message must have role (user/assistant) and content',
          });
        }
      }
    }

    // Process the query with the agent
    const result = await agentService.processQuery(
      userId.toString(),
      query.trim(),
      history || []
    );

    // Return the result
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in agent query controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process query',
      error: error.toString(),
    });
  }
};

/**
 * Health check endpoint for the agent service
 * GET /api/agent/health
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const isHealthy = await agentService.healthCheck();
    
    if (isHealthy) {
      res.json({
        success: true,
        message: 'Agent service is healthy',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Agent service is not responding properly',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error('Error in agent health check:', error);
    res.status(503).json({
      success: false,
      message: 'Agent service health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get agent capabilities and available tools
 * GET /api/agent/capabilities
 */
export const getCapabilities = async (req: Request, res: Response) => {
  try {
    const capabilities = {
      success: true,
      data: {
        description: 'ReAct Agent with Google Classroom and Drive integration',
        model: 'gemini-2.0-flash-exp',
        features: [
          'List and search courses',
          'Find assignments by date, course, or keyword',
          'Get detailed assignment information and submission status',
          'Access course materials and lecture slides',
          'Check course announcements',
          'Generate temporary download URLs for Drive files',
          'Batch download multiple files',
          'Natural language date parsing (tomorrow, this week, etc.)',
        ],
        tools: {
          classroom: [
            'list_courses - List all active courses',
            'get_course_info - Get detailed course information',
            'search_assignments - Search and filter assignments',
            'get_assignment_details - Get comprehensive assignment details',
            'list_course_materials - List course materials and resources',
            'get_announcements - Get course announcements',
            'get_all_coursework - Get all coursework across all courses',
          ],
          drive: [
            'get_file_info - Get Drive file metadata',
            'generate_download_url - Generate temporary download URL (1 hour expiry)',
            'batch_generate_download_urls - Generate URLs for multiple files',
          ],
        },
        exampleQueries: [
          'What assignments do I have due tomorrow?',
          'Explain me what is going on in ICC Classroom',
          'Fetch me the slides of Lecture 5 from IS Classroom',
          'What do I have to do in the last assignment of FSPM?',
          'Show me all materials in my Math class',
          'What are the upcoming deadlines this week?',
          'Get me the assignment details for the project in CS101',
        ],
        responseFormat: {
          success: 'boolean',
          answer: 'string - Natural language response',
          files: 'array - File attachments with download URLs (optional)',
          thoughts: 'array - Intermediate reasoning steps for debugging (optional)',
          error: 'string - Error message if failed (optional)',
        },
      },
    };

    res.json(capabilities);
  } catch (error: any) {
    console.error('Error getting agent capabilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agent capabilities',
      error: error.message,
    });
  }
};
