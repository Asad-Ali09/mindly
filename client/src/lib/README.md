# Socket Service

This folder contains the WebSocket client service for connecting to the backend Socket.IO server.

## Configuration

Add the backend socket URL to your `.env.local` file:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

If not set, it defaults to `http://localhost:3001`.

## Usage

### Using the Hook (Recommended for React Components)

```tsx
'use client';

import { useSocket } from '@/lib';

export default function MyComponent() {
  const { isConnected, isLoading, error, connect, disconnect, sendTextToSpeech } = useSocket({
    autoConnect: true,  // Auto-connect on mount
    autoPlayAudio: true // Auto-play audio when received
  });

  const handleSpeak = () => {
    sendTextToSpeech('Hello, world!');
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p>Error: {error}</p>}
      
      <button onClick={handleSpeak} disabled={!isConnected || isLoading}>
        {isLoading ? 'Converting...' : 'Speak'}
      </button>
      
      <button onClick={connect} disabled={isConnected}>
        Connect
      </button>
      
      <button onClick={disconnect} disabled={!isConnected}>
        Disconnect
      </button>
    </div>
  );
}
```

### Using the Service Directly

```tsx
'use client';

import { useEffect } from 'react';
import { socketService } from '@/lib';

export default function MyComponent() {
  useEffect(() => {
    // Connect to socket
    socketService.connect();

    // Listen for audio responses
    socketService.onAudioResponse((data) => {
      console.log('Received audio:', data.text);
      // Auto-play the audio
      socketService.playAudio(data.audio, data.mimeType);
    });

    // Listen for errors
    socketService.onTTSError((error) => {
      console.error('TTS Error:', error.message);
    });

    // Cleanup
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  const handleSpeak = () => {
    socketService.sendTextToSpeech('Hello, world!');
  };

  return (
    <button onClick={handleSpeak}>
      Speak
    </button>
  );
}
```

### Manual Audio Handling

If you want to handle audio manually instead of auto-playing:

```tsx
'use client';

import { useSocket } from '@/lib';
import { useEffect } from 'react';
import { socketService } from '@/lib';

export default function MyComponent() {
  const { connect, sendTextToSpeech } = useSocket({
    autoConnect: true,
    autoPlayAudio: false // Disable auto-play
  });

  useEffect(() => {
    socketService.onAudioResponse((data) => {
      // Handle the audio data manually
      console.log('Audio received:', data.audio);
      
      // Download as file
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.audio}`;
      link.download = `speech_${Date.now()}.wav`;
      link.click();
      
      // Or play manually later
      // socketService.playAudio(data.audio, data.mimeType);
    });

    return () => {
      socketService.offAudioResponse();
    };
  }, []);

  return (
    <button onClick={() => sendTextToSpeech('Hello!')}>
      Convert to Speech
    </button>
  );
}
```

## API Reference

### SocketService

#### Methods

- `connect()`: Connect to the WebSocket server
- `disconnect()`: Disconnect from the server
- `getSocket()`: Get the raw Socket.IO instance
- `isConnected()`: Check if connected
- `sendTextToSpeech(text: string)`: Send text for conversion
- `onAudioResponse(callback)`: Listen for audio responses
- `onTTSError(callback)`: Listen for errors
- `offAudioResponse(callback?)`: Remove audio listener
- `offTTSError(callback?)`: Remove error listener
- `removeAllListeners()`: Remove all listeners
- `playAudio(base64Audio, mimeType?)`: Play audio from base64

### useSocket Hook

#### Options

```typescript
{
  autoConnect?: boolean;   // Auto-connect on mount (default: false)
  autoPlayAudio?: boolean; // Auto-play received audio (default: true)
}
```

#### Returns

```typescript
{
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendTextToSpeech: (text: string) => void;
  clearError: () => void;
}
```

## Events

### Client → Server

**Event:** `text-to-speech`
```typescript
{
  text: string;
}
```

### Server → Client

**Event:** `audio-response`
```typescript
{
  audio: string;      // base64 encoded WAV
  text: string;       // original text
  mimeType?: string;  // 'audio/wav'
}
```

**Event:** `tts-error`
```typescript
{
  message: string;
  error: string;
}
```
