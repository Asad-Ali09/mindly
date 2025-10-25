import { connectSocket, disconnectSocket, getSocket } from './socket';
import type { TextToSpeechRequest, AudioResponse, TTSError } from './socket';

/**
 * Socket Service for managing text-to-speech and other socket operations
 */
class SocketService {
  private socket = getSocket();
  private isConnected = false;

  /**
   * Initialize and connect the socket
   */
  connect(): void {
    if (this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = connectSocket();
    this.isConnected = true;

    // Set up default listeners
    this.socket.on('connect', () => {
      console.log('SocketService: Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketService: Disconnected from server:', reason);
      this.isConnected = false;
    });
  }

  /**
   * Disconnect the socket
   */
  disconnect(): void {
    disconnectSocket();
    this.isConnected = false;
  }

  /**
   * Check if socket is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket.connected;
  }

  /**
   * Request text-to-speech conversion
   * @param text - The text to convert to speech
   * @param onSuccess - Callback when audio is received
   * @param onError - Callback when an error occurs
   */
  requestTextToSpeech(
    text: string,
    onSuccess?: (data: AudioResponse) => void,
    onError?: (error: TTSError) => void
  ): void {
    if (!this.isConnected) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    // Register one-time listeners for this specific request
    if (onSuccess) {
       const handleResponse = (data: AudioResponse) => {
        if (data.text === text) {
          onSuccess(data);
          this.socket.off("audio-response", handleResponse);
        }
      };
      this.socket.on("audio-response", handleResponse);
    }
    // Add request IDs
    if (onError) {
      this.socket.once('tts-error', onError);
    }

    // Emit the request
    const request: TextToSpeechRequest = { text };
    this.socket.emit('text-to-speech', request);
  }

  /**
   * Register a persistent listener for audio responses
   * @param callback - Function to call when audio is received
   */
  onAudioResponse(callback: (data: AudioResponse) => void): void {
    this.socket.on('audio-response', callback);
  }

  /**
   * Register a persistent listener for TTS errors
   * @param callback - Function to call when an error occurs
   */
  onTTSError(callback: (error: TTSError) => void): void {
    this.socket.on('tts-error', callback);
  }

  /**
   * Remove a specific listener
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  removeListener(event: string, callback: (...args: any[]) => void): void {
    this.socket.off(event as any, callback);
  }

  /**
   * Remove all listeners for a specific event
   * @param event - Event name
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.socket.removeAllListeners(event as any);
    } else {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Play audio from base64 string
   * @param audioBase64 - Base64 encoded audio data
   * @param mimeType - Audio mime type (default: 'audio/wav')
   */
  playAudio(audioBase64: string, mimeType: string = 'audio/wav'): void {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Create audio URL and play
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
      });

      // Clean up URL after audio ends
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error in playAudio:', error);
    }
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;
