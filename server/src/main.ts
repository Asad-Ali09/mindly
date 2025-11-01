import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import config from './config/config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { initializeSocket } from './socket/socket.server';
import { connectDatabase } from './config/database';

const app = express();
const httpServer = createServer(app);
const PORT = typeof config.port === 'string' ? parseInt(config.port, 10) : config.port;

app.use(cors({
  origin: config.FRONTEND_URL,
  // credentials: true,
}));


app.use(express.json());

// Initialize Socket.IO
initializeSocket(httpServer);



app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

// Health check endpoint for Fly.io
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check TTS service health
    const ttsHealthy = await fetch(`${config.TTS_SERVICE_URL}/health`)
      .then(r => r.ok)
      .catch(() => false);
    
    res.status(200).json({
      status: 'healthy',
      services: {
        api: 'ok',
        tts: ttsHealthy ? 'ok' : 'degraded'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Service check failed'
    });
  }
});

// Mount API routes
app.use('/api', routes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start HTTP server - listen on 0.0.0.0 for external access (required for Docker/Fly.io)
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
      console.log(`🔌 Socket.IO is ready for connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
