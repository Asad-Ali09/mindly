import { io, Socket } from 'socket.io-client';

// Socket event types
export interface TextToSpeechRequest {
  text: string;
}

export interface AudioResponse {
  audio: string; // base64 encoded audio
  text: string;
  mimeType?: string;
}

export interface TTSError {
  message: string;
  error: string;
}

// Socket service class
class SocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

  /**
   * Connect to the WebSocket server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log('Connecting to socket server:', this.SOCKET_URL);
    
    this.socket = io(this.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Send text for text-to-speech conversion
   */
  sendTextToSpeech(text: string): void {
    if (!this.socket?.connected) {
      console.error('Socket is not connected. Call connect() first.');
      return;
    }

    console.log('Sending text-to-speech request:', text);
    this.socket.emit('text-to-speech', { text });
  }

  /**
   * Listen for audio response
   */
  onAudioResponse(callback: (data: AudioResponse) => void): void {
    if (!this.socket) {
      console.error('Socket is not initialized. Call connect() first.');
      return;
    }

    this.socket.on('audio-response', callback);
  }

  /**
   * Listen for TTS errors
   */
  onTTSError(callback: (error: TTSError) => void): void {
    if (!this.socket) {
      console.error('Socket is not initialized. Call connect() first.');
      return;
    }

    this.socket.on('tts-error', callback);
  }

  /**
   * Remove audio response listener
   */
  offAudioResponse(callback?: (data: AudioResponse) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('audio-response', callback);
      } else {
        this.socket.off('audio-response');
      }
    }
  }

  /**
   * Remove TTS error listener
   */
  offTTSError(callback?: (error: TTSError) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('tts-error', callback);
      } else {
        this.socket.off('tts-error');
      }
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Play audio from base64 encoded data
   */
  playAudio(base64Audio: string, mimeType: string = 'audio/wav'): void {
    try {
      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and play
      const audioBlob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });

      // Cleanup after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error decoding/playing audio:', error);
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Export class for custom instances if needed
export default SocketService;
