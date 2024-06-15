FROM node:20.11.1-alpine3.18

RUN apk add --no-cache curl bash
RUN npm install -g prisma@5.3.1 ts-node pnpm@8.15.7

WORKDIR /app

COPY ./apps/prisma/schema.prisma .
COPY ./apps/prisma/migrations ./migrations
COPY ./apps/prisma/package.json ./package.json
COPY ./apps/prisma/seeds ./seeds
COPY ./apps/prisma/seed.ts ./seed.ts
COPY ./apps/prisma/tsconfig.json ./tsconfig.json

RUN pnpm install
