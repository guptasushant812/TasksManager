import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { status?: number; code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err.message);

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
