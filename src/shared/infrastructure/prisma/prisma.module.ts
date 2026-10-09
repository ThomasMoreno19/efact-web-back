import { Global, Module } from '@nestjs/common';
import { IMPORT_UNIT_OF_WORK } from '@/shared/application/ports/import-unit-of-work';
import { PrismaImportUnitOfWork } from './prisma-import-unit-of-work';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaImportUnitOfWork,
    { provide: IMPORT_UNIT_OF_WORK, useExisting: PrismaImportUnitOfWork },
  ],
  exports: [PrismaService, IMPORT_UNIT_OF_WORK],
})
export class PrismaModule {}
