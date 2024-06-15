import express, { Response } from 'express';
import websockets from './websockets';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Prisma, PrismaClient } from '@prisma/client'

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

const prisma = new PrismaClient();

function respondUnauthorized(res: Response) {
  return res.status(401).set('WWW-Authenticate', 'basic').send('Unauthorized');
}

app.use(express.json());

app.use(async (req, res, next) => {
  if (req.path === '/register') {
    return next();
  }

  if (!req.get('Authorization')) {
    return respondUnauthorized(res);
  }

  const [username, password] = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':');

  const user = await prisma.user.findUnique({
    where: {
      email: username
    }
  });

  if (!user) {
    return respondUnauthorized(res);
  }

  try {
    if (await bcrypt.compare(password, user.password)) {
      req.user = { role: user.role };
      next();
    } else {
      return respondUnauthorized(res);
    }
  } catch (error) {
    console.error(error);

    return respondUnauthorized(res);
  }
});

app.get('/', (req, res) => {
  return res.send('Welcome to Express & TypeScript Server');
});

app.get('/example-resource', (req, res) => {
  return res.json({ message: `Hello from the server! ${req.user.role}` });
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
    })

    return res.status(201).json({ id: user.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (error.code === 'P2002') {
        console.log(
          'There is a unique constraint violation, a new user cannot be created with this email'
        )

        return res.status(400).send({
          error: 'User with this email already exists'
        });
      }
    }

    return res.status(500).send('Error creating user');
  }
});


const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}\n\n`);
});

websockets(server);

