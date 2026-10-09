import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ApplicationExceptionFilter } from '@/shared/infrastructure/filters/application-exception.filter';
import { DomainValidationExceptionFilter } from '@/shared/infrastructure/filters/domain-validation-exception.filter';
import { PrismaSchemaCompatibilityFilter } from '@/shared/infrastructure/filters/prisma-schema-compatibility.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(
    new ApplicationExceptionFilter(),
    new DomainValidationExceptionFilter(),
    new PrismaSchemaCompatibilityFilter(),
  );
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
