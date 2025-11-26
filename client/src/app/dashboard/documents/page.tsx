'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentApi } from '@/api';
import { FileTextIcon, TrashIcon, EyeIcon, GlobeIcon, LockIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Document {
  _id: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'pptx' | 'image';
  cloudinaryUrl: string;
  thumbnailUrl?: string;
  pageImages?: string[];
  isPublic: boolean;
  createdAt: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDocuments();
  }, [page]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentApi.getUserDocuments(page, 12);
      setDocuments(response.data.documents);
      setTotalPages(response.data.pagination.pages);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load documents';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await documentApi.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      fetchDocuments(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete document';
      toast.error(errorMessage);
    }
  };

  const handleToggleVisibility = async (documentId: string, currentStatus: boolean) => {
    try {
      await documentApi.toggleDocumentVisibility(documentId, !currentStatus);
      toast.success(`Document is now ${!currentStatus ? 'public' : 'private'}`);
      fetchDocuments(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update visibility';
      toast.error(errorMessage);
    }
  };

  const handleViewDocument = (documentId: string) => {
    router.push(`/document/${documentId}`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-left-col" style={{ maxWidth: '100%' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--dashboard-text-primary)] mb-2">
              Your Documents
            </h1>
            <p className="text-[var(--dashboard-text-secondary)]">
              Manage your uploaded documents
            </p>
          </div>
          <button
            onClick={() => router.push('/studybynotes')}
            className="px-6 py-3 bg-[var(--dashboard-accent-1)] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            + Upload New Document
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-[var(--dashboard-accent-1)] border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && documents.length === 0 && (
          <div className="text-center py-12">
            <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-[var(--dashboard-text-secondary)] opacity-50" />
            <h3 className="text-xl font-semibold text-[var(--dashboard-text-primary)] mb-2">
              No documents yet
            </h3>
            <p className="text-[var(--dashboard-text-secondary)] mb-6">
              Upload your first document to get started
            </p>
            <button
              onClick={() => router.push('/studybynotes')}
              className="px-6 py-3 bg-[var(--dashboard-accent-1)] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
            >
              Upload Document
            </button>
          </div>
        )}

        {/* Documents Grid */}
        {!isLoading && !error && documents.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-border)] rounded-lg p-4 hover:border-[var(--dashboard-accent-1)] transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-[var(--dashboard-bg)] rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                    {doc.thumbnailUrl || doc.pageImages?.[0] ? (
                      <img
                        src={doc.thumbnailUrl || doc.pageImages?.[0]}
                        alt={doc.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileTextIcon className="w-12 h-12 text-[var(--dashboard-text-secondary)] opacity-50" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-[var(--dashboard-text-primary)] mb-1 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--dashboard-text-secondary)]">
                      <span className="uppercase">{doc.fileType}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  {/* Privacy Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      doc.isPublic 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {doc.isPublic ? (
                        <>
                          <GlobeIcon className="w-3 h-3" />
                          Public
                        </>
                      ) : (
                        <>
                          <LockIcon className="w-3 h-3" />
                          Private
                        </>
                      )}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDocument(doc._id)}
                      className="flex-1 px-3 py-2 bg-[var(--dashboard-accent-1)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(doc._id, doc.isPublic)}
                      className="px-3 py-2 bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-border)] text-[var(--dashboard-text-primary)] rounded-lg hover:border-[var(--dashboard-accent-1)] transition-colors text-sm"
                      title={doc.isPublic ? 'Make Private' : 'Make Public'}
                    >
                      {doc.isPublic ? <LockIcon className="w-4 h-4" /> : <GlobeIcon className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(doc._id, doc.fileName)}
                      className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-border)] text-[var(--dashboard-text-primary)] rounded-lg hover:border-[var(--dashboard-accent-1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-[var(--dashboard-text-secondary)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-border)] text-[var(--dashboard-text-primary)] rounded-lg hover:border-[var(--dashboard-accent-1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
