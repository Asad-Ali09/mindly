# Audio-Driven Whiteboard Animation

This document explains how the whiteboard animation system works with real-time audio generation from the TTS service.

## Overview

The whiteboard animation is now synchronized with audio playback from the WebSocket server. Instead of playing animations based on timestamps alone, the system:

1. **Prefetches audio** for all captions when a lesson loads
2. **Plays audio sequentially** for each caption segment
3. **Synchronizes animations** with the audio playback
4. **Provides smooth experience** with pre-cached audio

## Architecture

```
┌─────────────────┐
│  Lesson Page    │
│  (page.tsx)     │
└────────┬────────┘
         │
         │ lesson data
         ▼
┌─────────────────────────────────┐
│     Whiteboard Component        │
│  ┌──────────────────────────┐  │
│  │  Socket Connection       │  │
│  │  - Connects on mount     │  │
│  │  - Status monitoring     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  Audio Prefetching       │  │
│  │  - Extracts captions     │  │
│  │  - Prefetches all audio  │  │
│  │  - Shows loading status  │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  Audio-Driven Playback   │  │
│  │  - Plays audio segments  │  │
│  │  - Syncs animations      │  │
│  │  - Updates captions      │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
         │
         │ TTS requests
         ▼
┌─────────────────────────────────┐
│     Audio Service               │
│  ┌──────────────────────────┐  │
│  │  Cache Management        │  │
│  │  - Map<text, AudioItem>  │  │
│  │  - Base64 & Blob storage │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  Request Queue           │  │
│  │  - Concurrent requests   │  │
│  │  - Progress tracking     │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
         │
         │ Socket.IO
         ▼
┌─────────────────────────────────┐
│   WebSocket Server (Node.js)    │
│  - Receives text                │
│  - Calls TTS service            │
│  - Returns audio (base64 WAV)  │
└─────────────────────────────────┘
         │
         │ HTTP POST
         ▼
┌─────────────────────────────────┐
│   TTS Service (FastAPI/Python)  │
│  - Glow-TTS model               │
│  - Synthesizes speech           │
│  - Returns WAV file             │
└─────────────────────────────────┘
```

## Flow

### 1. Lesson Load
```typescript
// When lesson changes in Whiteboard component
useEffect(() => {
  if (!lesson || !isSocketConnected) return;
  
  // Extract caption texts
  const captionTexts = lesson.captions.map(c => c.text);
  
  // Prefetch all audio
  audioService.prefetchAudios(captionTexts);
}, [lesson, isSocketConnected]);
```

### 2. Prefetching Process
```typescript
// audioService.prefetchAudios()
- Adds texts to prefetch queue
- Processes queue with concurrency control (max 3 concurrent)
- For each text:
  1. Creates cache entry with isLoading: true
  2. Sends WebSocket request (text-to-speech event)
  3. Waits for audio-response event
  4. Converts base64 to Blob and creates URL
  5. Updates cache with audioUrl and isLoading: false
```

### 3. Playback Start
```typescript
// When user clicks Play
- Finds current audio segment based on pauseTimeRef
- Calls playNextAudio() to start sequential playback
```

### 4. Audio Segment Playback
```typescript
const playNextAudio = async () => {
  // Get current caption text
  const captionText = lesson.captions[audioSegmentIndexRef.current].text;
  
  // Check if audio is ready (from cache)
  if (!audioService.isAudioReady(captionText)) {
    // Wait for audio to be fetched
    await audioService.requestAudio(captionText);
  }
  
  // Play audio
  const audio = audioService.playAudio(captionText);
  
  // Show caption
  setCurrentCaption(captionText);
  
  // When audio ends, play next segment
  audio.onended = () => {
    audioSegmentIndexRef.current++;
    playNextAudio();
  };
};
```

### 5. Animation Synchronization
```typescript
// Animation loop uses audio.currentTime for precise sync
const animate = (timestamp) => {
  // Calculate elapsed time from audio playback
  const currentCaption = lesson.captions[audioSegmentIndexRef.current];
  const elapsed = currentCaption.timestamp + audio.currentTime;
  
  // Update drawings based on elapsed time
  lesson.drawings.forEach((instruction) => {
    if (elapsed >= instruction.timestamp) {
      // Calculate animation progress
      // Render element with progress
    }
  });
};
```

## Key Components

### AudioService (`audio.service.ts`)

**Purpose**: Manages audio fetching, caching, and playback

**Key Methods**:
- `requestAudio(text)` - Request and cache audio for text
- `prefetchAudios(texts)` - Prefetch multiple audio segments
- `getCachedAudio(text)` - Get audio from cache
- `playAudio(text)` - Play cached audio
- `clearCache()` - Clean up blob URLs and cache

**Features**:
- Concurrent request control (max 3 simultaneous)
- Base64 to Blob conversion
- Object URL management
- Progress tracking
- Error handling

### Whiteboard Component Updates

**New State**:
```typescript
const [isSocketConnected, setIsSocketConnected] = useState(false);
const [audioLoadingStatus, setAudioLoadingStatus] = useState<string>('');
const audioSegmentIndexRef = useRef<number>(0);
const waitingForAudioRef = useRef<boolean>(false);
const audioPlayStartTimeRef = useRef<number | null>(null);
const currentAudioRef = useRef<HTMLAudioElement | null>(null);
```

**New Effects**:
1. Socket connection initialization
2. Audio prefetching on lesson load
3. Audio-driven animation loop

## Benefits

### 1. **Smooth Playback**
- Audio is prefetched before playback starts
- No delays between segments
- Sequential playback prevents audio overlap

### 2. **Precise Synchronization**
- Animations sync with actual audio playback time
- Uses `audio.currentTime` for accuracy
- Handles pause/resume correctly

### 3. **Better UX**
- Loading indicators show prefetch progress
- Connection status visible
- Graceful error handling

### 4. **Efficient Resource Usage**
- Audio cached after first fetch
- Concurrent request limiting prevents overload
- Blob URLs properly cleaned up

## Configuration

### Environment Variables
```env
# Client (.env.local)
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Server
PORT=5000
```

### Socket Server
```typescript
// server/src/socket/socket.server.ts
const TTS_SERVICE_URL = 'http://127.0.0.1:8001';
```

### TTS Service
```python
# tts-service/main.py
# Runs on port 8001
# Endpoint: POST /synthesize
```

## Usage Example

```typescript
import { Whiteboard } from '@/components/Whiteboard';
import { socketService } from '@/lib';

function LessonPage() {
  // Socket connects automatically in Whiteboard
  
  return (
    <Whiteboard
      isPlaying={isPlaying}
      lesson={lessonData}
      onTimeUpdate={handleTimeUpdate}
      // ... other props
    />
  );
}
```

## Troubleshooting

### Audio not playing
1. Check socket connection (indicator at top)
2. Verify TTS service is running (port 8001)
3. Check WebSocket server is running (port 5000)
4. Look for errors in browser console

### Slow loading
1. TTS service may be slow on first request (model loading)
2. Check network latency
3. Reduce concurrent request limit if needed

### Synchronization issues
1. Audio and animations might drift on slow connections
2. System uses audio.currentTime as source of truth
3. Pause/resume recalculates sync

## Future Improvements

1. **Preload next lesson** - Start prefetching next page audio
2. **Background synthesis** - Generate all audio upfront
3. **Audio compression** - Use MP3 instead of WAV
4. **Offline mode** - Cache audio in IndexedDB
5. **Adaptive quality** - Lower quality on slow connections
6. **Retry logic** - Auto-retry failed requests
7. **Progress persistence** - Save audio cache between sessions
