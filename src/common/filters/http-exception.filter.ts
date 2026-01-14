import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const { message: msg, error: err } = exceptionResponse as any;
        message = msg || message;
        error = err || error;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      // Handle Prisma errors
      if (exception.name === 'PrismaClientValidationError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'Validation Error';
        message = 'Invalid request data';
      } else if (exception.name === 'PrismaClientKnownRequestError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'Database Error';
        message = 'Database operation failed';
      } else if (exception.name === 'PrismaClientRustPanicError') {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = 'Database Error';
        message = 'Database connection error';
      } else {
        message = exception.message || 'Internal server error';
      }

      // Log unexpected errors
      this.logger.error(
        `Unhandled exception: ${exception.name}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Don't expose sensitive error details in production
    if (process.env.NODE_ENV === 'production' && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse.message = 'An unexpected error occurred';
    }

    response.status(status).json(errorResponse);
  }
}
