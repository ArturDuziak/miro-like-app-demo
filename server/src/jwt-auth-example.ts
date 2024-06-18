import express from 'express';
import websockets from './websockets';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

const prisma = new PrismaClient();

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  };

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, tokenPayload) => {
    if (err) {
      return res.sendStatus(403);
    };

    req.user = {
      role: tokenPayload.user.role,
      id: tokenPayload.user.id,
      email: tokenPayload.user.email,
    };

    req.tokenInfo = tokenPayload.token_info;

    next();
  });
};

app.get('/', authenticateToken, (req, res) => {
  return res.send(`Welcome to Express & TypeScript Server ${req.user.role}. Token refresh: ${req.tokenInfo.refreshed}`);
});

app.post('/important-action', authenticateToken, (req, res) => {
  if(req.tokenInfo.refreshed) {
    return res.status(403).send('Login is required');
  };

  return res.send(`Thanks for logging in. You are authorized to perform this action`);
});

app.post('/register', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();

    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role
      }
    });

    return res.status(201).json({ id: user.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).send({
          error: 'User with this email already exists'
        });
      }
    }

    return res.status(500).send('Error creating user');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email: username
    }
  });

  if (!user) {
    return res.status(401).send('Unauthorized');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).send('Unauthorized');
  };

  const accessToken = jwt.sign({ user, token_info: { refreshed: false } }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20s' })
  const refreshToken = jwt.sign({ user }, process.env.REFRESH_TOKEN_SECRET);

  await prisma.$transaction([
    prisma.jwtRefreshToken.deleteMany({
      where: {
        user_id: user.id,
      }
    }),
    prisma.jwtRefreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
      }
    }),
  ])

  return res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
});

app.post('/token', async (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) {
    return res.sendStatus(401);
  };

  const refreshTokenExists = await prisma.jwtRefreshToken.findUnique({
    where: {
      token: refreshToken
    }
  });

  if (!refreshTokenExists) {
    return res.sendStatus(403);
  };

  try {
    const { user } = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const accessToken = jwt.sign({ user, token_info: { refreshed: true } }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20s' });

    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  } catch {
    return res.sendStatus(403);
  };
});

app.post('/revoke', async (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) {
    return res.sendStatus(401);
  };

  await prisma.jwtRefreshToken.deleteMany({
    where: {
      token: refreshToken
    }
  });

  return res.json({ status: 'OK' })
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}\n\n`);
});

websockets(server);

