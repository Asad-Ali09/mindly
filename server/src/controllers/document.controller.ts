import { Request, Response } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

const execAsync = promisify(exec);

interface DocumentMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'pptx' | 'image';
  fileUrl?: string;
  images?: string[];
  createdAt: string;
}

class DocumentController {
  private uploadDir: string;
  private metadataDir: string;

  constructor() {
    // Use process.cwd() for better compatibility
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.metadataDir = path.join(process.cwd(), 'uploads', 'metadata');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
    if (!existsSync(this.metadataDir)) {
      await fs.mkdir(this.metadataDir, { recursive: true });
    }
  }

  private generateDocumentId(): string {
    return randomBytes(16).toString('hex');
  }

  private async saveDocumentMetadata(metadata: DocumentMetadata): Promise<void> {
    const metadataPath = path.join(this.metadataDir, `${metadata.id}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    // Ensure the file is written to disk before continuing
    const fileHandle = await fs.open(metadataPath, 'r+');
    await fileHandle.sync();
    await fileHandle.close();
  }

  private async getDocumentMetadata(id: string): Promise<DocumentMetadata | null> {
    try {
      const metadataPath = path.join(this.metadataDir, `${id}.json`);
      const data = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Upload and process document (PDF, PPTX, or Images)
   */
  uploadDocument = async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      const fileType = req.body.fileType;

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
        await fs.unlink(file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only PDF, PPTX, and images (PNG, JPG, GIF, WebP) are allowed.'
        });
      }

      // Handle image files (PNG, JPG, etc.)
      if (file.mimetype.startsWith('image/')) {
        const documentId = this.generateDocumentId();
        const imageUrl = `/uploads/${file.filename}`;
        
        const metadata: DocumentMetadata = {
          id: documentId,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: 'image',
          images: [imageUrl],
          createdAt: new Date().toISOString()
        };
        
        await this.saveDocumentMetadata(metadata);
        
        return res.status(200).json({
          success: true,
          data: metadata
        });
      }

      // Handle PDF files - convert to images but keep original file
      if (fileType === 'pdf' || file.mimetype === 'application/pdf') {
        try {
          const documentId = this.generateDocumentId();
          const images = await this.convertPdfToImages(file.path, file.filename);
          const pdfUrl = `/uploads/${file.filename}`;
          
          const metadata: DocumentMetadata = {
            id: documentId,
            fileName: file.originalname,
            fileSize: file.size,
            fileType: 'pdf',
            fileUrl: pdfUrl,
            images,
            createdAt: new Date().toISOString()
          };
          
          await this.saveDocumentMetadata(metadata);
          
          // Keep original PDF file for browser viewer option
          return res.status(200).json({
            success: true,
            data: metadata
          });
        } catch (error) {
          console.error('Error converting PDF:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to convert PDF to images'
          });
        }
      }

      // Handle PPTX files - convert to images via PDF and keep PDF for browser viewer
      if (fileType === 'pptx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        try {
          const documentId = this.generateDocumentId();
          // Convert PPTX to PDF first
          const pdfUrl = await this.convertPptxToPdf(file.path, file.filename);
          
          // Then convert PDF pages to images
          const outputDir = path.join(this.uploadDir, 'converted', path.parse(file.filename).name);
          const files = await fs.readdir(path.join(this.uploadDir, 'converted'));
          const baseName = path.parse(file.filename).name;
          const pdfFile = files.find(f => f.startsWith(baseName) && f.endsWith('.pdf'));
          
          if (pdfFile) {
            const pdfPath = path.join(this.uploadDir, 'converted', pdfFile);
            const images = await this.convertPdfToImages(pdfPath, pdfFile);
            
            // Delete original PPTX after conversion
            await fs.unlink(file.path);
            
            const metadata: DocumentMetadata = {
              id: documentId,
              fileName: file.originalname,
              fileSize: file.size,
              fileType: 'pptx',
              fileUrl: pdfUrl,
              images,
              createdAt: new Date().toISOString()
            };
            
            await this.saveDocumentMetadata(metadata);
            
            return res.status(200).json({
              success: true,
              data: metadata
            });
          }
          
          throw new Error('PDF conversion failed');
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
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }
      
      const metadata = await this.getDocumentMetadata(id);
      
      if (!metadata) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: metadata
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
   * Convert PDF to images (one per page)
   */
  private async convertPdfToImages(filePath: string, filename: string): Promise<string[]> {
    try {
      const outputDir = path.join(this.uploadDir, 'converted', path.parse(filename).name);
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

        // Get list of generated images
        const files = await fs.readdir(outputDir);
        const images = files
          .filter(f => f.startsWith('page') && f.endsWith('.png'))
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
          })
          .map(f => `/uploads/converted/${path.parse(filename).name}/${f}`);

        if (images.length === 0) {
          throw new Error('No images generated from PDF');
        }

        return images;
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
  private async convertPptxToPdf(filePath: string, filename: string): Promise<string> {
    try {
      const outputDir = path.join(this.uploadDir, 'converted');
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
      const baseName = path.parse(filename).name;
      const pdfFile = files.find(f => f.startsWith(baseName) && f.endsWith('.pdf'));
      
      if (!pdfFile) {
        throw new Error('PDF conversion failed - no PDF file generated');
      }

      // Return the URL path
      return `/uploads/converted/${pdfFile}`;
    } catch (error) {
      console.error('Error converting PPTX to PDF:', error);
      throw new Error('Failed to convert PPTX to PDF');
    }
  }

  /**
   * Delete uploaded document
   */
  deleteDocument = async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(this.uploadDir, filename);

      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }

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
}

export default new DocumentController();
