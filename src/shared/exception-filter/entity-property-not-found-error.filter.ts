import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Response } from 'express';
import { EntityPropertyNotFoundError } from 'typeorm';

/**
 * Handles thrown EntityPropertyNotFoundErrors
 */
@Catch(EntityPropertyNotFoundError)
export class EntityPropertyNotFoundErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(EntityPropertyNotFoundErrorFilter.name);

  catch(exception: EntityPropertyNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = HttpStatus.BAD_REQUEST;
    const { name: error, message } = exception;

    this.logger.error(message);

    response.status(statusCode).json({
      message,
      error,
      statusCode
    });
  }
}
