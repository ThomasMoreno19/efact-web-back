import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { ApplicationException } from '../../application/exceptions/application.exception';

@Catch(ApplicationException)
export class ApplicationExceptionFilter implements ExceptionFilter<ApplicationException> {
  catch(exception: ApplicationException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body: Record<string, unknown> = {
      statusCode: exception.statusCode,
      message: exception.message,
      error: exception.statusCode === 404 ? 'Not Found' : 'Application Error',
    };
    if ('errors' in exception) body.errors = exception.errors;
    response.status(exception.statusCode).json(body);
  }
}
