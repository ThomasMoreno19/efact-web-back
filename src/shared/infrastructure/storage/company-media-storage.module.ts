import { Global, Module } from '@nestjs/common';
import { CompanyMediaStorageService } from './company-media-storage.service';

@Global()
@Module({
  providers: [CompanyMediaStorageService],
  exports: [CompanyMediaStorageService],
})
export class CompanyMediaStorageModule {}
