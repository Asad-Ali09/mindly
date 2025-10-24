import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import axios from 'axios';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  TextToSpeechRequest
} from './socket.types';

// TTS Service Configuration
// FastAPI service using Glow-TTS model for text-to-speech conversion
const TTS_SERVICE_URL = 'http://127.0.0.1:8001';

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*', 
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for text-to-speech requests
    socket.on('text-to-speech', async (data: TextToSpeechRequest) => {
      try {
        console.log('Received text-to-speech request:', data.text);

        // Call the TTS service
        const response = await axios.post(`${TTS_SERVICE_URL}/synthesize`, {
          text: data.text,
          language: 'en'
        }, {
          responseType: 'arraybuffer' // Expecting audio file (WAV)
        });

        // Send the audio back to the client
        socket.emit('audio-response', {
          audio: Buffer.from(response.data).toString('base64'),
          text: data.text,
          mimeType: 'audio/wav'
        });

        console.log('Audio sent successfully to client:', socket.id);
      } catch (error: any) {
        console.error('Error calling TTS service:', error.message);
        socket.emit('tts-error', {
          message: 'Failed to convert text to speech',
          error: error.message
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};
