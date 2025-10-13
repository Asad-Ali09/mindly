import express, { Request, Response } from 'express';
import config from './config/config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();
const PORT = config.port;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

// Mount API routes
app.use('/api', routes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
