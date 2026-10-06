import { Response } from "express";

export function successResponse(
  res: Response,
  message: string,
  data: unknown = null,
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  code: string,
  statusCode = 500
) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
    },
  });
}