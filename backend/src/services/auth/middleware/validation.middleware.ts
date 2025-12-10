import { Request, Response, NextFunction } from 'express';

export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  // placeholder for request validation
  // e.g. schema.validate(req.body)
  return next();
};
