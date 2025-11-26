import apiClient from './axios';

export interface DocumentUploadResponse {
  success: boolean;
  data: {
    id: string;
    fileUrl?: string;
    images?: string[];
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'pptx' | 'image';
    createdAt: string;
  };
  message?: string;
}

export interface DocumentResponse {
  success: boolean;
  data: {
    id: string;
    fileUrl?: string;
    images?: string[];
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'pptx' | 'image';
    createdAt: string;
  };
  message?: string;
}

class DocumentApi {
  /**
   * Upload a document (PDF, PPTX, or Image)
   */
  async uploadDocument(file: File, fileType: 'pdf' | 'pptx' | 'image'): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    const response = await apiClient.post<DocumentUploadResponse>(
      '/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for large files
      }
    );

    return response.data;
  }

  /**
   * Delete an uploaded document
   */
  async deleteDocument(filename: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/documents/${filename}`
    );

    return response.data;
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<DocumentResponse> {
    const response = await apiClient.get<DocumentResponse>(`/documents/${id}`);
    return response.data;
  }
}

export default new DocumentApi();
