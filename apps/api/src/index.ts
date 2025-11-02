import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './db';
import { randomInt, randomUUID } from 'crypto';
import testRoutes from './routes/test'
import shiftRoutes from './routes/shifts'

const app = express();

app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', testRoutes);
app.use('/api/shifts', shiftRoutes);


const port = process.env.PORT ?? 4000
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});


