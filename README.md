# 🌟 AI Teaching Platform — The Future of Personalized Learning

<div align="center">

![Project Banner](./docs/images/banner.png)
*Where AI Becomes Your Personal Teacher*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-green?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?style=flat-square&logo=socket.io)](https://socket.io/)
[![Python](https://img.shields.io/badge/Python-3.10-blue?style=flat-square&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## 🎯 Overview

Imagine stepping into a classroom where the teacher knows exactly what you need, when you need it — and never loses patience. **AI Teaching Platform** is a revolutionary educational system that transforms learning into a truly interactive experience powered by artificial intelligence, creativity, and 3D immersion.

Unlike traditional e-learning platforms, this system creates a dynamic, adaptive learning environment where:
- **AI constructs** your entire learning journey in real-time
- **3D avatars** bring lessons to life with natural speech and expressions
- **Interactive whiteboards** visualize concepts through dynamic diagrams
- **Real-time conversation** allows you to ask questions and get instant clarification
- **Personalized assessments** test your understanding and track progress

![Landing Page](./docs/images/landing-page.png)
*Landing page showcasing the platform's capabilities*

---

## ✨ Key Features

### 🎓 AI-Powered Lesson Generation

The AI dynamically constructs complete learning experiences:
- **Intelligent Outline Creation**: Automatically breaks down any topic into digestible sections and pages
- **Adaptive Difficulty**: Adjusts content complexity based on your knowledge level (beginner, intermediate, advanced)
- **Structured Learning Paths**: Creates logical progression through concepts
- **Time-Estimated Modules**: Each section includes duration estimates for better planning

![Lesson Outline](./docs/images/lesson-outline.png)
*AI-generated lesson outline with sections and estimated durations*

### 💬 Real-Time Interactive Learning

Experience true conversational learning:
- **Ask Questions Anytime**: Interrupt the lesson to seek clarification
- **Context-Aware Responses**: AI understands the current lesson context
- **Smart Redirection**: Gently guides you back on track when curiosity drifts too far
- **Natural Dialogue**: Conversational AI that adapts to your learning style

![Interactive Chat](./docs/images/interactive-chat.png)
*Real-time Q&A during lesson*

### 🎨 Visual Whiteboard System

Complex concepts come alive through dynamic visualizations:
- **Vector Diagrams**: Lines, arrows, circles, polygons drawn in real-time
- **Mathematical Graphs**: Plot functions and visualize equations
- **Annotations**: Text labels, highlights, and emphasis
- **Synchronized Timing**: Drawings appear in perfect sync with the lecture
- **Progressive Revelation**: Concepts build visually as the AI explains

![Whiteboard](./docs/images/whiteboard.png)
*Interactive whiteboard with real-time vector drawings*

### 🗣️ 3D Avatar Teacher

A lifelike AI instructor brings engagement to learning:
- **Natural Speech**: High-quality text-to-speech with realistic voice
- **Lip Synchronization**: Mouth movements perfectly matched to audio
- **Facial Expressions**: Dynamic expressions (smile, surprise, thinking, etc.)
- **Gesture Animations**: Natural body language during teaching
- **Built with Three.js**: Smooth 3D rendering and animations

![3D Avatar](./docs/images/avatar-teacher.png)
*3D AI teacher with facial expressions and lip sync*

### 🧠 Intelligent Assessment System

Learning is reinforced through smart quizzes:
- **Auto-Generated Questions**: AI creates relevant MCQs based on lesson content
- **Multiple Question Types**: Single and multiple-choice questions
- **Instant Feedback**: Immediate scoring and explanations
- **Progress Tracking**: Performance data stored for analytics
- **Adaptive Difficulty**: Questions adjust based on your mastery level

![Quiz Interface](./docs/images/quiz-interface.png)
*AI-generated quiz after lesson completion*

### 📊 Comprehensive Dashboard

Track your learning journey:
- **Learning Streaks**: Monitor daily study consistency
- **Activity Charts**: Visualize time spent learning (weekly/monthly/yearly)
- **Progress Statistics**: Overall completion rates and scores
- **Lesson History**: Access all completed and ongoing lessons
- **Quiz Analytics**: Review past quiz performances
- **Goal Tracking**: Set and monitor learning objectives

![Dashboard](./docs/images/dashboard.png)
*Student dashboard with progress tracking*

### 📝 Personal Notes & Resources

Every lesson creates lasting resources:
- **Auto-Generated Notes**: AI creates comprehensive study notes
- **Downloadable Content**: Save notes for offline review
- **Lesson Summaries**: Quick reference guides for each topic
- **Quiz History**: Review past assessments and mistakes
- **Resource Library**: Centralized access to all learning materials

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 (React 19.1.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom design system
- **3D Rendering**: Three.js, React Three Fiber, React Three Drei
- **Animations**: Framer Motion, Motion library
- **UI Components**: Radix UI primitives
- **State Management**: Zustand
- **Real-time Communication**: Socket.IO Client
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend (Node.js Server)
- **Runtime**: Node.js 20.x
- **Framework**: Express 5.1.0
- **Language**: TypeScript 5
- **Database**: MongoDB 8.19 with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **AI Integration**: Google Generative AI (Gemini)
- **Real-time**: Socket.IO 4.8
- **CORS**: Cross-Origin Resource Sharing configured

### TTS Service (Python Microservice)
- **Framework**: FastAPI 0.115
- **Server**: Uvicorn with standard features
- **TTS Engine**: Coqui TTS 0.22.0 (Glow-TTS model)
- **Audio Processing**: PyTorch 2.1.0, Torchaudio 2.1.0
- **Audio Format**: WAV files with caching
- **Validation**: Pydantic 2.9

### DevOps & Deployment
- **Containerization**: Docker, Docker Compose
- **Process Management**: Supervisor (multi-service container)
- **Cloud Platform**: Fly.io (production deployment)
- **Version Control**: Git
- **Package Management**: npm, pip

---

## 🏗️ Architecture

The platform follows a modern microservices architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Pages     │  │  Components  │  │   3D Avatar      │   │
│  │  (Routes)   │  │   (UI/UX)    │  │  (Three.js)      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         State Management (Zustand)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP & WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                   NODE.JS SERVER (Express)                   │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   REST API   │  │  Socket.IO  │  │   AI Service     │   │
│  │  (Routes)    │  │  (Real-time)│  │   (Gemini)       │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         MongoDB (User, Lessons, Quizzes)           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP (TTS Request)
                            │
┌─────────────────────────────────────────────────────────────┐
│                 TTS SERVICE (Python/FastAPI)                 │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  FastAPI     │  │  Coqui TTS  │  │   Audio Cache    │   │
│  │  Endpoints   │  │  (Glow-TTS) │  │   (WAV files)    │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow:

1. **User Interaction** → Client sends request to Node.js server
2. **AI Processing** → Server uses Gemini AI to generate lesson content
3. **Lesson Delivery** → Content streamed to client via Socket.IO
4. **Text-to-Speech** → Server forwards text to TTS microservice
5. **Audio Playback** → TTS returns audio, client plays with lip-sync
6. **State Persistence** → User progress saved to MongoDB

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **Python** 3.10 or higher ([Download](https://www.python.org/))
- **MongoDB** 5.0 or higher ([Download](https://www.mongodb.com/try/download/community))
  - Or use MongoDB Atlas (cloud database)
- **Git** ([Download](https://git-scm.com/))
- **npm** (comes with Node.js)
- **pip** (comes with Python)

### Required API Keys:
- **Google Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 🚀 Installation Guide

Follow these steps to set up the project locally:

### Step 1: Clone the Repository

```bash
git clone https://github.com/Asad-Ali09/surge-ai-hackathon.git
cd surge-ai-hackathon
```

![Clone Repository](./docs/images/git-clone.png)

---

### Step 2: Set Up MongoDB

#### Option A: Local MongoDB

1. Start MongoDB service:

**Windows (PowerShell):**
```powershell
# Start MongoDB as a service
net start MongoDB

# OR if installed manually, run:
mongod --dbpath "C:\data\db"
```

**macOS/Linux:**
```bash
# Using Homebrew
brew services start mongodb-community

# OR manually
sudo mongod --dbpath /data/db
```

2. Verify MongoDB is running:
```bash
mongo --eval "db.version()"
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)
4. Whitelist your IP address in Atlas security settings

![MongoDB Setup](./docs/images/mongodb-setup.png)

---

### Step 3: Configure Environment Variables

#### Server Configuration

Create `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configurations:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# For local MongoDB:
MONGO_URI=mongodb://localhost:27017/surge-ai
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/surge-ai

# Google Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# JWT Secret (change in production!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Service URLs
FRONTEND_URL=http://localhost:3000
TTS_SERVICE_URL=http://localhost:8001
```

**🔑 Getting Your Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

![Gemini API Key](./docs/images/gemini-api-key.png)

#### Client Configuration

Create `.env.local` file in the `client` directory:

```bash
cd ../client
```

Create `client/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Socket.IO Connection
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

![Environment Setup](./docs/images/env-setup.png)

---

### Step 4: Install Dependencies

#### Install Server Dependencies

```bash
cd server
npm install
```

This will install:
- Express.js framework
- MongoDB/Mongoose ODM
- Socket.IO for real-time communication
- Google Generative AI SDK
- Authentication libraries (JWT, bcryptjs)
- TypeScript and build tools

#### Install Client Dependencies

```bash
cd ../client
npm install
```

This will install:
- Next.js framework
- React and React DOM
- Three.js and React Three Fiber
- Socket.IO client
- Tailwind CSS and UI components
- State management and utilities

#### Install TTS Service Dependencies

```bash
cd ../tts-service
pip install -r requirements.txt
```

This will install:
- FastAPI framework
- Coqui TTS engine
- PyTorch (CPU version)
- Audio processing libraries

**Note:** TTS installation may take 5-10 minutes as it downloads machine learning models.

![Dependencies Installation](./docs/images/npm-install.png)

---

### Step 5: Build the Server

The TypeScript server needs to be compiled:

```bash
cd ../server
npm run build
```

This creates the `dist` directory with compiled JavaScript files.

---

### Step 6: Start All Services

You'll need **three separate terminal windows** to run all services:

#### Terminal 1: Start TTS Service

```bash
cd tts-service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Wait for: `Application startup complete` message

![TTS Service Running](./docs/images/tts-service-running.png)

#### Terminal 2: Start Node.js Server

```bash
cd server
npm run dev
```

Wait for: `Server is running on port 5000` and `MongoDB connected successfully`

![Server Running](./docs/images/server-running.png)

#### Terminal 3: Start Client

```bash
cd client
npm run dev
```

Wait for: `Ready started server on 0.0.0.0:3000`

![Client Running](./docs/images/client-running.png)

---

### Step 7: Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the landing page! 🎉

![Application Running](./docs/images/app-running.png)

---

## 📚 Usage Guide

### First Time Setup

#### 1. Create an Account

1. Click **"Get Started"** or **"Sign Up"** on the landing page
2. Fill in your details:
   - Name
   - Email address
   - Password (minimum 6 characters)
3. Click **"Sign Up"**

![Sign Up](./docs/images/signup-page.png)

#### 2. Login

1. Enter your email and password
2. Click **"Login"**
3. You'll receive a JWT token for authentication

![Login](./docs/images/login-page.png)

---

### Starting Your First Lesson

#### 1. Access the Dashboard

After login, you'll land on your personal dashboard showing:
- Learning statistics
- Recent lessons
- Quiz performance
- Activity charts

![Dashboard Overview](./docs/images/dashboard-overview.png)

#### 2. Create a New Lesson

1. Click **"Start New Lesson"** or **"Learn"** in the navigation
2. Enter your desired topic (e.g., "Introduction to Photosynthesis", "Basics of JavaScript", "World War II")
3. Select difficulty level:
   - **Beginner**: Basic concepts and fundamentals
   - **Intermediate**: Deeper understanding with examples
   - **Advanced**: Complex topics with detailed analysis
4. Click **"Generate Lesson"**

![Create Lesson](./docs/images/create-lesson.png)

#### 3. Review Lesson Outline

The AI generates a complete lesson structure:
- Overall objective
- Multiple sections with subtopics
- Estimated duration for each section
- Learning pages within sections

![Lesson Outline](./docs/images/generated-outline.png)

#### 4. Start the Lesson

Click **"Start Lesson"** to begin the interactive learning experience.

---

### During the Lesson

#### Interactive Learning Experience

The lesson page features:

**Left Side:**
- **3D AI Avatar**: Your virtual teacher who speaks and animates
- **Whiteboard**: Visual diagrams drawn in real-time
- **Progress Bar**: Shows current position in the lesson

**Right Side:**
- **Lesson Outline**: Navigate between sections and pages
- **Chat Interface**: Ask questions anytime
- **Controls**: Play/pause, skip, restart

![Lesson Interface](./docs/images/lesson-interface.png)

#### How the Avatar Works

1. **Speech**: AI converts lesson text to natural speech
2. **Lip Sync**: Mouth movements match audio perfectly (using viseme data)
3. **Expressions**: Face changes based on content (smile, surprise, thinking)
4. **Gestures**: Natural body language and hand movements

#### Understanding the Whiteboard

The whiteboard displays:
- **Diagrams**: Circles, rectangles, arrows drawn dynamically
- **Graphs**: Mathematical functions plotted in real-time
- **Text Annotations**: Key points and labels
- **Progressive Drawing**: Elements appear as the AI explains them

Example: Learning about a cell:
1. Circle drawn → "This is a cell membrane"
2. Internal circles appear → "These are organelles"
3. Labels added → "Nucleus, mitochondria, ribosomes"

![Whiteboard Animation](./docs/images/whiteboard-animation.png)

#### Asking Questions

**During any point in the lesson:**

1. Type your question in the chat box
2. Click **"Ask"** or press Enter
3. The AI pauses the lesson
4. Provides a detailed answer
5. Returns to the lesson or explores further based on your needs

**Example Questions:**
- "Can you explain that concept again?"
- "What's an example of this in real life?"
- "How does this relate to [another topic]?"
- "I don't understand the diagram, can you clarify?"

![Ask Question](./docs/images/ask-question.png)

**Smart Context Awareness:**
- AI remembers the current topic
- Understands what "that" or "this" refers to
- Gently redirects if your question is off-topic
- Encourages curiosity while maintaining focus

---

### After the Lesson

#### Taking the Quiz

1. Lesson automatically ends after all pages complete
2. Click **"Take Quiz"** to test your understanding
3. AI-generated questions based on lesson content

**Quiz Features:**
- Multiple choice questions
- Single and multi-select options
- Immediate feedback
- Score calculation
- Correct answer explanations

![Quiz Screen](./docs/images/quiz-screen.png)

#### Reviewing Your Performance

After quiz completion:
- See your score (e.g., "8/10 - 80%")
- Review correct and incorrect answers
- Understand mistakes with explanations
- Retake the quiz if desired

![Quiz Results](./docs/images/quiz-results.png)

#### Accessing Lesson Notes

1. Go to **Dashboard** → **"My Lessons"**
2. Click on any completed lesson
3. View auto-generated study notes:
   - Key concepts summary
   - Important points highlighted
   - Section-by-section breakdown
   - Downloadable for offline study

![Lesson Notes](./docs/images/lesson-notes.png)

---

### Tracking Your Progress

#### Dashboard Analytics

Your dashboard provides comprehensive insights:

**Activity Chart:**
- Daily, weekly, or monthly view
- Hours spent learning
- Trend analysis
- Streak tracking

**Quick Stats:**
- Total lessons completed
- Average quiz score
- Learning streak days
- Total time invested

**Recent Activity:**
- Ongoing lessons (continue where you left off)
- Recently completed lessons
- Recent quiz attempts
- Recommended next topics

![Progress Tracking](./docs/images/progress-tracking.png)

#### Continuing Previous Lessons

1. Navigate to Dashboard
2. Find "Ongoing Lessons" section
3. Click **"Continue"** on any lesson
4. Resume from where you stopped

#### Retaking Quizzes

1. Go to "My Quizzes" in Dashboard
2. Select any previous quiz
3. Click **"Retake Quiz"**
4. Improve your score!

---

## 📁 Project Structure

```
surge-ai-hackathon/
│
├── client/                          # Next.js Frontend Application
│   ├── public/                      # Static assets
│   │   ├── animations/              # Avatar animation configs
│   │   │   └── animations.json      # Facial expressions and gestures
│   │   ├── assets/                  # Images, icons, media files
│   │   └── models/                  # 3D avatar model files (GLTF)
│   │
│   ├── src/
│   │   ├── api/                     # API integration layer
│   │   │   ├── axios.ts             # Axios instance with interceptors
│   │   │   ├── auth.api.ts          # Authentication API calls
│   │   │   ├── ai.api.ts            # AI/Lesson API calls
│   │   │   ├── quiz.api.ts          # Quiz API calls
│   │   │   └── index.ts             # API exports
│   │   │
│   │   ├── app/                     # Next.js App Router pages
│   │   │   ├── page.tsx             # Landing page (/)
│   │   │   ├── layout.tsx           # Root layout with providers
│   │   │   ├── globals.css          # Global styles
│   │   │   ├── login/               # Login page
│   │   │   ├── signup/              # Signup page
│   │   │   ├── dashboard/           # Dashboard with sub-routes
│   │   │   │   ├── page.tsx         # Main dashboard
│   │   │   │   ├── lessons/         # Lessons list
│   │   │   │   └── quizzes/         # Quizzes list
│   │   │   ├── learn/               # Create new lesson
│   │   │   ├── lesson/              # Lesson player page
│   │   │   │   ├── page.tsx         # Server component
│   │   │   │   └── LessonClient.tsx # Client component with 3D
│   │   │   └── quiz/                # Quiz taking page
│   │   │
│   │   ├── components/              # React components
│   │   │   ├── Avatar.tsx           # 3D avatar component (Three.js)
│   │   │   ├── Whiteboard.tsx       # Vector drawing component
│   │   │   ├── LessonPageContent.tsx# Lesson content renderer
│   │   │   ├── LessonOutlineOverlay.tsx # Sidebar navigation
│   │   │   └── ui/                  # Reusable UI components
│   │   │       ├── button.tsx       # Button component
│   │   │       ├── card.tsx         # Card component
│   │   │       ├── input.tsx        # Input component
│   │   │       ├── hero-section.tsx # Landing hero
│   │   │       ├── features.tsx     # Features section
│   │   │       └── ...              # More UI components
│   │   │
│   │   ├── lib/                     # Utility libraries
│   │   │   ├── socket.ts            # Socket.IO client setup
│   │   │   ├── socketService.ts     # Socket service wrapper
│   │   │   ├── lipsyncManager.tsx   # Lip sync audio analyzer
│   │   │   └── utils.ts             # Helper functions
│   │   │
│   │   ├── store/                   # Zustand state management
│   │   │   ├── authStore.ts         # Authentication state
│   │   │   ├── learningStore.ts     # Lesson/quiz state
│   │   │   └── index.ts             # Store exports
│   │   │
│   │   └── types/                   # TypeScript type definitions
│   │       └── lesson.ts            # Lesson-related types
│   │
│   ├── .env.local                   # Environment variables
│   ├── next.config.ts               # Next.js configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── tsconfig.json                # TypeScript config
│   └── package.json                 # Dependencies
│
├── server/                          # Express.js Backend Application
│   ├── src/
│   │   ├── main.ts                  # Application entry point
│   │   │
│   │   ├── config/                  # Configuration files
│   │   │   ├── config.ts            # Environment config loader
│   │   │   └── database.ts          # MongoDB connection
│   │   │
│   │   ├── routes/                  # API route definitions
│   │   │   ├── index.ts             # Route aggregator
│   │   │   ├── user.routes.ts       # Auth routes (/signup, /login)
│   │   │   ├── ai.routes.ts         # AI routes (lesson generation)
│   │   │   └── quiz.routes.ts       # Quiz routes
│   │   │
│   │   ├── controllers/             # Request handlers
│   │   │   ├── user.controller.ts   # User/auth logic
│   │   │   ├── ai.controller.ts     # AI interaction logic
│   │   │   └── quiz.controller.ts   # Quiz management
│   │   │
│   │   ├── services/                # Business logic layer
│   │   │   ├── ai.service.ts        # Gemini AI integration
│   │   │   └── quiz.service.ts      # Quiz generation logic
│   │   │
│   │   ├── models/                  # MongoDB schemas
│   │   │   ├── user.model.ts        # User schema
│   │   │   ├── lessonOutline.model.ts # Lesson schema
│   │   │   └── quiz.model.ts        # Quiz schema
│   │   │
│   │   ├── middlewares/             # Express middlewares
│   │   │   ├── auth.middleware.ts   # JWT verification
│   │   │   └── errorHandler.ts      # Global error handler
│   │   │
│   │   ├── socket/                  # Socket.IO implementation
│   │   │   ├── socket.server.ts     # Socket server setup
│   │   │   └── socket.types.ts      # Socket event types
│   │   │
│   │   └── constants/               # Static data
│   │       └── animations.json      # Avatar animation mappings
│   │
│   ├── dist/                        # Compiled JavaScript (build output)
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   ├── tsconfig.json                # TypeScript config
│   └── package.json                 # Dependencies
│
├── tts-service/                     # Python Text-to-Speech Service
│   ├── main.py                      # FastAPI application
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Docker image definition
│   ├── output/                      # Generated audio files (cached)
│   └── README.md                    # TTS service documentation
│
├── docs/                            # Documentation assets
│   └── images/                      # Screenshots and diagrams
│
├── docker-compose.yml               # Multi-container Docker setup
├── Dockerfile                       # Production Docker image
├── fly.toml                         # Fly.io deployment config
└── README.md                        # This file!
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "60d5ec49f8d2e30015f1c8a7",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "60d5ec49f8d2e30015f1c8a7",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Lesson Endpoints

#### POST `/api/ai/generate-outline`
Generate a structured lesson outline for a given topic.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "topic": "Introduction to Photosynthesis",
  "knowledgeLevel": "beginner"
}
```

**Response:**
```json
{
  "topic": "Introduction to Photosynthesis",
  "overallObjective": "Understand how plants convert light energy...",
  "knowledgeLevel": "beginner",
  "totalEstimatedDuration": "15 minutes",
  "sections": [
    {
      "id": "section-1",
      "title": "What is Photosynthesis?",
      "description": "Basic definition and importance",
      "pages": [
        {
          "id": "page-1-1",
          "title": "Introduction to Plant Energy",
          "description": "How plants get energy from sunlight",
          "estimatedDuration": "2 minutes"
        }
      ]
    }
  ]
}
```

#### POST `/api/ai/generate-page-content`
Generate detailed content for a specific lesson page.

**Request Body:**
```json
{
  "lessonOutline": { /* full outline object */ },
  "pageId": "page-1-1"
}
```

**Response:**
```json
{
  "pageId": "page-1-1",
  "script": "Welcome to our lesson on photosynthesis...",
  "whiteboardContent": {
    "drawings": [ /* array of drawing instructions */ ],
    "captions": [ /* array of timed captions */ ]
  }
}
```

---

### Quiz Endpoints

#### POST `/api/quiz/generate`
Generate quiz questions based on lesson content.

**Request Body:**
```json
{
  "lessonOutline": { /* full outline object */ },
  "numberOfQuestions": 10
}
```

**Response:**
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What is the primary purpose of photosynthesis?",
      "options": [
        { "id": "a", "text": "To produce oxygen" },
        { "id": "b", "text": "To convert light into chemical energy" },
        { "id": "c", "text": "To absorb water" },
        { "id": "d", "text": "To create chlorophyll" }
      ],
      "type": "single",
      "correctAnswer": "b"
    }
  ]
}
```

#### POST `/api/quiz/submit`
Submit quiz answers for grading.

**Request Body:**
```json
{
  "quizId": "60d5ec49f8d2e30015f1c8a8",
  "answers": [
    { "questionId": "q1", "selectedOptions": ["b"] }
  ]
}
```

**Response:**
```json
{
  "score": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "results": [
    {
      "questionId": "q1",
      "correct": true,
      "userAnswer": ["b"],
      "correctAnswer": ["b"]
    }
  ]
}
```

---

### Socket.IO Events

#### Client → Server Events

**`text-to-speech`**: Request audio generation
```typescript
socket.emit('text-to-speech', {
  text: "Hello, welcome to the lesson on photosynthesis."
});
```

#### Server → Client Events

**`audio-response`**: Receive generated audio
```typescript
socket.on('audio-response', (data) => {
  // data.audio: base64 encoded WAV audio
  // data.text: original text
  // data.mimeType: 'audio/wav'
});
```

**`tts-error`**: Error during audio generation
```typescript
socket.on('tts-error', (error) => {
  console.error('TTS Error:', error.message);
});
```

---

## 🐳 Docker Deployment

### Using Docker Compose (Development)

Run all services with a single command:

```bash
docker-compose up --build
```

This starts:
- TTS Service on port 8001
- MongoDB (if configured in compose)
- All services with hot-reload enabled

### Production Docker Build

The main `Dockerfile` creates a multi-service container:

```bash
# Build the image
docker build -t ai-teaching-platform .

# Run the container
docker run -p 5000:5000 -p 8001:8001 \
  -e MONGO_URI=your_mongodb_connection \
  -e GEMINI_API_KEY=your_api_key \
  ai-teaching-platform
```

The container uses **Supervisor** to run:
1. Node.js server (port 5000)
2. TTS service (port 8001)

---

## ☁️ Deployment

### Deploying to Fly.io

The project is configured for Fly.io deployment:

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login to Fly:**
```bash
flyctl auth login
```

3. **Deploy the application:**
```bash
flyctl deploy
```

4. **Set environment secrets:**
```bash
flyctl secrets set MONGO_URI=your_mongodb_uri
flyctl secrets set GEMINI_API_KEY=your_api_key
flyctl secrets set JWT_SECRET=your_jwt_secret
```

5. **Access your app:**
```bash
flyctl open
```

**Configuration:**
- `fly.toml` contains deployment settings
- 2GB RAM, 2 CPUs allocated
- Auto-start/stop machines configured
- Health checks enabled

---

### Deploying to Other Platforms

#### Vercel (Client Only)

```bash
cd client
vercel
```

Note: Deploy server and TTS separately (Railway, Render, etc.)

#### Heroku (Server + TTS)

```bash
heroku create your-app-name
heroku stack:set container
git push heroku main
```

#### AWS/GCP/Azure

Use the provided `Dockerfile` with your preferred container service.

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

1. **Report Bugs**: Open an issue describing the bug
2. **Suggest Features**: Share your ideas for improvements
3. **Submit Pull Requests**: Fix bugs or implement features
4. **Improve Documentation**: Help make docs clearer
5. **Share Feedback**: Tell us about your experience

### Development Workflow

1. **Fork the repository**
```bash
git clone https://github.com/your-username/surge-ai-hackathon.git
```

2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**
- Follow existing code style
- Add comments where needed
- Test thoroughly

4. **Commit your changes**
```bash
git commit -m "Add amazing feature"
```

5. **Push to your fork**
```bash
git push origin feature/amazing-feature
```

6. **Open a Pull Request**
- Describe your changes clearly
- Reference any related issues
- Wait for review

### Code Style Guidelines

- **TypeScript**: Use proper types, avoid `any`
- **React**: Use functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: Explain complex logic
- **Formatting**: Use Prettier (if configured)

---

## 🚀 Future Enhancements

### Planned Features

#### 🎯 Learning Enhancements
- [ ] **Multi-language Support**: Lessons in multiple languages
- [ ] **Voice Input**: Ask questions using speech
- [ ] **Collaborative Learning**: Study with friends in real-time
- [ ] **Adaptive Difficulty**: AI adjusts based on performance
- [ ] **Gamification**: Badges, achievements, leaderboards
- [ ] **Learning Paths**: Curated series of lessons

#### 🎨 Visual Improvements
- [ ] **Multiple Avatar Options**: Choose your teacher's appearance
- [ ] **Custom Themes**: Dark mode, color schemes
- [ ] **Enhanced Whiteboard**: More drawing tools, colors
- [ ] **3D Models**: Rotate and interact with 3D objects
- [ ] **AR Support**: View lessons in augmented reality

#### 🧠 AI Capabilities
- [ ] **Personalized Recommendations**: AI suggests next topics
- [ ] **Learning Style Adaptation**: Visual, auditory, kinesthetic
- [ ] **Doubt Resolution System**: Dedicated Q&A mode
- [ ] **Concept Mapping**: Visual knowledge graphs
- [ ] **Prerequisite Detection**: Ensure you have required knowledge

#### 📊 Analytics & Insights
- [ ] **Detailed Progress Reports**: Weekly/monthly summaries
- [ ] **Weak Area Identification**: Focus on struggles
- [ ] **Learning Patterns**: Best times, durations
- [ ] **Comparative Analytics**: Anonymous peer comparison
- [ ] **Export Reports**: PDF/CSV exports

#### 🔧 Technical Improvements
- [ ] **Offline Mode**: Download lessons for offline viewing
- [ ] **Mobile Apps**: Native iOS/Android applications
- [ ] **Video Recording**: Record lessons for later viewing
- [ ] **Screen Sharing**: Share your whiteboard
- [ ] **API for Educators**: Create custom content
- [ ] **LMS Integration**: Connect with existing platforms

### Room for Collaboration

**Areas where contributors can make impact:**

1. **Content Creation**: Build domain-specific lesson templates
2. **Translation**: Translate UI and content to other languages
3. **Accessibility**: Improve support for users with disabilities
4. **Performance**: Optimize rendering and loading times
5. **Testing**: Write unit and integration tests
6. **Design**: Improve UI/UX with modern design patterns
7. **DevOps**: Enhance deployment and monitoring
8. **Documentation**: Create tutorials and guides

---

## 🎓 Use Cases

### For Students
- Self-paced learning on any topic
- Exam preparation with personalized content
- Curiosity-driven exploration
- Visual learning through diagrams

### For Teachers
- Supplement classroom teaching
- Create flipped classroom content
- Provide extra help to struggling students
- Demonstrate complex concepts visually

### For Professionals
- Learn new skills for career growth
- Quick refreshers on topics
- Understand industry concepts
- Technical skill development

### For Lifelong Learners
- Explore interests and hobbies
- Understand complex news topics
- Learn at your own pace
- No pressure, just curiosity

---

## 🔒 Security & Privacy

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Mongoose schema validation
- **Environment Variables**: Sensitive data not in code
- **HTTPS**: Enforced in production (Fly.io)

**Data Privacy:**
- User data stored securely in MongoDB
- No third-party data sharing
- Audio files cached temporarily
- Quiz results private to users

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use

Conditions:
- Include original license
- State significant changes

---

## 👥 Team

**Project Created By:** Surge AI Hackathon Team

**Repository:** [github.com/Asad-Ali09/surge-ai-hackathon](https://github.com/Asad-Ali09/surge-ai-hackathon)

---

## 🙏 Acknowledgments

- **Google Gemini AI**: Powering the intelligent lesson generation
- **Coqui TTS**: High-quality text-to-speech synthesis
- **Three.js**: Enabling stunning 3D graphics
- **MongoDB**: Reliable data storage
- **Socket.IO**: Real-time bidirectional communication
- **Next.js**: Modern React framework
- **FastAPI**: Fast and elegant Python API framework

Special thanks to all open-source contributors whose libraries made this possible!

---

## 📞 Support

Having issues or questions?

- **GitHub Issues**: [Open an issue](https://github.com/Asad-Ali09/surge-ai-hackathon/issues)
- **Email**: [Contact Us](mailto:support@example.com) *(replace with actual email)*
- **Discussions**: [GitHub Discussions](https://github.com/Asad-Ali09/surge-ai-hackathon/discussions)

---

## ⭐ Show Your Support

If you find this project helpful, please consider:

- ⭐ **Star this repository**
- 🍴 **Fork and contribute**
- 📢 **Share with others**
- 💬 **Provide feedback**

---

<div align="center">

**Made with ❤️ by the Surge AI Hackathon Team**

*Transforming education through AI, one lesson at a time*

</div>
