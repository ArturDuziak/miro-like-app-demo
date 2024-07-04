import { NextFunction, Request, Response } from "express";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[START] Request: ${req.method} ${req.url}`);
  const start = Date.now();

  next();

  const timeTaken = Date.now() - start;
  console.log(`[END] Request ${req.method} ${req.url} took ${timeTaken}ms`);
}
