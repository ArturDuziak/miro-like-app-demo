import express from 'express';
import websockets from './websockets';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import routes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

const prisma = new PrismaClient();

app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.use(express.json());

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}\n\n`);

  routes(app);
});

websockets(server);

