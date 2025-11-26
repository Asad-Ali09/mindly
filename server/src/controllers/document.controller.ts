import { Request, Response } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import cloudinaryService from '../services/cloudinary.service';
import Document from '../models/document.model';
import { IUser } from '../models/user.model';

const execAsync = promisify(exec);

class DocumentController {
  /**
   * Upload and process document (PDF, PPTX, or Images)
   */
  uploadDocument = async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      const user = req.user as IUser;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only PDF, PPTX, and images (PNG, JPG, GIF, WebP) are allowed.'
        });
      }

      const userId = (user._id as any).toString();
      
      // Handle image files (PNG, JPG, etc.)
      if (file.mimetype.startsWith('image/')) {
        const uploadResult = await cloudinaryService.uploadBuffer(
          file.buffer,
          userId,
          file.originalname,
          { resourceType: 'image' }
        );

        const document = await Document.create({
          userId: user._id as any,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: 'image',
          mimeType: file.mimetype,
          cloudinaryPublicId: uploadResult.public_id,
          cloudinaryUrl: uploadResult.secure_url,
          cloudinaryFolder: uploadResult.folder || `mindly/users/${userId}/documents`,
          thumbnailUrl: cloudinaryService.generateThumbnail(uploadResult.public_id),
          pageImages: [uploadResult.secure_url],
          metadata: {
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
          },
        });
        
        return res.status(200).json({
          success: true,
          data: document
        });
      }

      // Handle PDF files - convert to images and upload to Cloudinary
      if (file.mimetype === 'application/pdf') {
        try {
          // Save PDF temporarily for conversion
          const tempDir = path.join(process.cwd(), 'temp');
          if (!existsSync(tempDir)) {
            await fs.mkdir(tempDir, { recursive: true });
          }

          const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
          await fs.writeFile(tempFilePath, file.buffer);

          // Upload original PDF to Cloudinary as raw file (not image) so it can be viewed in iframe
          const pdfUploadResult = await cloudinaryService.uploadBuffer(
            file.buffer,
            userId,
            file.originalname,
            { resourceType: 'raw' }
          );

          // Convert PDF to images
          const imageBuffers = await this.convertPdfToImageBuffers(tempFilePath);
          
          // Create document in database first to get ID
          const document = await Document.create({
            userId: user._id as any,
            fileName: file.originalname,
            fileSize: file.size,
            fileType: 'pdf',
            mimeType: file.mimetype,
            cloudinaryPublicId: pdfUploadResult.public_id,
            cloudinaryUrl: pdfUploadResult.secure_url,
            cloudinaryFolder: pdfUploadResult.folder || `mindly/users/${userId}/documents`,
            pageImages: [],
            metadata: {
              pageCount: imageBuffers.length,
            },
          });

          // Upload page images to Cloudinary
          const pageUploadResults = await cloudinaryService.uploadMultipleBuffers(
            imageBuffers,
            userId,
            (document._id as any).toString(),
            'page'
          );

          // Update document with page image URLs and thumbnail from first page
          document.pageImages = pageUploadResults.map(result => result.secure_url);
          document.thumbnailUrl = pageUploadResults.length > 0 
            ? cloudinaryService.generateThumbnail(pageUploadResults[0].public_id)
            : undefined;
          await document.save();

          // Clean up temp file
          await fs.unlink(tempFilePath);
          
          return res.status(200).json({
            success: true,
            data: document
          });
        } catch (error) {
          console.error('Error converting PDF:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to convert PDF to images'
          });
        }
      }

      // Handle PPTX files - convert to PDF, then images, upload to Cloudinary
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        try {
          // Save PPTX temporarily for conversion
          const tempDir = path.join(process.cwd(), 'temp');
          if (!existsSync(tempDir)) {
            await fs.mkdir(tempDir, { recursive: true });
          }

          const tempPptxPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
          await fs.writeFile(tempPptxPath, file.buffer);

          // Convert PPTX to PDF
          const pdfPath = await this.convertPptxToPdf(tempPptxPath);
          const pdfBuffer = await fs.readFile(pdfPath);

          // Upload PDF to Cloudinary as raw file so it can be viewed in iframe
          const pdfUploadResult = await cloudinaryService.uploadBuffer(
            pdfBuffer,
            userId,
            file.originalname.replace(/\.pptx$/i, '.pdf'),
            { resourceType: 'raw' }
          );

          // Convert PDF to images
          const imageBuffers = await this.convertPdfToImageBuffers(pdfPath);
          
          // Create document in database first to get ID
          const document = await Document.create({
            userId: user._id as any,
            fileName: file.originalname,
            fileSize: file.size,
            fileType: 'pptx',
            mimeType: file.mimetype,
            cloudinaryPublicId: pdfUploadResult.public_id,
            cloudinaryUrl: pdfUploadResult.secure_url,
            cloudinaryFolder: pdfUploadResult.folder || `mindly/users/${userId}/documents`,
            pageImages: [],
            metadata: {
              pageCount: imageBuffers.length,
            },
          });

          // Upload page images to Cloudinary
          const pageUploadResults = await cloudinaryService.uploadMultipleBuffers(
            imageBuffers,
            userId,
            (document._id as any).toString(),
            'page'
          );

          // Update document with page image URLs and thumbnail from first page
          document.pageImages = pageUploadResults.map(result => result.secure_url);
          document.thumbnailUrl = pageUploadResults.length > 0 
            ? cloudinaryService.generateThumbnail(pageUploadResults[0].public_id)
            : undefined;
          await document.save();

          // Clean up temp files
          await fs.unlink(tempPptxPath);
          await fs.unlink(pdfPath);
          
          return res.status(200).json({
            success: true,
            data: document
          });
        } catch (error) {
          console.error('Error converting PPTX:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to convert PPTX to images'
          });
        }
      }

      return res.status(400).json({
        success: false,
        message: 'Unsupported file type'
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload document'
      });
    }
  };

  /**
   * Get document by ID
   */
  getDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user as IUser | undefined;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }
      
      const document = await Document.findById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Check if user has access to this document
      // Document is accessible if: it's public OR user owns it
      const isOwner = user && document.userId.toString() === (user._id as any).toString();
      const isPublic = document.isPublic;

      if (!isPublic && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Error fetching document:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch document'
      });
    }
  };

  /**
   * Get all documents for the authenticated user
   */
  getUserDocuments = async (req: Request, res: Response) => {
    try {
      const user = req.user as IUser;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const documents = await Document.find({ userId: user._id as any })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Document.countDocuments({ userId: user._id as any });

      return res.status(200).json({
        success: true,
        data: {
          documents,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching user documents:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch documents'
      });
    }
  };

  /**
   * Delete document
   */
  deleteDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const document = await Document.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Verify user owns the document
      if (document.userId.toString() !== (user._id as any).toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Delete from Cloudinary
      try {
        // Delete main file
        await cloudinaryService.deleteFile(document.cloudinaryPublicId, 'image');

        // Delete page images folder if exists
        if (document.pageImages && document.pageImages.length > 0) {
          const folderPath = `mindly/users/${(user._id as any)}/documents/${(document._id as any)}/pages`;
          await cloudinaryService.deleteFolder(folderPath);
        }
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }

      // Delete from database
      await Document.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete document'
      });
    }
  };

  /**
   * Toggle document visibility (public/private)
   */
  toggleDocumentVisibility = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isPublic } = req.body;
      const user = req.user as IUser;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const document = await Document.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Verify user owns the document
      if (document.userId.toString() !== (user._id as any).toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      document.isPublic = isPublic;
      await document.save();

      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Error updating document visibility:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update document visibility'
      });
    }
  };

  /**
   * Convert PDF to image buffers (one per page)
   */
  private async convertPdfToImageBuffers(filePath: string): Promise<Buffer[]> {
    try {
      const outputDir = path.join(process.cwd(), 'temp', 'pdf-conversion', Date.now().toString());
      await fs.mkdir(outputDir, { recursive: true });

      // Try pdf-poppler (best quality)
      try {
        const pdfPoppler = require('pdf-poppler');
        
        const opts = {
          format: 'png',
          out_dir: outputDir,
          out_prefix: 'page',
          page: null, // Convert all pages
          scale: 2048, // High quality
        };

        await pdfPoppler.convert(filePath, opts);

        // Read generated images as buffers
        const files = await fs.readdir(outputDir);
        const imageFiles = files
          .filter(f => f.startsWith('page') && f.endsWith('.png'))
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
          });

        if (imageFiles.length === 0) {
          throw new Error('No images generated from PDF');
        }

        const buffers: Buffer[] = [];
        for (const imageFile of imageFiles) {
          const imagePath = path.join(outputDir, imageFile);
          const buffer = await fs.readFile(imagePath);
          buffers.push(buffer);
        }

        // Clean up temp directory
        await fs.rm(outputDir, { recursive: true, force: true });

        return buffers;
      } catch (popplerError) {
        console.warn('pdf-poppler not available or failed:', popplerError);
        throw new Error('PDF conversion failed. Install pdf-poppler: npm install pdf-poppler');
      }
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw error;
    }
  }

  /**
   * Convert PPTX to PDF using LibreOffice
   */
  private async convertPptxToPdf(filePath: string): Promise<string> {
    try {
      const outputDir = path.join(process.cwd(), 'temp', 'pptx-conversion');
      await fs.mkdir(outputDir, { recursive: true });

      // Try common LibreOffice paths
      const libreOfficePaths = [
        'libreoffice',
        'soffice',
        '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"',
        '"/Applications/LibreOffice.app/Contents/MacOS/soffice"',
        '/usr/bin/libreoffice',
      ];

      let conversionSuccess = false;
      for (const loPath of libreOfficePaths) {
        try {
          const command = `${loPath} --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`;
          await execAsync(command, { timeout: 60000 });
          conversionSuccess = true;
          break;
        } catch (err) {
          continue;
        }
      }

      if (!conversionSuccess) {
        throw new Error('LibreOffice not found or conversion failed. Please install LibreOffice.');
      }

      // Find the generated PDF
      const files = await fs.readdir(outputDir);
      const baseName = path.parse(path.basename(filePath)).name;
      const pdfFile = files.find(f => f.startsWith(baseName) && f.endsWith('.pdf'));
      
      if (!pdfFile) {
        throw new Error('PDF conversion failed - no PDF file generated');
      }

      return path.join(outputDir, pdfFile);
    } catch (error) {
      console.error('Error converting PPTX to PDF:', error);
      throw new Error('Failed to convert PPTX to PDF');
    }
  }
}

export default new DocumentController();
