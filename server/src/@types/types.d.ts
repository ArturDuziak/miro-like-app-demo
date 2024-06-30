export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        role: string;
      };
      tokenInfo?: {
        refreshed: boolean;
      };
      prisma: import('@prisma/client').PrismaClient;
    }
  }
}
