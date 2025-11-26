'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { documentApi } from '@/api';
import { Tiles } from '@/components/ui/tiles';
import { AnimatedGroup } from '@/components/ui/animated-group';

type FileType = 'pdf' | 'pptx' | 'image' | null;

const StudyByNotesPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    
    let type: FileType = null;
    if (fileExtension === 'pdf') {
      type = 'pdf';
    } else if (fileExtension === 'pptx') {
      type = 'pptx';
    } else if (imageExtensions.includes(fileExtension || '')) {
      type = 'image';
    } else {
      setError('Please upload a PDF, PPTX, or image file (PNG, JPG, GIF, WebP)');
      return;
    }

    setError(null);
    setUploadedFile(file);
    setFileType(type);
    handleFileUpload(file, type);
  };

  const handleFileUpload = async (file: File, type: FileType) => {
    if (!type) return;
    
    setIsUploading(true);
    setError(null);

    try {
      const response = await documentApi.uploadDocument(file, type);
      
      // Store document data in sessionStorage before redirect
      if (response.data._id) {
        // Cloudinary URLs are already absolute, no need to prepend base URL
        const documentData = {
          _id: response.data._id,
          fileName: response.data.fileName,
          fileSize: response.data.fileSize,
          fileType: response.data.fileType,
          cloudinaryUrl: response.data.cloudinaryUrl,
          pageImages: response.data.pageImages || [],
          thumbnailUrl: response.data.thumbnailUrl,
          isPublic: response.data.isPublic,
          createdAt: response.data.createdAt,
          // Legacy fields for backward compatibility
          id: response.data._id,
          fileUrl: response.data.cloudinaryUrl,
          images: response.data.pageImages || [],
        };
        
        // Store in sessionStorage
        sessionStorage.setItem(`document_${response.data._id}`, JSON.stringify(documentData));
        
        // Redirect to document page
        router.push(`/document/${response.data._id}`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload file. Please try again.';
      setError(errorMessage);
      console.error('Error uploading file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      
      let type: FileType = null;
      if (fileExtension === 'pdf') {
        type = 'pdf';
      } else if (fileExtension === 'pptx') {
        type = 'pptx';
      } else if (imageExtensions.includes(fileExtension || '')) {
        type = 'image';
      } else {
        setError('Please upload a PDF, PPTX, or image file (PNG, JPG, GIF, WebP)');
        return;
      }
      
      setError(null);
      setUploadedFile(file);
      setFileType(type);
      handleFileUpload(file, type);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Always show upload view since we redirect after upload
  return (
      <div className="relative min-h-screen flex flex-col bg-[#0A0B09] overflow-hidden">
        {/* Animated Tiles Background */}
        <div className="fixed inset-0 z-0 opacity-60">
          <Tiles 
            rows={50} 
            cols={20}
            tileSize="md"
            tileClassName="border-[#bf3a0d]/50"
          />
        </div>

        {/* Header */}
        <header className="hero-header">
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0,
                  },
                },
              },
              item: {
                hidden: {
                  opacity: 0,
                  y: -20,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: 'spring' as const,
                    bounce: 0.4,
                    duration: 1,
                  },
                },
              },
            }}
            className="w-full flex justify-between items-center"
          >
            <div>
              <Link href="/" className="hero-brand">
                <span>Mindly</span>
              </Link>
            </div>
            <div className="flex gap-4">
              <Link href="/learn">
                <button className="hero-cta" type="button">
                  Back to Learn
                </button>
              </Link>
              {user ? (
                <Link href="/dashboard">
                  <button className="hero-cta" type="button">
                    Dashboard
                  </button>
                </Link>
              ) : (
                <Link href="/login">
                  <button className="hero-cta" type="button">
                    Login
                  </button>
                </Link>
              )}
            </div>
          </AnimatedGroup>
        </header>

        <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex items-center justify-center p-4 pointer-events-auto mt-24">
          <div className="bg-[#0A0B09] p-8 sm:p-12 rounded-lg border border-[#bf3a0d]/30 w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-[#ffffff] mb-3">
                Upload Your Document
              </h1>
              <p className="text-[#ffffff]/70 text-lg">
                Upload a PDF, PowerPoint, or image file to study with your AI tutor
              </p>
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#bf3a0d]/30 rounded-xl p-12 text-center cursor-pointer hover:border-[#bf3a0d] hover:bg-[#bf3a0d]/5 transition-all duration-200"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.png,.jpg,.jpeg,.gif,.webp,.bmp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center gap-4">
                  <svg className="animate-spin h-12 w-12 text-[#bf3a0d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-[#ffffff] text-lg font-medium">Processing your document...</p>
                  <p className="text-[#ffffff]/50 text-sm">This may take a moment</p>
                </div>
              ) : (
                <>
                  <svg className="w-16 h-16 mx-auto mb-4 text-[#bf3a0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-[#ffffff] text-lg font-medium mb-2">
                    Drag & drop your file here
                  </p>
                  <p className="text-[#ffffff]/50 mb-4">or</p>
                  <span className="inline-block px-6 py-3 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors">
                    Browse Files
                  </span>
                  <p className="text-[#ffffff]/40 text-sm mt-4">
                    Supported formats: PDF, PPTX, PNG, JPG, GIF, WebP (Max 50MB)
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-[#bf3a0d]/10 border border-[#bf3a0d] rounded-xl">
                <p className="text-[#bf3a0d] text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default StudyByNotesPage;
