import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

export interface ErrorResponse {
    success: boolean;
    errorCode: string;
    message: string | string[];
    timestamp: string;
    path: string;
    // Optional: Include stack trace in dev/debug mode if needed
    stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';
        let stack: string | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object') {
                const { message: msg, error: err, errorCode: code } = exceptionResponse as any;
                message = msg || message;
                errorCode = code || 'HTTP_ERROR';
                // Use provided details if available
                if (err) errorCode = err.toUpperCase().replace(/\s+/g, '_');
            } else {
                message = exceptionResponse as string;
            }
        } else if (exception instanceof Error) {
            if (process.env.NODE_ENV !== 'production') {
                stack = exception.stack;
            }

            // Handle Prisma errors
            if (exception.name === 'PrismaClientValidationError') {
                status = HttpStatus.BAD_REQUEST;
                errorCode = 'VALIDATION_ERROR';
                message = 'Invalid request data';
            } else if (exception.name === 'PrismaClientKnownRequestError') {
                // Unique constraint violation
                if ((exception as any).code === 'P2002') {
                    status = HttpStatus.CONFLICT;
                    errorCode = 'CONFLICT_ERROR';
                    const target = (exception as any).meta?.target as string[];
                    message = target ? `${target.join(', ')} already exists` : 'Record already exists';
                } else if ((exception as any).code === 'P2025') {
                    status = HttpStatus.NOT_FOUND;
                    errorCode = 'NOT_FOUND_ERROR';
                    message = 'Record not found';
                } else {
                    status = HttpStatus.BAD_REQUEST;
                    errorCode = 'DATABASE_ERROR';
                    message = 'Database operation failed';
                }
            } else if (exception.name === 'PrismaClientRustPanicError') {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                errorCode = 'DATABASE_PANIC';
                message = 'Database connection error';
            } else {
                message = exception.message || 'Internal server error';
                this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
            }
        } else {
            this.logger.error('Unknown exception type', exception);
        }

        const errorResponse: ErrorResponse = {
            success: false,
            errorCode,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            ...(stack && { stack }),
        };

        // Don't expose sensitive error details in production for 500s
        if (process.env.NODE_ENV === 'production' && status === HttpStatus.INTERNAL_SERVER_ERROR) {
            errorResponse.message = 'An unexpected error occurred';
            delete errorResponse.stack;
        }

        response.status(status).json(errorResponse);
    }
}
