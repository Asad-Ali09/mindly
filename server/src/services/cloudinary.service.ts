import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import config from '../config/config';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  transformation?: any[];
}

class CloudinaryService {
  /**
   * Upload file from buffer to Cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    userId: string,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || `mindly/users/${userId}/documents`,
          public_id: options.publicId,
          resource_type: options.resourceType || 'auto',
          format: options.format,
          transformation: options.transformation,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Upload failed with no result'));
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Upload file from file path to Cloudinary
   */
  async uploadFile(
    filePath: string,
    userId: string,
    options: UploadOptions = {}
  ): Promise<UploadApiResponse> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder || `mindly/users/${userId}/documents`,
        public_id: options.publicId,
        resource_type: options.resourceType || 'auto',
        format: options.format,
        transformation: options.transformation,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary by public ID
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete entire folder from Cloudinary
   */
  async deleteFolder(folderPath: string): Promise<any> {
    try {
      // First delete all resources in the folder
      const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
      
      // Then delete the folder itself
      await cloudinary.api.delete_folder(folderPath);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate thumbnail URL with transformations
   */
  generateThumbnail(publicId: string, width: number = 200, height: number = 200): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }

  /**
   * Get optimized URL with transformations
   */
  getOptimizedUrl(publicId: string, transformations: any = {}): string {
    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      ...transformations,
    });
  }

  /**
   * Upload multiple files (for PDF/PPTX page images)
   */
  async uploadMultipleBuffers(
    buffers: Buffer[],
    userId: string,
    documentId: string,
    baseName: string = 'page'
  ): Promise<UploadApiResponse[]> {
    const uploadPromises = buffers.map((buffer, index) => {
      return this.uploadBuffer(buffer, userId, `${baseName}-${index + 1}`, {
        folder: `mindly/users/${userId}/documents/${documentId}/pages`,
        publicId: `${baseName}-${index + 1}`,
      });
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Get resource details from Cloudinary
   */
  async getResourceDetails(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

export default new CloudinaryService();
