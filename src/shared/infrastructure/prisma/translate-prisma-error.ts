import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseCompatibilityException } from '@/shared/application/exceptions/database-compatibility.exception';
import { isDatabaseSchemaCompatibilityError } from './is-database-schema-compatibility-error';

export type PrismaOperation = 'delete' | 'write';

const logger = new Logger('PrismaDatabaseCompatibility');

export function translatePrismaError(
  error: unknown,
  operation: PrismaOperation = 'write',
): never {
  if (isDatabaseSchemaCompatibilityError(error)) {
    const code =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : error instanceof Error
          ? error.name
          : 'unknown';
    logger.error(
      `La base de datos requiere migraciones compatibles (${code}).`,
    );
    throw new DatabaseCompatibilityException();
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException('Ya existe un registro con ese valor único.');
    }

    if (error.code === 'P2003') {
      if (operation === 'delete') {
        throw new ConflictException(
          'No se puede eliminar el registro porque tiene información relacionada.',
        );
      }

      throw new BadRequestException(
        'La empresa o la relación indicada no existe.',
      );
    }
  }

  throw error;
}
