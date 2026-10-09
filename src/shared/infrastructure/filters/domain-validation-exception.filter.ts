import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainValidationException } from '../../domain/exceptions/domain-validation.exception';

@Catch(DomainValidationException)
export class DomainValidationExceptionFilter implements ExceptionFilter<DomainValidationException> {
  catch(exception: DomainValidationException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
    });
  }
}
