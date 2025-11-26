/**
 * ReAct Agent Service
 * Intelligent agent that can interact with Google Classroom and Drive using LangGraph
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import config from '../config/config';
import { createAllClassroomTools } from '../tools/classroom.tools';
import { createAllDriveTools } from '../tools/drive.tools';
import { ConversationMessage, AgentResponse, FileAttachment } from '../types/agent.types';

class AgentService {
  private model: ChatGoogleGenerativeAI;

  constructor() {
    // Initialize Google Gemini model
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: config.geminiApiKey,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
  }

  /**
   * Process a user query using the ReAct agent with streaming
   * @param userId - The user's MongoDB ID
   * @param query - The user's question or request
   * @param history - Optional conversation history from client
   * @param onChunk - Callback function to handle each streaming chunk
   */
  async processQueryStream(
    userId: string,
    query: string,
    history: ConversationMessage[] = [],
    onChunk: (chunk: any) => void
  ): Promise<void> {
    try {
      console.log('Agent service: Starting stream processing for user:', userId);
      
      // Create tools with user context
      const classroomTools = createAllClassroomTools(userId);
      const driveTools = createAllDriveTools(userId);
      const allTools = [...classroomTools, ...driveTools];

      console.log('Agent service: Created', allTools.length, 'tools');

      // Create the ReAct agent with streaming enabled
      const agent = createReactAgent({
        llm: this.model,
        tools: allTools,
      });

      console.log('Agent service: Agent created');

      // Convert conversation history to LangChain message format
      const messages: BaseMessage[] = [];
      
      // Add system message with current date context
      const systemPrompt = `You are a helpful AI assistant that helps students manage their Google Classroom coursework and materials.
Current date: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD)

Guidelines:
1. When users ask about dates like "tomorrow" or "this week", calculate the actual dates
2. For date-based queries, use ISO format (YYYY-MM-DD) in tool parameters
3. When mentioning files or materials with download capabilities, ALWAYS use generate_download_url tool to create downloadable links
4. Extract and organize file information clearly in your response
5. Be conversational and helpful, explain what you found
6. If you need to search for something, start by listing courses to find the right course ID
7. For course-specific queries, first search for the course by name if you don't have the ID
8. When presenting assignments, include: title, due date, submission status if available
9. When presenting files, mention their names and that they can be downloaded via the provided backend URL

Important: When you find files that users might want to access (from assignments, materials, or announcements), 
proactively use the generate_download_url or batch_generate_download_urls tool to create download links for them.
The download URLs are backend endpoints that will be authenticated with the user's JWT token on the frontend.`;

      messages.push(new HumanMessage(systemPrompt));

      // Add conversation history
      for (const msg of history) {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else {
          messages.push(new AIMessage(msg.content));
        }
      }

      // Add current query
      messages.push(new HumanMessage(query));

      console.log('Agent service: Starting agent stream with', messages.length, 'messages');

      // Execute the agent with streaming using streamEvents for token-level streaming
      const stream = agent.streamEvents(
        { messages },
        { version: 'v2' }
      );

      console.log('Agent service: Stream started');

      let fullAnswer = '';
      const allMessages: BaseMessage[] = [];
      let chunkCount = 0;

      for await (const event of stream) {
        chunkCount++;
        
        // Handle streaming tokens from the LLM
        if (event.event === 'on_chat_model_stream') {
          const chunk = event.data?.chunk;
          if (chunk && 'content' in chunk && typeof chunk.content === 'string' && chunk.content) {
            console.log('Agent service: Streaming token chunk:', chunk.content);
            
            fullAnswer += chunk.content;
            
            onChunk({
              type: 'content',
              content: chunk.content,
            });
          }
        }
        
        // Handle tool calls
        if (event.event === 'on_tool_start') {
          const toolName = event.name;
          const toolInput = event.data?.input;
          
          console.log('Agent service: Tool call:', toolName);
          
          onChunk({
            type: 'thinking',
            action: toolName,
            args: toolInput,
          });
        }
        
        // Collect all messages for file extraction
        if (event.event === 'on_chat_model_end' || event.event === 'on_tool_end') {
          const output = event.data?.output;
          if (output && typeof output === 'object' && 'messages' in output) {
            const msgs = output.messages as BaseMessage[];
            if (Array.isArray(msgs)) {
              allMessages.push(...msgs);
            }
          }
        }
      }

      console.log('Agent service: Stream iteration complete. Total chunks:', chunkCount, 'Total content length:', fullAnswer.length);

      // Extract file attachments from all messages
      const files = this.extractFileAttachments(allMessages);

      console.log('Agent service: Extracted', files.length, 'files');

      // Send files if any
      if (files.length > 0) {
        onChunk({
          type: 'files',
          files,
        });
      }

      console.log('Agent service: Stream processing complete');

    } catch (error: any) {
      console.error('Error in agent query streaming:', error);
      throw error;
    }
  }

  /**
   * Process a user query using the ReAct agent
   * @param userId - The user's MongoDB ID
   * @param query - The user's question or request
   * @param history - Optional conversation history from client
   * @returns Structured response with answer and file attachments
   */
  async processQuery(
    userId: string,
    query: string,
    history: ConversationMessage[] = []
  ): Promise<AgentResponse> {
    try {
      // Create tools with user context
      const classroomTools = createAllClassroomTools(userId);
      const driveTools = createAllDriveTools(userId);
      const allTools = [...classroomTools, ...driveTools];

      // Create the ReAct agent
      const agent = createReactAgent({
        llm: this.model,
        tools: allTools,
      });

      // Convert conversation history to LangChain message format
      const messages: BaseMessage[] = [];
      
      // Add system message with current date context
      const systemPrompt = `You are a helpful AI assistant that helps students manage their Google Classroom coursework and materials.
Current date: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD)

Guidelines:
1. When users ask about dates like "tomorrow" or "this week", calculate the actual dates
2. For date-based queries, use ISO format (YYYY-MM-DD) in tool parameters
3. When mentioning files or materials with download capabilities, ALWAYS use generate_download_url tool to create downloadable links
4. Extract and organize file information clearly in your response
5. Be conversational and helpful, explain what you found
6. If you need to search for something, start by listing courses to find the right course ID
7. For course-specific queries, first search for the course by name if you don't have the ID
8. When presenting assignments, include: title, due date, submission status if available
9. When presenting files, mention their names and that they can be downloaded via the provided backend URL

Important: When you find files that users might want to access (from assignments, materials, or announcements), 
proactively use the generate_download_url or batch_generate_download_urls tool to create download links for them.
The download URLs are backend endpoints that will be authenticated with the user's JWT token on the frontend.`;

      messages.push(new HumanMessage(systemPrompt));

      // Add conversation history
      for (const msg of history) {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else {
          messages.push(new AIMessage(msg.content));
        }
      }

      // Add current query
      messages.push(new HumanMessage(query));

      // Execute the agent
      const response = await agent.invoke({
        messages,
      });

      // Extract the final answer from the agent's response
      const agentMessages = response.messages;
      const lastMessage = agentMessages[agentMessages.length - 1];
      let answer = '';

      if ('content' in lastMessage) {
        answer = typeof lastMessage.content === 'string' 
          ? lastMessage.content 
          : JSON.stringify(lastMessage.content);
      }

      // Extract file attachments from tool calls in the conversation
      const files = this.extractFileAttachments(agentMessages);

      // Extract intermediate thoughts (tool calls and observations) for debugging
      const thoughts = this.extractThoughts(agentMessages);

      return {
        success: true,
        answer,
        files: files.length > 0 ? files : undefined,
        thoughts: thoughts.length > 0 ? thoughts : undefined,
      };
    } catch (error: any) {
      console.error('Error in agent query processing:', error);
      return {
        success: false,
        answer: '',
        error: error.message || 'Failed to process query',
      };
    }
  }

  /**
   * Extract file attachments from agent tool calls
   * Looks for generate_download_url and batch_generate_download_urls tool results
   */
  private extractFileAttachments(messages: BaseMessage[]): FileAttachment[] {
    const files: FileAttachment[] = [];

    for (const message of messages) {
      // Check if this is a tool message with file download info
      if ('tool_calls' in message && message.tool_calls) {
        // This is being handled in the next message which contains the tool response
        continue;
      }

      // Check for tool responses in the content
      if ('content' in message && typeof message.content === 'string') {
        try {
          // Try to parse tool response that contains download URLs
          if (message.content.includes('downloadUrl')) {
            const parsed = JSON.parse(message.content);
            
            // Handle single file response
            if (parsed.id && parsed.downloadUrl) {
              files.push({
                id: parsed.id,
                name: parsed.name || 'Unknown',
                mimeType: parsed.mimeType || 'application/octet-stream',
                downloadUrl: parsed.downloadUrl,
                size: parsed.size ? parseInt(parsed.size) : undefined,
                description: parsed.description,
                createdTime: parsed.createdTime,
                modifiedTime: parsed.modifiedTime,
              });
            }
            
            // Handle array of files (batch response)
            if (Array.isArray(parsed)) {
              for (const file of parsed) {
                if (file.id && file.downloadUrl) {
                  files.push({
                    id: file.id,
                    name: file.name || 'Unknown',
                    mimeType: file.mimeType || 'application/octet-stream',
                    downloadUrl: file.downloadUrl,
                    size: file.size ? parseInt(file.size) : undefined,
                    description: file.description,
                    createdTime: file.createdTime,
                    modifiedTime: file.modifiedTime,
                  });
                }
              }
            }
          }
        } catch (e) {
          // Not JSON or doesn't contain file info, skip
        }
      }
    }

    // Remove duplicates based on file ID
    const uniqueFiles = files.filter((file, index, self) => 
      index === self.findIndex(f => f.id === file.id)
    );

    return uniqueFiles;
  }

  /**
   * Extract intermediate reasoning steps for debugging
   */
  private extractThoughts(messages: BaseMessage[]): string[] {
    const thoughts: string[] = [];

    for (const message of messages) {
      // Extract tool calls (agent's actions)
      if ('tool_calls' in message && message.tool_calls && Array.isArray(message.tool_calls)) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.name) {
            const args = toolCall.args ? JSON.stringify(toolCall.args) : '';
            thoughts.push(`Action: ${toolCall.name}${args ? ` with ${args}` : ''}`);
          }
        }
      }

      // Extract tool results (observations)
      if (message._getType() === 'tool' && 'content' in message) {
        const content = typeof message.content === 'string' 
          ? message.content 
          : JSON.stringify(message.content);
        
        // Truncate long observations
        const truncated = content.length > 200 
          ? content.substring(0, 200) + '...' 
          : content;
        thoughts.push(`Observation: ${truncated}`);
      }
    }

    return thoughts;
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple test to verify the model is accessible
      await this.model.invoke([new HumanMessage('Hello')]);
      return true;
    } catch (error) {
      console.error('Agent health check failed:', error);
      return false;
    }
  }
}

export default new AgentService();
