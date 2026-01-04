import type { RequestHandler } from 'express';

export const requestLogger: RequestHandler = (req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.info(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

