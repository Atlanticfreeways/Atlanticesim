import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  constructor() {
    super('AppLogger');
  }

  /**
   * Log HTTP request
   */
  logRequest(method: string, path: string, userId?: string, statusCode?: number): void {
    const userInfo = userId ? ` [User: ${userId}]` : '';
    const statusInfo = statusCode ? ` [Status: ${statusCode}]` : '';
    this.log(`${method} ${path}${userInfo}${statusInfo}`);
  }

  /**
   * Log API response
   */
  logResponse(method: string, path: string, statusCode: number, duration: number): void {
    this.log(`${method} ${path} - ${statusCode} (${duration}ms)`);
  }

  /**
   * Log error with context
   */
  logError(error: Error, context: string, userId?: string): void {
    const userInfo = userId ? ` [User: ${userId}]` : '';
    this.error(`[${context}]${userInfo} ${error.message}`, error.stack);
  }

  /**
   * Log warning
   */
  logWarning(message: string, context: string, userId?: string): void {
    const userInfo = userId ? ` [User: ${userId}]` : '';
    this.warn(`[${context}]${userInfo} ${message}`);
  }

  /**
   * Log payment operation
   */
  logPayment(orderId: string, amount: number, currency: string, status: string, userId?: string): void {
    const userInfo = userId ? ` [User: ${userId}]` : '';
    this.log(`Payment - Order: ${orderId}, Amount: ${amount} ${currency}, Status: ${status}${userInfo}`);
  }

  /**
   * Log order operation
   */
  logOrder(orderId: string, operation: string, status: string, userId?: string): void {
    const userInfo = userId ? ` [User: ${userId}]` : '';
    this.log(`Order - ID: ${orderId}, Operation: ${operation}, Status: ${status}${userInfo}`);
  }

  /**
   * Log eSIM operation
   */
  logESim(esimId: string, operation: string, status: string, userId?: string): void {
    const userInfo = userId ? ` [User: ${userId}]` : '';
    this.log(`eSIM - ID: ${esimId}, Operation: ${operation}, Status: ${status}${userInfo}`);
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, email: string, success: boolean): void {
    const result = success ? 'SUCCESS' : 'FAILED';
    this.log(`Auth - Event: ${event}, Email: ${email}, Result: ${result}`);
  }

  /**
   * Log database operation
   */
  logDatabase(operation: string, table: string, duration: number): void {
    this.log(`Database - Operation: ${operation}, Table: ${table}, Duration: ${duration}ms`);
  }

  /**
   * Log external service call
   */
  logExternalService(service: string, operation: string, status: string, duration: number): void {
    this.log(`External Service - Service: ${service}, Operation: ${operation}, Status: ${status}, Duration: ${duration}ms`);
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimit(userId: string, endpoint: string, limit: number): void {
    this.warn(`Rate Limit Exceeded - User: ${userId}, Endpoint: ${endpoint}, Limit: ${limit}`);
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, details: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): void {
    const method = severity === 'CRITICAL' ? 'error' : severity === 'HIGH' ? 'error' : 'warn';
    this[method](`Security Event [${severity}] - ${event}: ${details}`);
  }

  /**
   * Extract error details
   */
  extractErrorDetails(error: any): {
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
