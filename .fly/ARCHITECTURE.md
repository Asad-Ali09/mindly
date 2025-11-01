# Fly.io Deployment Architecture

## 🏗️ Single Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Fly.io Machine (VM)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Docker Container (2GB RAM, 2 CPUs)           │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │            Supervisor Process Manager            │ │ │
│  │  │                                                  │ │ │
│  │  │  ┌─────────────────────────────────────────┐    │ │ │
│  │  │  │     Node.js Server (Port 5000)          │    │ │ │
│  │  │  │  ┌──────────────────────────────────┐   │    │ │ │
│  │  │  │  │   Express.js API                 │   │    │ │ │
│  │  │  │  │   • REST endpoints               │   │    │ │ │
│  │  │  │  │   • Socket.IO                    │   │    │ │ │
│  │  │  │  │   • JWT auth                     │   │    │ │ │
│  │  │  │  │   • MongoDB client               │   │    │ │ │
│  │  │  │  └──────────────────────────────────┘   │    │ │ │
│  │  │  │            ↓ localhost:8001              │    │ │ │
│  │  │  └─────────────────────────────────────────┘    │ │ │
│  │  │                                                  │ │ │
│  │  │  ┌─────────────────────────────────────────┐    │ │ │
│  │  │  │     TTS Service (Port 8001)             │    │ │ │
│  │  │  │  ┌──────────────────────────────────┐   │    │ │ │
│  │  │  │  │   FastAPI + Uvicorn              │   │    │ │ │
│  │  │  │  │   • Glow-TTS model               │   │    │ │ │
│  │  │  │  │   • Audio generation             │   │    │ │ │
│  │  │  │  │   • File caching                 │   │    │ │ │
│  │  │  │  │   • Cleanup worker               │   │    │ │ │
│  │  │  │  └──────────────────────────────────┘   │    │ │ │
│  │  │  └─────────────────────────────────────────┘    │ │ │
│  │  │                                                  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↑
                    Port 8080 (HTTPS)
                           ↑
                ┌──────────┴──────────┐
                │                     │
         ┌──────┴──────┐      ┌──────┴──────┐
         │   Frontend  │      │  External   │
         │   Client    │      │   API       │
         │             │      │  Requests   │
         └─────────────┘      └─────────────┘
```

## 🌐 External Connections

```
┌──────────────────────────────────────────────────────────┐
│                  Fly.io Container                        │
│                                                          │
│              ┌─────────────────────┐                     │
│              │   Node.js Server    │                     │
│              └──────────┬──────────┘                     │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ↓                ↓                ↓
  ┌──────────┐    ┌──────────────┐   ┌──────────┐
  │ MongoDB  │    │ Google Gemini│   │ Frontend │
  │  Atlas   │    │     API      │   │  Client  │
  │          │    │              │   │          │
  └──────────┘    └──────────────┘   └──────────┘
   External       External            External
   Database       AI Service          Application
```

## 🔄 Request Flow

### API Request Flow
```
1. Client Request
   ↓
2. Fly.io Load Balancer (HTTPS)
   ↓
3. Container Port 8080 → 5000
   ↓
4. Node.js Express API
   ↓
5. MongoDB / Gemini AI / TTS Service
   ↓
6. Response back to client
```

### TTS Request Flow
```
1. Client → Node.js API (/api/tts/generate)
   ↓
2. Node.js → http://localhost:8001/tts
   ↓
3. TTS Service processes
   ↓
4. Audio file generated
   ↓
5. Response with audio URL
   ↓
6. Client downloads audio
```

### Socket.IO Flow
```
1. Client connects via WebSocket
   ↓
2. Fly.io WebSocket support
   ↓
3. Node.js Socket.IO handler
   ↓
4. Real-time bidirectional communication
   ↓
5. AI service integration
   ↓
6. Live responses to client
```

## 📊 Resource Allocation

```
Container Resources:
├── Total: 2GB RAM, 2 shared CPUs
│
├── Node.js Server
│   ├── Base: ~150-300MB
│   ├── Per connection: ~5-10MB
│   └── Peak: ~500MB
│
└── TTS Service
    ├── Base: ~200MB
    ├── Model loaded: ~400-600MB
    ├── Per request: ~50MB
    └── Peak: ~800MB

Total typical usage: 800MB - 1.2GB
Headroom for spikes: ~800MB
```

## 🚦 Health Check System

```
Fly.io Health Check
        ↓
http://localhost:5000/health
        ↓
┌───────────────────────┐
│  Node.js Health Check │
│                       │
│  Checks:              │
│  ✓ API Server OK      │
│  ✓ TTS Service OK ──→ http://localhost:8001/health
│  ✓ MongoDB OK         │
│                       │
│  Returns:             │
│  {                    │
│    status: "healthy", │
│    services: {        │
│      api: "ok",       │
│      tts: "ok"        │
│    }                  │
│  }                    │
└───────────────────────┘
```

## 🔧 Process Management (Supervisor)

```
Supervisord
├── tts-service
│   ├── Command: uvicorn main:app --host 0.0.0.0 --port 8001
│   ├── Auto-restart: Yes
│   ├── Logs: /var/log/supervisor/tts-service.*.log
│   └── Status: Check via `supervisorctl status`
│
└── node-server
    ├── Command: node dist/main.js
    ├── Auto-restart: Yes
    ├── Logs: /var/log/supervisor/node-server.*.log
    └── Status: Check via `supervisorctl status`
```

## 🔐 Environment Variables

```
Fly.io Secrets (encrypted)
    ↓
├── GEMINI_API_KEY ──→ Node.js → Google AI
├── MONGO_URI ──────→ Node.js → MongoDB Atlas
├── JWT_SECRET ─────→ Node.js → Auth Middleware
└── FRONTEND_URL ───→ Node.js → CORS Config

Runtime Environment
    ↓
├── NODE_ENV=production
├── PORT=5000
├── TTS_SERVICE_URL=http://localhost:8001
└── PYTHONUNBUFFERED=1
```

## 🗄️ File System

```
/app/
├── server/
│   ├── node_modules/     # Node.js dependencies
│   ├── dist/             # Compiled TypeScript
│   └── src/              # Source code
│
└── tts-service/
    ├── main.py           # FastAPI app
    ├── output/           # Generated audio files
    │   └── *.wav         # Auto-cleanup after 1 hour
    └── models/           # TTS model cache
        └── (downloaded)
```

## 📈 Scaling Strategy

```
┌─────────────────────────────────────┐
│     Auto-scaling Configuration      │
├─────────────────────────────────────┤
│                                     │
│  No traffic → Scale to 0            │
│     ↓                               │
│  Request arrives → Start machine    │
│     ↓                               │
│  Machine starts (cold start ~30s)   │
│     ↓                               │
│  Services initialize                │
│     ↓                               │
│  Ready to serve requests            │
│     ↓                               │
│  No traffic for 5 min → Stop        │
│                                     │
└─────────────────────────────────────┘
```

## 🌍 Network Flow

```
Internet
    ↓
Fly.io Edge (Global)
    ↓
Anycast IP (Automatic routing)
    ↓
Nearest Region (e.g., sjc)
    ↓
Load Balancer
    ↓
SSL Termination (HTTPS)
    ↓
Container Port 8080 → 5000
    ↓
Your Application
```

## 💰 Cost Breakdown

```
Free Tier Includes:
├── 3 shared-cpu-1x VMs
├── 160GB bandwidth/month
└── 3GB persistent storage

Your Configuration:
├── 1 shared-cpu-2x VM (2 CPUs)
├── 2GB RAM
└── Auto-scales to 0

Estimated Cost:
└── ~$0/month (if stays in free tier)
    or ~$5-10/month if exceeds
```

---

This architecture allows both services to run efficiently in a single container,
reducing costs and complexity while maintaining good performance and reliability.
