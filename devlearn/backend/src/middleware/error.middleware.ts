// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('[Error]', err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Prisma unique constraint
  if ((err as any).code === 'P2002') {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  return res.status(500).json({ message: 'Internal server error' });
};
