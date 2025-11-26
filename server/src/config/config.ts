import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  TTS_SERVICE_URL: process.env.TTS_SERVICE_URL || 'http://localhost:8001',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/surge-ai',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  // Google OAuth Configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
};

export default config;
