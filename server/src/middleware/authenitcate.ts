import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  };

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err: any, tokenPayload: any) => {
    if (err) {
      return res.sendStatus(401);
    };

    req.user = tokenPayload.user;

    next();
  });
};
