import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  type ImportTransactionContext,
  type ImportUnitOfWork,
} from '@/shared/application/ports/import-unit-of-work';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaImportUnitOfWork implements ImportUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  execute<T>(operation: (context: ImportTransactionContext) => Promise<T>) {
    return this.prisma.$transaction(
      (transaction) =>
        operation(transaction as unknown as ImportTransactionContext),
      { maxWait: 10_000, timeout: 300_000 },
    );
  }
}

export function toPrismaImportTransaction(
  context: ImportTransactionContext,
): Prisma.TransactionClient {
  return context as unknown as Prisma.TransactionClient;
}
