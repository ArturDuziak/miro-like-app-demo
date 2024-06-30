import { Request, Response } from 'express';

export const getPrivateContent = async (req: Request, res: Response) => {
  return res.json({ message: 'Private Content', user: req.user });
};
