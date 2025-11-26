'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { Avatar } from '@/components/Avatar';
import { useAuthStore } from '@/store';
import { documentApi } from '@/api';

type FileType = 'pdf' | 'pptx' | 'image' | null;

interface DocumentData {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: FileType;
  fileUrl?: string;
  images?: string[];
  createdAt: string;
}

const DocumentViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  const { user } = useAuthStore();
  
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [viewMode, setViewMode] = useState<'images' | 'browser'>('images');
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const windowWidth = window.innerWidth;
    const newWidth = (e.clientX / windowWidth) * 100;
    
    if (newWidth >= 20 && newWidth <= 60) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Fetch document data
  useEffect(() => {
    let isMounted = true;
    
    const fetchDocument = async () => {
      if (!documentId) return;
      
      // Start with loading state
      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }
      
      // Check if document data is in sessionStorage (from fresh upload)
      const cachedData = sessionStorage.getItem(`document_${documentId}`);
      if (cachedData) {
        try {
          const data = JSON.parse(cachedData);
          if (isMounted) {
            setDocumentData(data);
            setError(null);
            setIsLoading(false);
          }
          // Remove from sessionStorage after use
          sessionStorage.removeItem(`document_${documentId}`);
          return;
        } catch (e) {
          // If parsing fails, fall through to API fetch
        }
      }
      
      // Fetch from API with retry logic
      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await documentApi.getDocument(documentId);
          
          if (!isMounted) return;
          
          // Convert relative URLs to absolute URLs
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const baseUrl = apiUrl.replace(/\/api$/, '');
          
          const data = {
            ...response.data,
            fileUrl: response.data.fileUrl ? `${baseUrl}${response.data.fileUrl}` : undefined,
            images: response.data.images?.map(img => `${baseUrl}${img}`) || []
          };
          
          setDocumentData(data);
          setError(null);
          setIsLoading(false);
          return; // Success, exit retry loop
          
        } catch (err: any) {
          if (!isMounted) return;
          
          // If not the last attempt, wait and retry
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          
          // Last attempt failed
          const errorMessage = err.response?.data?.message || 'Failed to load document';
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    fetchDocument();
    
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (documentData?.images && currentImageIndex < documentData.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0B09]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#bf3a0d] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#ffffff] text-lg">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0B09]">
        <div className="text-center max-w-md">
          <p className="text-[#bf3a0d] text-xl mb-4">{error || 'Document not found'}</p>
          <Link href="/studybynotes">
            <button className="px-6 py-3 bg-[#bf3a0d] text-[#ffffff] rounded-lg hover:bg-[#bf3a0d]/90">
              Upload New Document
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0A0B09] overflow-hidden">
      {/* Header */}
      <header className="relative z-20 bg-[#0A0B09]/95 border-b border-[#bf3a0d]/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-bold text-[#ffffff]">
              Mindly
            </Link>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/studybynotes">
              <button className="px-4 py-2 text-[#ffffff]/70 hover:text-[#ffffff] transition-colors">
                Upload New Document
              </button>
            </Link>
            
            {/* View Mode Toggle */}
            {documentData.fileUrl && (
              <div className="flex items-center gap-2 border-l border-[#bf3a0d]/30 pl-4">
                <span className="text-[#ffffff]/70 text-sm">View:</span>
                <button
                  onClick={() => setViewMode('images')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'images'
                      ? 'bg-[#bf3a0d] text-[#ffffff]'
                      : 'bg-[#141712] text-[#ffffff]/70 hover:text-[#ffffff]'
                  }`}
                >
                  Page-by-Page
                </button>
                <button
                  onClick={() => setViewMode('browser')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'browser'
                      ? 'bg-[#bf3a0d] text-[#ffffff]'
                      : 'bg-[#141712] text-[#ffffff]/70 hover:text-[#ffffff]'
                  }`}
                >
                  Browser Viewer
                </button>
              </div>
            )}
            
            {user ? (
              <Link href="/dashboard">
                <button className="px-6 py-2 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors">
                  Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="px-6 py-2 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors">
                  Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side - 3D Character */}
        <div 
          className="relative bg-[#0A0B09] flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="absolute inset-0">
            <Canvas
              shadows
              camera={{ position: [0, 0, 8], fov: 42 }}
              style={{ background: '#0A0B09' }}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <directionalLight
                  position={[5, 10, 5]}
                  intensity={1}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                />
                <Avatar
                  position={[0, -3, 5]}
                  scale={2}
                  animation="Breathing Idle"
                  script=""
                  lipsync={[]}
                  audioPlayer={null}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Ask Question Button */}
          <div className="absolute bottom-8 left-8 right-8">
            <button
              className="w-full py-4 px-6 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-lg hover:bg-[#bf3a0d]/90 transition-colors flex items-center justify-center gap-3"
              onClick={() => {}}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Ask a Question
            </button>
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 bg-[#bf3a0d]/30 hover:bg-[#bf3a0d] cursor-col-resize relative group transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
            <div className="w-1 h-16 bg-[#bf3a0d] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Right Side - Document Viewer */}
        <div 
          className="relative bg-[#141712] flex flex-col"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Document Display */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {viewMode === 'browser' && documentData.fileUrl ? (
              <div className="flex-1 w-full">
                <iframe
                  src={`${documentData.fileUrl}#page=${currentPdfPage}`}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                />
              </div>
            ) : documentData.images && documentData.images.length > 0 ? (
              <div className="flex-1 flex justify-center items-start p-4 overflow-y-auto overflow-x-hidden bg-gray-100">
                <img
                  src={documentData.images[currentImageIndex]}
                  alt={`Page ${currentImageIndex + 1}`}
                  className="object-contain"
                  style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
                />
              </div>
            ) : null}
          </div>

          {/* Document Info & Navigation */}
          <div className="border-t border-[#bf3a0d]/30 p-4 bg-[#0A0B09]/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ffffff] font-medium">{documentData.fileName}</p>
                <p className="text-[#ffffff]/50 text-sm">
                  {documentData.fileType?.toUpperCase()} • {(documentData.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              {/* Navigation Controls - Only show in image view mode */}
              {viewMode === 'images' && documentData.images && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePrevImage}
                    disabled={currentImageIndex === 0}
                    className="p-2 bg-[#bf3a0d] text-[#ffffff] rounded-lg hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentImageIndex + 1}
                      onChange={(e) => {
                        const page = parseInt(e.target.value) - 1;
                        if (page >= 0 && page < documentData.images!.length) {
                          setCurrentImageIndex(page);
                        }
                      }}
                      className="w-14 px-2 py-1 bg-[#141712] text-[#ffffff] text-center rounded-lg border border-[#bf3a0d]/30 focus:border-[#bf3a0d] outline-none text-sm"
                      min={1}
                      max={documentData.images.length}
                    />
                    <span className="text-[#ffffff] text-sm">/ {documentData.images.length}</span>
                  </div>
                  
                  <button
                    onClick={handleNextImage}
                    disabled={currentImageIndex === documentData.images.length - 1}
                    className="p-2 bg-[#bf3a0d] text-[#ffffff] rounded-lg hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewPage;
