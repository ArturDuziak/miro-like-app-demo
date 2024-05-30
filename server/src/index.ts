import express from 'express';
import websockets from './websockets';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

app.get('/', (req, res) => {
  res.send('Welcome to Express & TypeScript Server');
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}\n\n`);
});

websockets(server);

