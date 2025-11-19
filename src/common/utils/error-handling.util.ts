import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

/**
 * Custom error types for better error handling
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_STATE = 'INVALID_STATE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
}

/**
 * Error factory for creating consistent error responses
 */
export class ErrorFactory {
  /**
   * Create a validation error
   */
  static validation(message: string, field?: string, value?: any) {
    return new BadRequestException({
      message,
      field,
      value,
      type: ErrorType.VALIDATION,
    });
  }

  /**
   * Create a not found error
   */
  static notFound(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier ${identifier} not found`
      : `${resource} not found`;
    return new NotFoundException({
      message,
      type: ErrorType.NOT_FOUND,
    });
  }

  /**
   * Create a conflict error (resource already exists)
   */
  static conflict(resource: string, field: string, value: any) {
    return new ConflictException({
      message: `${resource} with ${field} "${value}" already exists`,
      field,
      value,
      type: ErrorType.CONFLICT,
    });
  }

  /**
   * Create an unauthorized error
   */
  static unauthorized(message: string = 'Unauthorized') {
    return new UnauthorizedException({
      message,
      type: ErrorType.UNAUTHORIZED,
    });
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message: string = 'Access denied') {
    return new ForbiddenException({
      message,
      type: ErrorType.FORBIDDEN,
    });
  }

  /**
   * Create an invalid state error
   */
  static invalidState(resource: string, currentState: string, expectedState: string) {
    return new UnprocessableEntityException({
      message: `${resource} is in ${currentState} state, expected ${expectedState}`,
      currentState,
      expectedState,
      type: ErrorType.INVALID_STATE,
    });
  }

  /**
   * Create an external service error
   */
  static externalService(service: string, message: string) {
    return new InternalServerErrorException({
      message: `${service} error: ${message}`,
      service,
      type: ErrorType.EXTERNAL_SERVICE,
    });
  }

  /**
   * Create a database error
   */
  static database(message: string) {
    return new InternalServerErrorException({
      message: `Database error: ${message}`,
      type: ErrorType.DATABASE,
    });
  }

  /**
   * Create an internal server error
   */
  static internal(message: string) {
    return new InternalServerErrorException({
      message,
      type: ErrorType.INTERNAL,
    });
  }
}

/**
 * Error handler for wrapping async operations
 */
export class ErrorHandler {
  /**
   * Wrap an async operation with error handling
   */
  static async wrap<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    errorType: ErrorType = ErrorType.INTERNAL,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return this.handleError(error, errorMessage, errorType);
    }
  }

  /**
   * Handle different error types
   */
  static handleError(error: any, context: string, errorType: ErrorType): never {
    if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof UnprocessableEntityException) {
      throw error;
    }

    const message = error?.message || 'Unknown error';

    switch (errorType) {
      case ErrorType.VALIDATION:
        throw ErrorFactory.validation(message);
      case ErrorType.NOT_FOUND:
        throw ErrorFactory.notFound(context);
      case ErrorType.CONFLICT:
        throw ErrorFactory.conflict(context, 'unknown', 'unknown');
      case ErrorType.UNAUTHORIZED:
        throw ErrorFactory.unauthorized(message);
      case ErrorType.FORBIDDEN:
        throw ErrorFactory.forbidden(message);
      case ErrorType.INVALID_STATE:
        throw ErrorFactory.invalidState(context, 'unknown', 'unknown');
      case ErrorType.EXTERNAL_SERVICE:
        throw ErrorFactory.externalService(context, message);
      case ErrorType.DATABASE:
        throw ErrorFactory.database(message);
      case ErrorType.INTERNAL:
      default:
        throw ErrorFactory.internal(`${context}: ${message}`);
    }
  }

  /**
   * Validate required fields
   */
  static validateRequired(data: any, fields: string[]): void {
    for (const field of fields) {
      if (!data[field]) {
        throw ErrorFactory.validation(`${field} is required`, field);
      }
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ErrorFactory.validation('Invalid email format', 'email', email);
    }
  }

  /**
   * Validate phone format
   */
  static validatePhone(phone: string): void {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      throw ErrorFactory.validation('Invalid phone format', 'phone', phone);
    }
  }

  /**
   * Validate numeric range
   */
  static validateRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw ErrorFactory.validation(
        `${fieldName} must be between ${min} and ${max}`,
        fieldName,
        value,
      );
    }
  }

  /**
   * Validate enum value
   */
  static validateEnum(value: any, enumValues: any[], fieldName: string): void {
    if (!enumValues.includes(value)) {
      throw ErrorFactory.validation(
        `${fieldName} must be one of: ${enumValues.join(', ')}`,
        fieldName,
        value,
      );
    }
  }

  /**
   * Check authorization
   */
  static checkAuthorization(userId: string, resourceOwnerId: string): void {
    if (userId !== resourceOwnerId) {
      throw ErrorFactory.forbidden('You do not have permission to access this resource');
    }
  }

  /**
   * Check resource exists
   */
  static checkExists(resource: any, resourceName: string, identifier?: string): void {
    if (!resource) {
      throw ErrorFactory.notFound(resourceName, identifier);
    }
  }

  /**
   * Check resource does not exist
   */
  static checkNotExists(resource: any, resourceName: string, field: string, value: any): void {
    if (resource) {
      throw ErrorFactory.conflict(resourceName, field, value);
    }
  }

  /**
   * Check valid state transition
   */
  static checkStateTransition(
    currentState: string,
    newState: string,
    validTransitions: Record<string, string[]>,
  ): void {
    const allowedStates = validTransitions[currentState];
    if (!allowedStates || !allowedStates.includes(newState)) {
      throw ErrorFactory.invalidState(
        'Resource',
        currentState,
        allowedStates?.join(' or ') || 'unknown',
      );
    }
  }
}

/**
 * Retry logic for transient failures
 */
export class RetryHandler {
  /**
   * Retry an operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 100,
    backoffMultiplier: number = 2,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries - 1) {
          const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Retry with custom predicate
   */
  static async retryIf<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error) => boolean,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!shouldRetry(error) || attempt === maxRetries - 1) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if error is transient
   */
  static isTransientError(error: any): boolean {
    const transientMessages = [
      'timeout',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'temporarily unavailable',
      'service unavailable',
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    return transientMessages.some(msg => errorMessage.includes(msg));
  }
}

/**
 * Fallback handler for graceful degradation
 */
export class FallbackHandler {
  /**
   * Try primary operation, fall back to secondary
   */
  static async tryWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T,
    shouldFallback?: (error: Error) => boolean,
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      if (shouldFallback && !shouldFallback(error)) {
        throw error;
      }

      return await Promise.resolve(fallback());
    }
  }

  /**
   * Try primary operation, use default value on failure
   */
  static async tryWithDefault<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    shouldUseDefault?: (error: Error) => boolean,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (shouldUseDefault && !shouldUseDefault(error)) {
        throw error;
      }

      return defaultValue;
    }
  }
}

/**
 * Error logging utilities
 */
export class ErrorLogger {
  /**
   * Log error with context
   */
  static logError(
    error: any,
    context: string,
    logger?: any,
  ): void {
    const errorMessage = error?.message || 'Unknown error';
    const errorStack = error?.stack || '';

    if (logger) {
      logger.error(`[${context}] ${errorMessage}`, errorStack);
    } else {
      console.error(`[${context}] ${errorMessage}`, errorStack);
    }
  }

  /**
   * Log warning
   */
  static logWarning(message: string, context: string, logger?: any): void {
    if (logger) {
      logger.warn(`[${context}] ${message}`);
    } else {
      console.warn(`[${context}] ${message}`);
    }
  }

  /**
   * Extract error details
   */
  static extractDetails(error: any): {
    message: string;
    type: string;
    statusCode: number;
    stack?: string;
  } {
    return {
      message: error?.message || 'Unknown error',
      type: error?.constructor?.name || 'Error',
      statusCode: error?.statusCode || 500,
      stack: error?.stack,
    };
  }
}
