import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import type { HttpServer } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { DatabaseCompatibilityException } from '../../application/exceptions/database-compatibility.exception';
import { isDatabaseSchemaCompatibilityError } from '../prisma/is-database-schema-compatibility-error';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaSchemaCompatibilityFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaSchemaCompatibilityFilter.name);

  constructor(applicationRef: HttpServer) {
    super(applicationRef);
  }

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    if (!isDatabaseSchemaCompatibilityError(exception)) {
      super.catch(exception, host);
      return;
    }

    this.logger.error(
      `La base de datos requiere migraciones compatibles (${exception.code}).`,
    );
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = new DatabaseCompatibilityException();
    response.status(mapped.statusCode).json({
      statusCode: mapped.statusCode,
      message: mapped.message,
      error: 'Internal Server Error',
    });
  }
}
