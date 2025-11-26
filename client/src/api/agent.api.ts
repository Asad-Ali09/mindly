import apiClient from './axios';

/**
 * Types for Agent API
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  downloadUrl: string;
  size?: number;
}

export interface AgentQueryRequest {
  query: string;
  history?: ConversationMessage[];
}

export interface AgentQueryResponse {
  success: boolean;
  answer: string;
  files?: FileAttachment[];
  thoughts?: string[];
  error?: string;
}

export interface AgentCapabilitiesResponse {
  success: boolean;
  data: {
    description: string;
    model: string;
    features: string[];
    tools: {
      classroom: string[];
      drive: string[];
    };
    exampleQueries: string[];
    responseFormat: {
      success: string;
      answer: string;
      files: string;
      thoughts: string;
      error: string;
    };
  };
}

export interface AgentHealthResponse {
  success: boolean;
  message: string;
  timestamp: string;
  error?: string;
}

/**
 * Agent API service for ReAct agent integration
 */
export class AgentApi {
  /**
   * Process a query with the ReAct agent
   */
  async processQuery(request: AgentQueryRequest): Promise<AgentQueryResponse> {
    try {
      const response = await apiClient.post('/agent/query', request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to process query'
      );
    }
  }

  /**
   * Check agent service health
   */
  async healthCheck(): Promise<AgentHealthResponse> {
    try {
      const response = await apiClient.get('/agent/health');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to check agent health'
      );
    }
  }

  /**
   * Get agent capabilities and available tools
   */
  async getCapabilities(): Promise<AgentCapabilitiesResponse> {
    try {
      const response = await apiClient.get('/agent/capabilities');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to get agent capabilities'
      );
    }
  }
}

// Export singleton instance
export const agentApi = new AgentApi();
export default agentApi;
