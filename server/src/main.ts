import express, { Request, Response } from 'express';
import config from './config/config';
import routes from './routes';

const app = express();
const PORT = config.port;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

// Mount API routes
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
