# Audio-Driven Whiteboard - Quick Start Guide

This guide will help you get the audio-driven whiteboard animation system up and running.

## Prerequisites

- Node.js (v18+)
- Python 3.8+
- npm or yarn

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Client     │────────▶│   Server     │────────▶│ TTS Service  │
│  (Next.js)   │ Socket  │  (Express +  │  HTTP   │  (FastAPI)   │
│  Port 3000   │  .IO    │  Socket.IO)  │  POST   │  Port 8001   │
│              │◀────────│  Port 5000   │◀────────│              │
└──────────────┘         └──────────────┘         └──────────────┘
```

## Setup Steps

### 1. Start TTS Service (FastAPI)

```bash
# Navigate to tts-service directory
cd tts-service

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the TTS service
python main.py
```

The TTS service will start on `http://127.0.0.1:8001`

**Verify it's running:**
```bash
curl http://127.0.0.1:8001/health
# Should return: {"status":"healthy"}
```

### 2. Start Backend Server (Node.js)

```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
npm install

# Start the server in development mode
npm run dev
```

The server will start on `http://localhost:5000`

**The server includes:**
- Express REST API
- Socket.IO WebSocket server
- TTS integration

### 3. Start Frontend (Next.js)

```bash
# Navigate to client directory
cd client

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The client will start on `http://localhost:3000`

## Testing the System

### 1. Check All Services Are Running

Open these URLs in your browser:

- **TTS Service Health**: http://127.0.0.1:8001/health
  - Should show: `{"status":"healthy"}`

- **Backend Server**: http://localhost:5000
  - Should show: "Hello World"

- **Frontend**: http://localhost:3000
  - Should show the main application

### 2. Test Audio Generation

Navigate to a lesson page in the frontend:

1. The whiteboard should show connection indicators at the top
2. When you load a lesson, it will show "Preparing audio (X/Y)..."
3. Click Play to start the lesson
4. You should hear audio narration synchronized with animations

### 3. Monitor Console Logs

**TTS Service Console:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Backend Server Console:**
```
Server is running on http://localhost:5000
Socket.IO is ready for connections
A user connected: [socket-id]
Received text-to-speech request: [text]
Audio sent successfully to client: [socket-id]
```

**Browser Console:**
```
Connecting to socket server: http://localhost:5000
Socket connected: [socket-id]
Prefetching audio for X captions
Playing audio segment 1/X: "[caption text]"
Audio prefetch complete: {ready: X, loading: 0, errors: 0}
```

## Configuration

### Backend Server (.env)

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your-api-key-here
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### TTS Service

Default configuration in `main.py`:
- Port: 8001
- Model: Glow-TTS (English)

## Troubleshooting

### "Connecting to audio service..." stuck

**Problem**: Socket connection not established

**Solutions**:
1. Check backend server is running on port 5000
2. Verify `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
3. Check browser console for connection errors
4. Try refreshing the page

### "Preparing audio..." stuck or slow

**Problem**: TTS service not responding or slow

**Solutions**:
1. Verify TTS service is running: `curl http://127.0.0.1:8001/health`
2. First request may be slow (model loading) - wait 30 seconds
3. Check TTS service console for errors
4. Restart TTS service if needed

### Audio plays but no animation

**Problem**: Animation timing issue

**Solutions**:
1. Check lesson data has `drawings` array with timestamps
2. Verify `totalDuration` matches caption durations
3. Look for errors in browser console
4. Try clicking Reset and Play again

### Audio not playing at all

**Problem**: Browser audio policy or audio data issue

**Solutions**:
1. Check browser console for audio playback errors
2. Ensure user has interacted with page (browser autoplay policy)
3. Verify audio data is being received (Network tab)
4. Try a different browser (Chrome recommended)

### Port conflicts

**Problem**: Port already in use

**Solutions**:

**TTS Service (8001):**
```bash
# Find process
netstat -ano | findstr :8001
# Kill process
taskkill /PID [process-id] /F
```

**Backend Server (5000):**
```bash
# Find process
netstat -ano | findstr :5000
# Kill process
taskkill /PID [process-id] /F
```

**Frontend (3000):**
```bash
# Find process
netstat -ano | findstr :3000
# Kill process
taskkill /PID [process-id] /F
```

## Development Tips

### Hot Reload

All three services support hot reload:
- **TTS Service**: Automatically reloads with uvicorn
- **Backend Server**: Uses nodemon for auto-restart
- **Frontend**: Next.js Fast Refresh

### Debugging Audio Issues

1. **Enable verbose logging** in browser:
   ```javascript
   // In browser console
   localStorage.setItem('debug', 'socket.io-client:*');
   ```

2. **Check audio cache status**:
   ```javascript
   // In browser console
   audioService.getCacheStats()
   ```

3. **Monitor WebSocket events**:
   - Open browser DevTools
   - Go to Network tab
   - Filter by WS (WebSocket)
   - Watch messages in real-time

### Testing Without TTS Service

If you want to test without TTS:

1. Modify `audio.service.ts` to use mock audio
2. Or use pre-recorded audio files
3. Update lesson data with `audioUrl` pointing to static files

## Performance Optimization

### Reduce Audio Loading Time

1. **Pre-generate audio**: Generate all audio files upfront
2. **Cache on server**: Store generated audio on backend
3. **Use MP3**: Convert WAV to MP3 for smaller files
4. **Parallel processing**: Increase concurrent request limit

### Improve Animation Performance

1. **Reduce canvas size**: Lower BASE_WIDTH and BASE_HEIGHT
2. **Simplify drawings**: Fewer points in curves
3. **Optimize easing**: Use simpler easing functions

## Next Steps

1. **Add lesson content**: Create more lesson data in `types/lesson.ts`
2. **Customize TTS**: Try different TTS models or voices
3. **Add controls**: Implement speed control, skip forward/back
4. **Persist cache**: Save audio cache to IndexedDB
5. **Offline mode**: Pre-download all audio for offline use

## Support

For issues or questions:
1. Check the console logs in all three services
2. Review the AUDIO_ARCHITECTURE.md for detailed flow
3. Check the socket service README in `client/src/lib/`
4. Look at the server socket README in `server/src/socket/`
