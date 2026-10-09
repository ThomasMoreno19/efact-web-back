import { Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/infrastructure/prisma/prisma.module';
import { CompanyExcelImportTokenService } from './company-excel-import-token.service';

@Module({
  imports: [PrismaModule],
  providers: [CompanyExcelImportTokenService],
  exports: [CompanyExcelImportTokenService],
})
export class CompanyExcelImportTokenModule {}
