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
   * Process a query with streaming response
   */
  async processQueryStream(
    request: AgentQueryRequest,
    onChunk: (chunk: {
      type: 'content' | 'thinking' | 'files' | 'error';
      content?: string;
      action?: string;
      args?: any;
      files?: FileAttachment[];
      error?: string;
    }) => void
  ): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const url = `${apiUrl}/agent/query-stream`;
      
      console.log('Streaming to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming error response:', errorText);
        throw new Error(`Failed to start streaming: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const chunk = JSON.parse(data);
              onChunk(chunk);
            } catch (e) {
              console.error('Failed to parse chunk:', data, e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Stream error:', error);
      throw new Error(
        error.message || 'Failed to process streaming query'
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
