import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './db';
import { randomInt, randomUUID } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/test', async (req, res) => {
  
  const user = await prisma.user.create({
    data: {
      email: `${randomUUID()}@gmail.com`,
      phoneNumber: `${randomInt(1000000, 30000000)}`
    }
  })

  res.json({user});
}) 



const port = process.env.PORT ?? 4000
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});


