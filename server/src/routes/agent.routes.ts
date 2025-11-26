/**
 * Agent Routes
 * Routes for the ReAct agent endpoints
 */

import { Router } from 'express';
import { processQuery, healthCheck, getCapabilities } from '../controllers/agent.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all agent routes
router.use(authMiddleware);

/**
 * POST /api/agent/query
 * Process a user query with the ReAct agent
 * Body: { query: string, history?: ConversationMessage[] }
 */
router.post('/query', processQuery);

/**
 * GET /api/agent/health
 * Check if the agent service is healthy
 */
router.get('/health', healthCheck);

/**
 * GET /api/agent/capabilities
 * Get information about agent capabilities and available tools
 */
router.get('/capabilities', getCapabilities);

export default router;
