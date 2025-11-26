import apiClient from './axios';

export interface DocumentUploadResponse {
  success: boolean;
  data: {
    _id: string;
    userId: string;
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'pptx' | 'image';
    mimeType: string;
    cloudinaryPublicId: string;
    cloudinaryUrl: string;
    cloudinaryFolder: string;
    thumbnailUrl?: string;
    pageImages?: string[];
    isPublic: boolean;
    metadata?: {
      pageCount?: number;
      width?: number;
      height?: number;
      format?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
}

export interface DocumentResponse {
  success: boolean;
  data: {
    _id: string;
    userId: string;
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'pptx' | 'image';
    mimeType: string;
    cloudinaryPublicId: string;
    cloudinaryUrl: string;
    cloudinaryFolder: string;
    thumbnailUrl?: string;
    pageImages?: string[];
    isPublic: boolean;
    metadata?: {
      pageCount?: number;
      width?: number;
      height?: number;
      format?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
}

export interface DocumentListResponse {
  success: boolean;
  data: {
    documents: DocumentResponse['data'][];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
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
   * Get all documents for the authenticated user
   */
  async getUserDocuments(page: number = 1, limit: number = 20): Promise<DocumentListResponse> {
    const response = await apiClient.get<DocumentListResponse>(
      `/documents?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/documents/${documentId}`
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

  /**
   * Toggle document visibility (public/private)
   */
  async toggleDocumentVisibility(documentId: string, isPublic: boolean): Promise<DocumentResponse> {
    const response = await apiClient.patch<DocumentResponse>(
      `/documents/${documentId}/visibility`,
      { isPublic }
    );
    return response.data;
  }
}

export default new DocumentApi();
