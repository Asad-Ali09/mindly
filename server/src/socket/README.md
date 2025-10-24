# WebSocket Server (Socket.IO)

This folder contains the WebSocket server implementation using Socket.IO.

## Features

- Real-time text-to-speech conversion
- Connects to TTS service at `http://127.0.0.1:8001`
- Uses FastAPI TTS service with Glow-TTS model
- Returns WAV audio files
- Emits audio response back to the client

## Events

### Client -> Server

**Event:** `text-to-speech`

**Payload:**
```json
{
  "text": "Your text to convert to speech"
}
```

### Server -> Client

**Event:** `audio-response`

**Payload:**
```json
{
  "audio": "base64_encoded_audio_data",
  "text": "original_text",
  "mimeType": "audio/wav"
}
```

**Event:** `tts-error`

**Payload:**
```json
{
  "message": "Error message",
  "error": "Error details"
}
```

## Usage Example (Client-side)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); // Adjust port as needed

// Send text for conversion
socket.emit('text-to-speech', { text: 'Hello, world!' });

// Listen for audio response
socket.on('audio-response', (data) => {
  console.log('Received audio:', data.audio);
  console.log('MIME type:', data.mimeType);
  
  // Decode base64 and play audio
  const audioBlob = new Blob(
    [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], 
    { type: data.mimeType || 'audio/wav' }
  );
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
});

// Listen for errors
socket.on('tts-error', (error) => {
  console.error('TTS Error:', error.message);
});
```

## Configuration

- TTS Service URL: `http://127.0.0.1:8001`
- Endpoint: `/synthesize`
- Method: POST
- Request Body:
  ```json
  {
    "text": "Text to synthesize",
    "language": "en"
  }
  ```
- Response: WAV audio file (arraybuffer)

You can modify the `TTS_SERVICE_URL` constant in `socket.server.ts` if your TTS service runs on a different address.
