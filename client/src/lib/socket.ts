import { io, Socket } from 'socket.io-client';

// Socket.IO types matching the server
export interface TextToSpeechRequest {
  text: string;
}

export interface AudioResponse {
  audio: string; // base64 encoded audio
  text: string;
  mimeType?: string; // audio mime type (e.g., 'audio/wav', 'audio/mpeg')
}

export interface TTSError {
  message: string;
  error: string;
}

export interface ServerToClientEvents {
  'audio-response': (data: AudioResponse) => void;
  'tts-error': (error: TTSError) => void;
}

export interface ClientToServerEvents {
  'text-to-speech': (data: TextToSpeechRequest) => void;
}

// Socket instance type
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: TypedSocket | null = null;

/**
 * Get or create a socket connection
 */
export const getSocket = (): TypedSocket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

/**
 * Connect the socket if not already connected
 */
export const connectSocket = (): TypedSocket => {
  const socketInstance = getSocket();
  if (!socketInstance.connected) {
    socketInstance.connect();
  }
  return socketInstance;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
