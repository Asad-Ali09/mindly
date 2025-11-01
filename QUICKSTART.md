# 🚀 Quick Start Guide

Get the AI Teaching Platform running on your local machine in 15 minutes!

## ⚡ TL;DR

```bash
# Clone and setup
git clone https://github.com/Asad-Ali09/surge-ai-hackathon.git
cd surge-ai-hackathon

# Setup Server
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and Gemini API key
npm install
npm run build

# Setup Client
cd ../client
npm install
# Create .env.local with API URLs

# Setup TTS Service
cd ../tts-service
pip install -r requirements.txt

# Run (3 terminals needed)
# Terminal 1: cd tts-service && uvicorn main:app --host 0.0.0.0 --port 8001
# Terminal 2: cd server && npm run dev
# Terminal 3: cd client && npm run dev

# Open http://localhost:3000
```

## 📋 Prerequisites Checklist

- [ ] Node.js 20.x or higher installed
- [ ] Python 3.10 or higher installed
- [ ] MongoDB running (local or Atlas connection string)
- [ ] Google Gemini API key obtained
- [ ] Git installed
- [ ] 3 terminal windows available

## 🔑 Get Your API Keys

### Google Gemini API Key (Required)
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

### MongoDB Connection String

**Option A - Local MongoDB:**
```
mongodb://localhost:27017/surge-ai
```

**Option B - MongoDB Atlas (Free Tier):**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster (M0 Free tier)
3. Add database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/surge-ai
```

## 📦 Installation Steps

### Step 1: Clone Repository
```bash
git clone https://github.com/Asad-Ali09/surge-ai-hackathon.git
cd surge-ai-hackathon
```

### Step 2: Configure Server
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000
TTS_SERVICE_URL=http://localhost:8001
```

Install dependencies:
```bash
npm install
npm run build
```

### Step 3: Configure Client
```bash
cd ../client
```

Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Install dependencies:
```bash
npm install
```

### Step 4: Setup TTS Service
```bash
cd ../tts-service
pip install -r requirements.txt
```

⏳ This may take 5-10 minutes (downloads ML models)

## ▶️ Running the Application

### PowerShell (Windows)
Open 3 PowerShell windows:

**Terminal 1 - TTS Service:**
```powershell
cd tts-service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
Wait for: `Application startup complete`

**Terminal 2 - Server:**
```powershell
cd server
npm run dev
```
Wait for: `Server is running on port 5000`

**Terminal 3 - Client:**
```powershell
cd client
npm run dev
```
Wait for: `Ready started server on 0.0.0.0:3000`

### Bash/macOS/Linux
```bash
# Terminal 1
cd tts-service && uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2
cd server && npm run dev

# Terminal 3
cd client && npm run dev
```

## 🌐 Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## ✅ Verify Everything Works

### 1. Check TTS Service
```bash
curl http://localhost:8001/health
```
Should return: `{"status":"healthy"}`

### 2. Check Server
```bash
curl http://localhost:5000/
```
Should return: `Hello World`

### 3. Check Client
Open http://localhost:3000 - you should see the landing page

## 🎯 First Use

1. **Sign Up**: Create an account at http://localhost:3000/signup
2. **Login**: Use your credentials at http://localhost:3000/login
3. **Create Lesson**: 
   - Go to "Learn" or Dashboard
   - Enter topic: "Introduction to Python"
   - Select difficulty: "Beginner"
   - Click "Generate Lesson"
4. **Start Learning**: Wait for outline, then click "Start Lesson"
5. **Interact**: Ask questions in the chat during the lesson

## 🔧 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `net start MongoDB` (Windows) or `brew services start mongodb-community` (macOS)
- Check connection string in `.env`
- For Atlas: Verify IP whitelist and credentials

### TTS Service Port Already in Use
```bash
# Find process using port 8001
netstat -ano | findstr :8001  # Windows
lsof -i :8001                 # macOS/Linux

# Kill the process or use different port
# Edit server/.env: TTS_SERVICE_URL=http://localhost:8002
```

### Server Port Already in Use
```bash
# Change port in server/.env
PORT=5001

# Update client/.env.local accordingly
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

### Missing Gemini API Key
Error: `Invalid API key`
- Verify key in `server/.env`
- Get new key from https://makersuite.google.com/app/apikey
- Ensure no extra spaces or quotes

### Python TTS Installation Issues
```bash
# Ensure pip is updated
python -m pip install --upgrade pip

# Install PyTorch first
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu

# Then install remaining requirements
pip install -r requirements.txt
```

### Client Build Errors
```bash
# Clear Next.js cache
cd client
rm -rf .next
npm install
npm run dev
```

## 🐳 Alternative: Docker Setup

If you have Docker installed:

```bash
# Build and run
docker-compose up --build

# Access at http://localhost:3000
```

Note: Update `docker-compose.yml` with your environment variables

## 📱 Development Tips

### Hot Reload
All services support hot reload:
- **Client**: Auto-refreshes on file changes
- **Server**: Nodemon restarts on changes
- **TTS**: Uvicorn reloads on changes

### Database GUI
View MongoDB data:
- **MongoDB Compass**: https://www.mongodb.com/products/compass
- **Studio 3T**: https://studio3t.com/

### API Testing
Test backend endpoints:
- **Postman**: https://www.postman.com/
- **Thunder Client** (VS Code extension)
- **curl** (command line)

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- Python
- Tailwind CSS IntelliSense
- MongoDB for VS Code

## 📚 Next Steps

After setup:
1. Explore the [README.md](README.md) for full documentation
2. Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
3. Review [docs/SCREENSHOT_GUIDE.md](docs/SCREENSHOT_GUIDE.md) for screenshots
4. Join discussions on GitHub

## 🆘 Still Having Issues?

1. Check [existing issues](https://github.com/Asad-Ali09/surge-ai-hackathon/issues)
2. Open a new issue with:
   - Your OS and versions (Node, Python, MongoDB)
   - Error messages
   - Steps you've tried
   - Terminal output

## ⚙️ Common Development Commands

```bash
# Server
npm run dev       # Development with hot reload
npm run build     # Build TypeScript
npm start         # Production mode

# Client
npm run dev       # Development server
npm run build     # Production build
npm start         # Production server

# TTS Service
uvicorn main:app --reload           # Development
uvicorn main:app --host 0.0.0.0     # Production
```

## 🎉 Success!

If you see:
- ✅ TTS service running on port 8001
- ✅ Server running on port 5000
- ✅ Client running on port 3000
- ✅ MongoDB connected
- ✅ Landing page loads

**Congratulations! You're ready to start developing! 🚀**

---

**Happy Coding!** If you found this helpful, please star ⭐ the repository!
