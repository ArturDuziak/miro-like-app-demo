import { Request, Response } from 'express';

export const getPublicContentHandler = async (req: Request, res: Response) => {
  return res.json({ message: 'Public Content', user: req.user });
};
