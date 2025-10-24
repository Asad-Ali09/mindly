import { socketService } from './socket.service';

export interface AudioCacheItem {
  text: string;
  audioData: string; // base64
  mimeType: string;
  audioBlob?: Blob;
  audioUrl?: string;
  duration?: number;
  isLoading: boolean;
  error?: string;
}

/**
 * Service to manage audio fetching and caching for lesson playback
 */
class AudioService {
  private audioCache: Map<string, AudioCacheItem> = new Map();
  private prefetchQueue: string[] = [];
  private isPrefetching = false;
  private maxConcurrentRequests = 3;
  private activeRequests = 0;

  /**
   * Request audio for a caption text
   */
  async requestAudio(text: string): Promise<AudioCacheItem | null> {
    // Check if already in cache
    if (this.audioCache.has(text)) {
      const cached = this.audioCache.get(text)!;
      if (!cached.isLoading && !cached.error) {
        return cached;
      }
    }

    // Create cache entry
    const cacheItem: AudioCacheItem = {
      text,
      audioData: '',
      mimeType: 'audio/wav',
      isLoading: true,
    };
    this.audioCache.set(text, cacheItem);

    return new Promise((resolve) => {
      // Set up one-time listener for this specific request
      const handleAudioResponse = (data: { audio: string; text: string; mimeType?: string }) => {
        if (data.text === text) {
          // Convert base64 to blob
          try {
            const binaryString = atob(data.audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Update cache
            const updatedItem: AudioCacheItem = {
              text: data.text,
              audioData: data.audio,
              mimeType: data.mimeType || 'audio/wav',
              audioBlob,
              audioUrl,
              isLoading: false,
            };
            this.audioCache.set(text, updatedItem);
            
            // Clean up listener
            socketService.offAudioResponse(handleAudioResponse);
            
            this.activeRequests--;
            this.processPrefetchQueue();
            
            resolve(updatedItem);
          } catch (error) {
            console.error('Error processing audio:', error);
            cacheItem.isLoading = false;
            cacheItem.error = 'Failed to process audio';
            socketService.offAudioResponse(handleAudioResponse);
            this.activeRequests--;
            this.processPrefetchQueue();
            resolve(null);
          }
        }
      };

      const handleError = (error: { message: string; error: string }) => {
        console.error('TTS Error:', error);
        cacheItem.isLoading = false;
        cacheItem.error = error.message;
        socketService.offTTSError(handleError);
        this.activeRequests--;
        this.processPrefetchQueue();
        resolve(null);
      };

      // Register listeners
      socketService.onAudioResponse(handleAudioResponse);
      socketService.onTTSError(handleError);

      // Send request
      this.activeRequests++;
      socketService.sendTextToSpeech(text);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (cacheItem.isLoading) {
          cacheItem.isLoading = false;
          cacheItem.error = 'Request timeout';
          socketService.offAudioResponse(handleAudioResponse);
          socketService.offTTSError(handleError);
          this.activeRequests--;
          this.processPrefetchQueue();
          resolve(null);
        }
      }, 30000);
    });
  }

  /**
   * Prefetch audio for multiple texts
   */
  prefetchAudios(texts: string[]): void {
    texts.forEach(text => {
      if (!this.audioCache.has(text) && !this.prefetchQueue.includes(text)) {
        this.prefetchQueue.push(text);
      }
    });

    this.processPrefetchQueue();
  }

  /**
   * Process prefetch queue with concurrency control
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching) return;
    if (this.prefetchQueue.length === 0) return;
    if (this.activeRequests >= this.maxConcurrentRequests) return;

    this.isPrefetching = true;

    while (this.prefetchQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const text = this.prefetchQueue.shift();
      if (text && !this.audioCache.has(text)) {
        // Don't await - let it run in background
        this.requestAudio(text).catch(err => {
          console.error('Prefetch error:', err);
        });
      }
    }

    this.isPrefetching = false;
  }

  /**
   * Get cached audio if available
   */
  getCachedAudio(text: string): AudioCacheItem | null {
    const cached = this.audioCache.get(text);
    if (cached && !cached.isLoading && !cached.error) {
      return cached;
    }
    return null;
  }

  /**
   * Check if audio is ready
   */
  isAudioReady(text: string): boolean {
    const cached = this.audioCache.get(text);
    return cached ? !cached.isLoading && !cached.error : false;
  }

  /**
   * Play audio from cache
   */
  playAudio(text: string): HTMLAudioElement | null {
    const cached = this.getCachedAudio(text);
    if (!cached || !cached.audioUrl) {
      console.warn('Audio not ready for:', text);
      return null;
    }

    const audio = new Audio(cached.audioUrl);
    
    // Add a small delay to avoid race conditions
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Only log if it's not an AbortError (which happens during pause/stop)
        if (error.name !== 'AbortError') {
          console.error('Error playing audio:', error);
        }
      });
    }

    return audio;
  }

  /**
   * Clear cache and release blob URLs
   */
  clearCache(): void {
    this.audioCache.forEach(item => {
      if (item.audioUrl) {
        URL.revokeObjectURL(item.audioUrl);
      }
    });
    this.audioCache.clear();
    this.prefetchQueue = [];
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const total = this.audioCache.size;
    let ready = 0;
    let loading = 0;
    let errors = 0;

    this.audioCache.forEach(item => {
      if (item.isLoading) loading++;
      else if (item.error) errors++;
      else ready++;
    });

    return { total, ready, loading, errors, queued: this.prefetchQueue.length };
  }
}

// Export singleton instance
export const audioService = new AudioService();
