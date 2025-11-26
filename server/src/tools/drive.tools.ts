/**
 * LangChain tools for Google Drive integration
 * These tools are used by the ReAct agent to interact with Google Drive files
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import * as classroomService from '../services/classroom.service';

/**
 * Tool: Get Drive file metadata
 */
export const createGetFileInfoTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'get_file_info',
    description: `Gets detailed metadata about a Google Drive file.
    Use this tool to:
    - Get file name, type, size, and other properties
    - Check file ownership and permissions
    - Get file creation and modification dates
    - Verify file existence before generating download URL
    
    Input: Google Drive file ID (can be obtained from assignment materials, course materials, or announcements)
    Returns: File metadata including id, name, mimeType, size, owners, creation time, etc.`,
    schema: z.object({
      fileId: z.string().describe('The Google Drive file ID'),
    }),
    func: async ({ fileId }) => {
      try {
        const result = await classroomService.getDriveFile(userId, fileId);
        return JSON.stringify(result.data, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Tool: Generate temporary authenticated download URL for a Drive file
 */
export const createGenerateDownloadUrlTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'generate_download_url',
    description: `Generates a temporary authenticated download URL for a Google Drive file.
    Use this tool when:
    - User wants to download or access a file
    - User asks to "fetch" or "get" lecture slides, documents, or other materials
    - User needs to view file content
    
    Important: 
    - The generated URL is temporary and expires in 1 hour
    - For Google Workspace files (Docs, Sheets, Slides), the file will be auto-exported to appropriate format (PDF for Docs/Slides, Excel for Sheets)
    - Include this URL in your response so the frontend can create a download button
    
    Input: Google Drive file ID (can be obtained from assignment/course materials)
    Returns: Complete file information including downloadUrl, name, mimeType, size, and other metadata.
    
    The downloadUrl in the response should be presented to the user for downloading.`,
    schema: z.object({
      fileId: z.string().describe('The Google Drive file ID to generate download URL for'),
    }),
    func: async ({ fileId }) => {
      try {
        const result = await classroomService.generateTemporaryFileUrl(userId, fileId);
        return JSON.stringify(result.data, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Tool: Batch generate download URLs for multiple files
 */
export const createBatchGenerateDownloadUrlsTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'batch_generate_download_urls',
    description: `Generates temporary authenticated download URLs for multiple Google Drive files at once.
    Use this tool when:
    - User wants to download multiple files from an assignment or course material
    - An assignment or material has multiple file attachments
    - User asks for "all files" or "all materials" from a specific item
    
    This is more efficient than calling generate_download_url multiple times.
    
    Input: Array of Google Drive file IDs
    Returns: Array of file objects, each with downloadUrl, name, mimeType, size, and metadata.`,
    schema: z.object({
      fileIds: z.array(z.string()).describe('Array of Google Drive file IDs to generate download URLs for'),
    }),
    func: async ({ fileIds }) => {
      try {
        const results = await Promise.all(
          fileIds.map(async (fileId) => {
            try {
              const result = await classroomService.generateTemporaryFileUrl(userId, fileId);
              return result.data;
            } catch (error: any) {
              return {
                id: fileId,
                error: error.message,
              };
            }
          })
        );
        return JSON.stringify(results, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Helper function to create all drive tools at once
 */
export const createAllDriveTools = (userId: string) => {
  return [
    createGetFileInfoTool(userId),
    createGenerateDownloadUrlTool(userId),
    createBatchGenerateDownloadUrlsTool(userId),
  ];
};
