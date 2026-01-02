import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export class ResponseUtil {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Resource created'): void {
    this.success(res, data, message, 201);
  }

  static noContent(res: Response): void {
    res.status(204).send();
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: any
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors && { error: errors }),
    };
    res.status(statusCode).json(response);
  }
}
