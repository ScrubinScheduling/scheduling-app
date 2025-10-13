import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import { requireSession, ClerkExpressWithAuth } from '@clerk/express';
import { prisma } from './db';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/test-endpoint', (req, res) => {
  res.json({messaage: "App has been deployed v3"});
}) 
// app.get('/me', ClerkExpressWithAuth(), requireSession(), (req, res) => {
//   res.json({ userId: req.auth?.userId, sessionId: req.auth?.sessionId });
// });

// app.get('/users', ClerkExpressWithAuth(), requireSession(), async (_req, res) => {
//   const users = await prisma.user.findMany({ take: 10 });
//   res.json(users);
// });

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});


