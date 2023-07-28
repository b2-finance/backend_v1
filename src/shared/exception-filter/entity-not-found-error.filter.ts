import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError } from 'typeorm';

/**
 * Handles thrown EntityNotFoundErrors
 */
@Catch(EntityNotFoundError)
export class EntityNotFoundErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(EntityNotFoundErrorFilter.name);

  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = HttpStatus.NOT_FOUND;
    const { name: error, message } = exception;

    this.logger.error(message);

    response.status(statusCode).json({
      message,
      error,
      statusCode
    });
  }
}
