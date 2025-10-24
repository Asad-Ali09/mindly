'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { socketService, AudioResponse, TTSError } from './socket.service';

export interface UseSocketOptions {
  autoConnect?: boolean;
  autoPlayAudio?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = false, autoPlayAudio = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioResponseRef = useRef<((data: AudioResponse) => void) | null>(null);
  const ttsErrorRef = useRef<((error: TTSError) => void) | null>(null);

  // Connect to socket
  const connect = useCallback(() => {
    try {
      socketService.connect();
      setIsConnected(socketService.isConnected());
    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to connect to socket server');
    }
  }, []);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  // Send text for text-to-speech
  const sendTextToSpeech = useCallback((text: string) => {
    if (!text.trim()) {
      setError('Text cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);
    socketService.sendTextToSpeech(text);
  }, []);

  // Setup event listeners
  useEffect(() => {
    // Audio response handler
    audioResponseRef.current = (data: AudioResponse) => {
      console.log('Received audio response');
      setIsLoading(false);
      
      if (autoPlayAudio) {
        socketService.playAudio(data.audio, data.mimeType);
      }
    };

    // Error handler
    ttsErrorRef.current = (error: TTSError) => {
      console.error('TTS Error:', error);
      setIsLoading(false);
      setError(error.message);
    };

    // Register listeners
    socketService.onAudioResponse(audioResponseRef.current);
    socketService.onTTSError(ttsErrorRef.current);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      if (audioResponseRef.current) {
        socketService.offAudioResponse(audioResponseRef.current);
      }
      if (ttsErrorRef.current) {
        socketService.offTTSError(ttsErrorRef.current);
      }
    };
  }, [autoConnect, autoPlayAudio, connect]);

  // Listen for connection changes
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    sendTextToSpeech,
    clearError: () => setError(null),
  };
};
