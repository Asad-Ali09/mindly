import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import config from './config/config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { initializeSocket } from './socket/socket.server';

const app = express();
const httpServer = createServer(app);
const PORT = config.port;

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

// Mount API routes
app.use('/api', routes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Socket.IO is ready for connections`);
});
